// ── Types ──────────────────────────────────────────────────────────────────────
// ── Base fetch ─────────────────────────────────────────────────────────────────
const BASE = 'https://api.github.com';
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
function ghFetch(path) {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
    };
    if (TOKEN)
        headers['Authorization'] = `Bearer ${TOKEN}`;
    return fetch(`${BASE}${path}`, { headers });
}
async function ghJson(path) {
    const res = await ghFetch(path);
    if (res.status === 404)
        throw new Error('User not found');
    if (res.status === 403)
        throw new Error('API rate limit exceeded. Add a GitHub token in .env');
    if (!res.ok)
        throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
}
// ── Endpoints ──────────────────────────────────────────────────────────────────
export async function fetchUser(username) {
    return ghJson(`/users/${username}`);
}
export async function fetchRepos(username) {
    return ghJson(`/users/${username}/repos?per_page=100&sort=updated`);
}
async function fetchRepoLanguages(username, repo) {
    return ghJson(`/repos/${username}/${repo}/languages`);
}
export async function fetchAllLanguages(username, repos) {
    const ownRepos = repos.filter(r => !r.fork).slice(0, 20);
    const langMaps = await Promise.all(ownRepos.map(r => fetchRepoLanguages(username, r.name)));
    const totals = {};
    for (const map of langMaps) {
        for (const [lang, bytes] of Object.entries(map)) {
            totals[lang] = (totals[lang] ?? 0) + bytes;
        }
    }
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    if (total === 0)
        return [];
    return Object.entries(totals)
        .map(([name, bytes]) => ({
        name,
        bytes,
        percent: Math.round((bytes / total) * 100),
    }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 6);
}
export async function fetchContributions(username) {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
    if (!res.ok)
        throw new Error('Failed to fetch contributions');
    const data = await res.json();
    return data.contributions;
}
