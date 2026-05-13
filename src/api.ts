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

const BASE = 'https://api.github.com';

const TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;

function ghFetch(path: string): Promise<Response> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  return fetch(`${BASE}${path}`, { headers });
}

async function ghJson<T>(path: string): Promise<T> {
  const res = await ghFetch(path);
  if (res.status === 404) throw new Error('User not found');
  if (res.status === 403) throw new Error('API rate limit exceeded. Add a GitHub token in .env');
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

// ── Endpoints ──────────────────────────────────────────────────────────────────

export async function fetchUser(username: string): Promise<GithubUser> {
  return ghJson<GithubUser>(`/users/${username}`);
}

export async function fetchRepos(username: string): Promise<GithubRepo[]> {
  return ghJson<GithubRepo[]>(`/users/${username}/repos?per_page=100&sort=updated`);
}

async function fetchRepoLanguages(
  username: string,
  repo: string
): Promise<Record<string, number>> {
  return ghJson<Record<string, number>>(`/repos/${username}/${repo}/languages`);
}

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
