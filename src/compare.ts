/**
 * Profile comparison module.
 *
 * Fetches two profiles in parallel and renders a side-by-side view:
 *   - Profile headers
 *   - Stat comparison rows with a winner indicator
 *   - Language overlap chart
 *   - Streak graphs stacked
 */

import {
  fetchUser,
  fetchRepos,
  fetchAllLanguages,
  fetchContributions,
  type GithubUser,
  type GithubRepo,
  type LangData,
  type Contribution,
} from './api';
import { renderStreakGraph } from './streak';
import { LANG_COLORS } from './languages';
import { computeHealthData, scoreColor } from './healthScore';

// Types

interface ProfileData {
  user: GithubUser;
  repos: GithubRepo[];
  languages: LangData[];
  contributions: Contribution[];
  totalStars: number;
  streak: number;
}

// Data fetching

export async function fetchProfileData(username: string): Promise<ProfileData> {
  const [user, repos] = await Promise.all([
    fetchUser(username),
    fetchRepos(username),
  ]);

  const [languages, contributions] = await Promise.all([
    fetchAllLanguages(username, repos),
    fetchContributions(username),
  ]);

  const totalStars = repos
    .filter(r => !r.fork)
    .reduce((sum, r) => sum + r.stargazers_count, 0);

  return { user, repos, languages, contributions, totalStars, streak: 0 };
}

// Render

export function renderComparison(
  container: HTMLElement,
  a: ProfileData,
  b: ProfileData,
): void {
  container.innerHTML = '';

  // Render streak graphs and get streak counts
  const streakA = renderStreakInTemp(a.contributions);
  const streakB = renderStreakInTemp(b.contributions);
  a.streak = streakA.count;
  b.streak = streakB.count;

  container.innerHTML = `
    ${renderProfileHeaders(a, b)}
    ${renderStatRows(a, b)}
    ${renderLanguageComparison(a, b)}
    ${renderHealthComparison(a, b)}
  `;

  // Inject streak SVGs (can't serialize them to HTML string cleanly)
  const streakContainerA = container.querySelector('#cmp-streak-a') as HTMLElement;
  const streakContainerB = container.querySelector('#cmp-streak-b') as HTMLElement;
  if (streakContainerA) streakContainerA.appendChild(streakA.svg);
  if (streakContainerB) streakContainerB.appendChild(streakB.svg);
}

// Profile headers

function renderProfileHeaders(a: ProfileData, b: ProfileData): string {
  return `
    <div class="cmp-headers">
      ${profileHeader(a.user, 'a')}
      <div class="cmp-vs">VS</div>
      ${profileHeader(b.user, 'b')}
    </div>
  `;
}

function profileHeader(user: GithubUser, side: 'a' | 'b'): string {
  const align = side === 'a' ? 'left' : 'right';
  return `
    <div class="cmp-profile cmp-profile--${side}">
      <img
        src="${user.avatar_url}"
        alt="${user.login}"
        class="cmp-avatar"
        style="order: ${side === 'b' ? -1 : 0}"
      />
      <div class="cmp-profile-info" style="text-align:${align}">
        <p class="cmp-name">${user.name ?? user.login}</p>
        <a
          href="${user.html_url}"
          target="_blank"
          rel="noopener"
          class="cmp-login"
        >@${user.login}</a>
        ${user.bio
          ? `<p class="cmp-bio">${user.bio}</p>`
          : ''}
      </div>
    </div>
  `;
}

// Stat rows

interface StatRow {
  label: string;
  valA: number;
  valB: number;
  suffix?: string;
  /** Higher is better (default true). Set false e.g. for "days since last commit". */
  higherIsBetter?: boolean;
}

function renderStatRows(a: ProfileData, b: ProfileData): string {
  const rows: StatRow[] = [
    { label: 'Repositories', valA: a.user.public_repos, valB: b.user.public_repos },
    { label: 'Total stars', valA: a.totalStars, valB: b.totalStars },
    { label: 'Followers', valA: a.user.followers, valB: b.user.followers },
    { label: 'Following', valA: a.user.following, valB: b.user.following },
    { label: 'Current streak', valA: a.streak, valB: b.streak, suffix: 'd' },
  ];

  const rowsHtml = rows.map(row => statRow(row)).join('');

  return `
    <div class="card" style="margin-bottom:14px">
      <div class="card-title">Stats comparison</div>
      <div class="cmp-stats">
        ${rowsHtml}
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="card-title">Contribution activity — ${a.user.login}</div>
      <div id="cmp-streak-a" style="overflow-x:auto"></div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="card-title">Contribution activity — ${b.user.login}</div>
      <div id="cmp-streak-b" style="overflow-x:auto"></div>
    </div>
  `;
}

