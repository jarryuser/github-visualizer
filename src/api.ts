// ── Types ──────────────────────────────────────────────────────────────────────

export interface GithubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GithubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  fork: boolean;
  updated_at: string;
}

export interface LangData {
  name: string;
  bytes: number;
  percent: number;
}

export interface Contribution {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

// ── Base fetch ─────────────────────────────────────────────────────────────────

/**
 * All GitHub API requests go through the Cloudflare Worker proxy.
 * The token lives there as a secret — it never reaches the browser.
 *
 * Local dev:  set VITE_PROXY_URL=http://localhost:8787 in .env
 * Production: Worker is deployed at the URL below automatically.
 */
const PROXY_BASE =
  import.meta.env.VITE_PROXY_URL ??
  'https://github-visualizer-proxy.jarryuser.workers.dev';

async function ghJson<T>(path: string): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`);
  if (res.status === 404) throw new Error('User not found');
  if (res.status === 403) throw new Error('API rate limit exceeded');
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

// ── Endpoints ──────────────────────────────────────────────────────────────────

/**
 * GET /users/{username}
 * Профиль: имя, аватар, bio, кол-во репозиториев, фолловеры.
 */
export async function fetchUser(username: string): Promise<GithubUser> {
  return ghJson<GithubUser>(`/users/${username}`);
}

/**
 * GET /users/{username}/repos?per_page=100&sort=updated
 * Все публичные репозитории пользователя.
 */
export async function fetchRepos(username: string): Promise<GithubRepo[]> {
  return ghJson<GithubRepo[]>(`/users/${username}/repos?per_page=100&sort=updated`);
}

/**
 * GET /repos/{username}/{repo}/languages
 * Байты кода по языкам для одного репозитория.
 */
async function fetchRepoLanguages(
  username: string,
  repo: string
): Promise<Record<string, number>> {
  return ghJson<Record<string, number>>(`/repos/${username}/${repo}/languages`);
}

/**
 * Суммирует языки по всем (не-форк) репозиториям и возвращает топ-6
 * в процентах. Ограничиваем 20 репо чтобы не перегружать Worker.
 */
export async function fetchAllLanguages(
  username: string,
  repos: GithubRepo[]
): Promise<LangData[]> {
  const ownRepos = repos.filter(r => !r.fork).slice(0, 20);

  const langMaps = await Promise.all(
    ownRepos.map(r => fetchRepoLanguages(username, r.name))
  );

  const totals: Record<string, number> = {};
  for (const map of langMaps) {
    for (const [lang, bytes] of Object.entries(map)) {
      totals[lang] = (totals[lang] ?? 0) + bytes;
    }
  }

  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return Object.entries(totals)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: Math.round((bytes / total) * 100),
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 6);
}

/**
 * Contributions via third-party proxy (no token needed — public data).
 */
export async function fetchContributions(
  username: string
): Promise<Contribution[]> {
  const res = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
  );
  if (!res.ok) throw new Error('Failed to fetch contributions');
  const data = await res.json();
  return data.contributions as Contribution[];
}
