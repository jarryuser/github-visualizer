/**
 * Cloudflare Worker — GitHub API proxy with KV cache.
 *
 * Sits between the browser and GitHub API.
 * The token never reaches the client — it lives here as a secret.
 *
 * Allowed routes (everything else returns 404):
 *   GET /users/:username
 *   GET /users/:username/repos
 *   GET /repos/:username/:repo/languages
 *
 * Caching:
 *   - First request for a path goes to GitHub and stores the response in KV.
 *   - Subsequent requests within TTL are served from KV (no GitHub call).
 *   - TTL differs per route — see ROUTE_TTL below.
 *   - Add ?fresh=1 to any request to bypass the cache (forced refresh).
 *
 * Deploy:
 *   npx wrangler kv:namespace create CACHE   ← once, paste id into wrangler.toml
 *   npx wrangler secret put GITHUB_TOKEN     ← once, paste your PAT
 *   npx wrangler deploy
 */

export interface Env {
  GITHUB_TOKEN: string;     // set via: npx wrangler secret put GITHUB_TOKEN
  CACHE: KVNamespace;       // KV namespace bound in wrangler.toml
}

const GITHUB_BASE = 'https://api.github.com';

const ALLOWED_ORIGINS = [
  'https://jarryuser.github.io', // GitHub Pages
  'http://localhost:5173',       // local dev
  'http://localhost:4173',       // vite preview
];

// Routes the Worker is allowed to proxy + cache TTL (seconds).
// Languages change rarely → cache long. User/repos change more often → short.
const ROUTE_TTL: Array<{ pattern: RegExp; ttl: number }> = [
  { pattern: /^\/users\/[^/]+$/,                    ttl: 600  },  // 10 min
  { pattern: /^\/users\/[^/]+\/repos$/,             ttl: 600  },  // 10 min
  { pattern: /^\/repos\/[^/]+\/[^/]+\/languages$/,  ttl: 3600 },  // 60 min
];

function matchRoute(pathname: string): { ttl: number } | null {
  for (const { pattern, ttl } of ROUTE_TTL) {
    if (pattern.test(pathname)) return { ttl };
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url    = new URL(request.url);
    const origin = request.headers.get('Origin') ?? '';

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }), origin);
    }

    // ── Only GET ────────────────────────────────────────────────────────────
    if (request.method !== 'GET') {
      return corsResponse(
        new Response('Method not allowed', { status: 405 }), origin,
      );
    }

    // ── Path allowlist ──────────────────────────────────────────────────────
    const route = matchRoute(url.pathname);
    if (!route) {
      return corsResponse(
        new Response('Not found', { status: 404 }), origin,
      );
    }

    // ── KV cache lookup ─────────────────────────────────────────────────────
    const cacheKey = url.pathname + url.search.replace(/[?&]fresh=1/, '');
    const fresh    = url.searchParams.get('fresh') === '1';

    if (!fresh) {
      const hit = await env.CACHE.get(cacheKey);
      if (hit !== null) {
        return corsResponse(
          new Response(hit, {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
          }),
          origin,
        );
      }
    }

    // ── Miss → fetch from GitHub ────────────────────────────────────────────
    const ghUrl = `${GITHUB_BASE}${url.pathname}${url.search.replace(/[?&]fresh=1/, '')}`;

    const ghResponse = await fetch(ghUrl, {
      headers: {
        'Accept':        'application/vnd.github.v3+json',
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'User-Agent':    'github-visualizer-proxy/1.0',
      },
    });

    const body = await ghResponse.text();

    // Store only successful responses, and do it after returning so the
    // caller doesn't wait for the KV write.
    if (ghResponse.ok) {
      ctx.waitUntil(
        env.CACHE.put(cacheKey, body, { expirationTtl: route.ttl }),
      );
    }

    return corsResponse(
      new Response(body, {
        status: ghResponse.status,
        headers: {
          'Content-Type':  'application/json',
          'Cache-Control': `s-maxage=${route.ttl}`,
          'X-Cache':       'MISS',
        },
      }),
      origin,
    );
  },
};

// ── CORS helper ────────────────────────────────────────────────────────────────

function corsResponse(response: Response, origin: string): Response {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin',  allowed);
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Expose-Headers', 'X-Cache');
  return new Response(response.body, {
    status:  response.status,
    headers,
  });
}