function statRow(row: StatRow): string {
  const higher = row.higherIsBetter ?? true;
  const aWins = higher ? row.valA > row.valB : row.valA < row.valB;
  const bWins = higher ? row.valB > row.valA : row.valB < row.valA;
  const tied = row.valA === row.valB;

  const suffix = row.suffix ?? '';

  // Bar widths: winner gets 100%, loser gets proportional %
  const max = Math.max(row.valA, row.valB, 1);
  const widthA = Math.round((row.valA / max) * 100);
  const widthB = Math.round((row.valB / max) * 100);

  const winnerTag = (wins: boolean) =>
    wins && !tied
      ? `<span class="cmp-winner-badge">winner</span>`
      : '';

  return `
    <div class="cmp-stat-row">
      <div class="cmp-stat-side cmp-stat-side--a">
        <div class="cmp-stat-top">
          <span class="cmp-stat-val ${aWins && !tied ? 'cmp-stat-val--win' : ''}">${row.valA.toLocaleString()}${suffix}</span>
          ${winnerTag(aWins)}
        </div>
        <div class="cmp-bar-wrap cmp-bar-wrap--a">
          <div
            class="cmp-bar cmp-bar--a ${aWins && !tied ? 'cmp-bar--win' : ''}"
            style="width:${widthA}%"
          ></div>
        </div>
      </div>

      <div class="cmp-stat-label">${row.label}</div>

      <div class="cmp-stat-side cmp-stat-side--b">
        <div class="cmp-stat-top cmp-stat-top--b">
          ${winnerTag(bWins)}
          <span class="cmp-stat-val ${bWins && !tied ? 'cmp-stat-val--win' : ''}">${row.valB.toLocaleString()}${suffix}</span>
        </div>
        <div class="cmp-bar-wrap cmp-bar-wrap--b">
          <div
            class="cmp-bar cmp-bar--b ${bWins && !tied ? 'cmp-bar--win' : ''}"
            style="width:${widthB}%"
          ></div>
        </div>
      </div>
    </div>
  `;
}

// Language comparison

