import { fetchUser, fetchRepos, fetchContributions } from './api';
import type { GithubUser, GithubRepo, Contribution } from './api';

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function computeStreak(contributions: Contribution[]): number {
  const sorted = [...contributions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let streak = 0;
  for (const c of sorted) {
    if (c.count > 0) streak++;
    else break;
  }
  return streak;
}

function miniHeatmap(contributions: Contribution[]): string {
  if (contributions.length === 0) return '';

  const CELL = 7, GAP = 1, STEP = CELL + GAP;
  const WEEKS = 52;
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  // level 0 uses a visible gray, not the card background color
  const COLORS = isDark
    ? ['#21262d', '#0e4429', '#006d32', '#26a641', '#39d353']
    : ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

  const byDate = new Map(contributions.map(c => [c.date, c.level]));

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

  const rects: string[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = date.toISOString().slice(0, 10);
      const level = byDate.get(dateStr) ?? 0;
      rects.push(
        `<rect x="${w * STEP}" y="${d * STEP}" width="${CELL}" height="${CELL}" rx="2" fill="${COLORS[level]}"/>`
      );
    }
  }

  const vw = WEEKS * STEP - GAP;
  const vh = 7 * STEP - GAP;
  // width="100%" makes the heatmap fill the card; height="auto" scales proportionally
  return `<svg viewBox="0 0 ${vw} ${vh}" style="display:block;width:100%;height:auto">${rects.join('')}</svg>`;
}

function buildCard(user: GithubUser, repos: GithubRepo[], contributions: Contribution[]): string {
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const streak = computeStreak(contributions);
  const profileUrl = `${location.origin}${location.pathname}?user=${user.login}`;

  const stats = [
    { val: formatNum(user.public_repos), label: 'repos' },
    { val: formatNum(totalStars), label: 'stars' },
    { val: formatNum(user.followers), label: 'followers' },
    ...(streak > 0 ? [{ val: `${streak}d`, label: 'streak' }] : []),
  ];

  const statsHtml = stats.map(s =>
    `<div class="embed-stat">
      <span class="embed-stat-val">${s.val}</span>
      <span class="embed-stat-label">${s.label}</span>
    </div>`
  ).join('');

  const metaParts = [`@${user.login}`, user.location].filter(Boolean);
  const heatmap = miniHeatmap(contributions);

  return `
    <div class="embed-card">
      <div class="embed-top">
        <img class="embed-avatar" src="${user.avatar_url}" alt="${user.login}" />
        <div class="embed-info">
          <div class="embed-name">${user.name ?? user.login}</div>
          <div class="embed-meta">${metaParts.join(' · ')}</div>
          ${user.bio ? `<div class="embed-bio">${user.bio}</div>` : ''}
        </div>
        <a class="embed-link" href="${profileUrl}" target="_blank" rel="noopener">View profile →</a>
      </div>
      <div class="embed-stats">${statsHtml}</div>
      ${heatmap ? `<div class="embed-heatmap">${heatmap}</div>` : ''}
    </div>
  `;
}

export async function buildEmbedView(container: HTMLElement, username: string) {
  container.innerHTML = '<div class="embed-loading">Loading…</div>';

  try {
    const [user, repos, contributions] = await Promise.all([
      fetchUser(username),
      fetchRepos(username),
      fetchContributions(username),
    ]);

    container.innerHTML = buildCard(user, repos, contributions);
    document.title = `${user.name ?? user.login} — GitHub Visualizer`;
  } catch {
    container.innerHTML = '<div class="embed-loading">Failed to load profile</div>';
  }
}
