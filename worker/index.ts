/**
 * Cloudflare Worker — GitHub API proxy.
 *
 * Sits between the browser and GitHub API.
 * The token never reaches the client — it lives here as a secret.
 *
 * Allowed routes (everything else returns 404):
 *   GET /users/:username
 *   GET /users/:username/repos
 *   GET /repos/:username/:repo/languages
 *
 * Deploy:
 *   npx wrangler secret put GITHUB_TOKEN   ← paste token once
 *   npx wrangler deploy
 */

export interface Env {
  GITHUB_TOKEN: string;  // set via: npx wrangler secret put GITHUB_TOKEN
}

const GITHUB_BASE  = 'https://api.github.com';
const ALLOWED_ORIGINS = [
  'https://jarryuser.github.io',  // GitHub Pages
  'http://localhost:5173',         // local dev
  'http://localhost:4173',         // vite preview
];

// Routes the Worker is allowed to proxy — anything else is blocked
const ALLOWED_PATTERNS = [
  /^\/users\/[^/]+$/,                    // GET /users/:username
  /^\/users\/[^/]+\/repos$/,             // GET /users/:username/repos
  /^\/repos\/[^/]+\/[^/]+\/languages$/, // GET /repos/:u/:repo/languages
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url    = new URL(request.url);
    const origin = request.headers.get('Origin') ?? '';

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }), origin);
    }

    // ── Only GET ────────────────────────────────────────────────────────────
    if (request.method !== 'GET') {
      return corsResponse(
        new Response('Method not allowed', { status: 405 }), origin
      );
    }

    // ── Path allowlist ──────────────────────────────────────────────────────
    const path = url.pathname + url.search;   // e.g. /users/jarryuser/repos?per_page=100

    const allowed = ALLOWED_PATTERNS.some(re => re.test(url.pathname));
    if (!allowed) {
      return corsResponse(
        new Response('Not found', { status: 404 }), origin
      );
    }

    // ── Proxy to GitHub ─────────────────────────────────────────────────────
    const ghUrl = `${GITHUB_BASE}${path}`;

    const ghResponse = await fetch(ghUrl, {
      headers: {
        'Accept':        'application/vnd.github.v3+json',
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'User-Agent':    'github-visualizer-proxy/1.0',
      },
    });

    // Forward response body and status, add CORS headers
    const body    = await ghResponse.text();
    const headers = new Headers({
      'Content-Type':  'application/json',
      'Cache-Control': 's-maxage=60',   // cache 60s at Cloudflare edge
    });

    return corsResponse(
      new Response(body, { status: ghResponse.status, headers }),
      origin
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
  return new Response(response.body, {
    status:  response.status,
    headers,
  });
}