function renderLanguageComparison(a: ProfileData, b: ProfileData): string {
  // All unique languages across both profiles
  const allLangs = Array.from(
    new Set([...a.languages.map(l => l.name), ...b.languages.map(l => l.name)])
  );

  const rows = allLangs
    .map(lang => {
      const la = a.languages.find(l => l.name === lang);
      const lb = b.languages.find(l => l.name === lang);
      return {
        name: lang,
        percentA: la?.percent ?? 0,
        percentB: lb?.percent ?? 0,
        color: LANG_COLORS[lang] ?? '#8b949e',
      };
    })
    .sort((x, y) => Math.max(y.percentA, y.percentB) - Math.max(x.percentA, x.percentB))
    .slice(0, 8);

  const rowsHtml = rows.map(r => `
    <div class="cmp-lang-row">
      <div class="cmp-lang-bar-side cmp-lang-bar-side--a">
        <div class="cmp-lang-bar-bg">
          <div
            class="cmp-lang-bar"
            style="width:${r.percentA}%;background:${r.color};margin-left:auto"
          ></div>
        </div>
        <span class="cmp-lang-pct">${r.percentA > 0 ? r.percentA + '%' : '—'}</span>
      </div>

      <div class="cmp-lang-label">
        <span class="lang-dot" style="background:${r.color}"></span>
        ${r.name}
      </div>

      <div class="cmp-lang-bar-side cmp-lang-bar-side--b">
        <span class="cmp-lang-pct">${r.percentB > 0 ? r.percentB + '%' : '—'}</span>
        <div class="cmp-lang-bar-bg">
          <div
            class="cmp-lang-bar"
            style="width:${r.percentB}%;background:${r.color}"
          ></div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="card">
      <div class="card-title">Language breakdown</div>
      <div class="cmp-lang-header">
        <span class="cmp-lang-username">@${a.user.login}</span>
        <span></span>
        <span class="cmp-lang-username" style="text-align:right">@${b.user.login}</span>
      </div>
      <div class="cmp-langs">${rowsHtml}</div>
    </div>
  `;
}

// Health comparison

function renderHealthComparison(a: ProfileData, b: ProfileData): string {
  const healthA = computeHealthData(a.repos);
  const healthB = computeHealthData(b.repos);

  if (healthA.checks.length === 0 || healthB.checks.length === 0) return '';

  const rowsHtml = healthA.checks.map((checkA, i) => {
    const checkB = healthB.checks[i];
    const pctA = Math.round((checkA.pass / checkA.total) * 100);
    const pctB = Math.round((checkB.pass / checkB.total) * 100);

    return `
      <div class="cmp-health-row">
        <div class="cmp-lang-bar-side cmp-lang-bar-side--a">
          <div class="cmp-lang-bar-bg">
            <div class="cmp-lang-bar" style="width:${pctA}%;background:${scoreColor(pctA)};margin-left:auto"></div>
          </div>
          <span class="cmp-lang-pct">${checkA.pass}/${checkA.total}</span>
        </div>
        <div class="cmp-health-criterion">${checkA.shortLabel}</div>
        <div class="cmp-lang-bar-side cmp-lang-bar-side--b">
          <span class="cmp-lang-pct">${checkB.pass}/${checkB.total}</span>
          <div class="cmp-lang-bar-bg">
            <div class="cmp-lang-bar" style="width:${pctB}%;background:${scoreColor(pctB)}"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const aWins = healthA.overallPct > healthB.overallPct;
  const bWins = healthB.overallPct > healthA.overallPct;
  const tied = healthA.overallPct === healthB.overallPct;

  return `
    <div class="card" style="margin-bottom:14px">
      <div class="card-title">Repository health</div>
      <div class="cmp-lang-header">
        <span class="cmp-lang-username">@${a.user.login}</span>
        <span></span>
        <span class="cmp-lang-username" style="text-align:right">@${b.user.login}</span>
      </div>
      <div class="cmp-health-rows">${rowsHtml}</div>
      <div class="cmp-stat-row" style="border-top:1px solid var(--border-soft);padding-top:12px">
        <div class="cmp-stat-side cmp-stat-side--a">
          <div class="cmp-stat-top">
            <span class="cmp-stat-val ${aWins && !tied ? 'cmp-stat-val--win' : ''}" style="color:${scoreColor(healthA.overallPct)}">${healthA.overallPct}%</span>
            ${aWins && !tied ? '<span class="cmp-winner-badge">winner</span>' : ''}
          </div>
          <div class="cmp-bar-wrap">
            <div class="cmp-bar" style="width:${healthA.overallPct}%;background:${scoreColor(healthA.overallPct)}"></div>
          </div>
        </div>
        <div class="cmp-stat-label">Overall</div>
        <div class="cmp-stat-side cmp-stat-side--b">
          <div class="cmp-stat-top cmp-stat-top--b">
            ${bWins && !tied ? '<span class="cmp-winner-badge">winner</span>' : ''}
            <span class="cmp-stat-val ${bWins && !tied ? 'cmp-stat-val--win' : ''}" style="color:${scoreColor(healthB.overallPct)}">${healthB.overallPct}%</span>
          </div>
          <div class="cmp-bar-wrap cmp-bar-wrap--b">
            <div class="cmp-bar" style="width:${healthB.overallPct}%;background:${scoreColor(healthB.overallPct)}"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Streak helper

/**
 * Render streak graph into a detached div and return both the element
 * and the calculated streak count. We do this because renderStreakGraph
 * needs a DOM element, but we're building HTML strings for the rest.
 */
function renderStreakInTemp(contributions: Contribution[]): {
  svg: HTMLElement;
  count: number;
} {
  const tmp = document.createElement('div');
  const count = renderStreakGraph(tmp, contributions);
  return { svg: tmp, count };
}
