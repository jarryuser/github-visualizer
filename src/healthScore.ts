import type { GithubRepo } from './api';

const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000;

export interface HealthCheck {
  label: string;
  shortLabel: string; // for compare view where space is limited
  pass: number;
  total: number;
}

export interface HealthData {
  checks: HealthCheck[];
  overallPct: number;
}

export function scoreColor(pct: number): string {
  if (pct >= 75) return '#3fb950';
  if (pct >= 50) return '#d29922';
  return '#f85149';
}

function repoScore(repo: GithubRepo): number {
  let score = 0;
  if (repo.description) score++;
  if (repo.license) score++;
  if (repo.pushed_at && Date.now() - new Date(repo.pushed_at).getTime() < SIX_MONTHS) score++;
  if (repo.topics && repo.topics.length > 0) score++;
  return score;
}

export function computeHealthData(repos: GithubRepo[]): HealthData {
  const ownRepos = repos.filter(r => !r.fork);
  if (ownRepos.length === 0) return { checks: [], overallPct: 0 };

  const total = ownRepos.length;
  const checks: HealthCheck[] = [
    {
      label: 'Description',
      shortLabel: 'Description',
      pass: ownRepos.filter(r => !!r.description).length,
      total,
    },
    {
      label: 'License',
      shortLabel: 'License',
      pass: ownRepos.filter(r => !!r.license).length,
      total,
    },
    {
      label: 'Active within 6 months',
      shortLabel: 'Active 6mo',
      pass: ownRepos.filter(
        r => !!r.pushed_at && Date.now() - new Date(r.pushed_at).getTime() < SIX_MONTHS
      ).length,
      total,
    },
    {
      label: 'Topics',
      shortLabel: 'Topics',
      pass: ownRepos.filter(r => r.topics && r.topics.length > 0).length,
      total,
    },
  ];

  const overallScore = ownRepos.reduce((sum, r) => sum + repoScore(r), 0);
  const overallPct = Math.round((overallScore / (total * 4)) * 100);

  return { checks, overallPct };
}

export function renderHealthReport(container: HTMLElement, repos: GithubRepo[]): void {
  container.innerHTML = '';

  const ownRepos = repos.filter(r => !r.fork);
  if (ownRepos.length === 0) {
    container.innerHTML =
      '<p style="font-size:13px;color:var(--text-muted)">No repositories to analyse</p>';
    return;
  }

  const { checks, overallPct } = computeHealthData(repos);
  const overallColor = scoreColor(overallPct);

  const checksHtml = checks.map(c => {
    const pct = Math.round((c.pass / c.total) * 100);
    const color = scoreColor(pct);
    return `
      <div class="health-row">
        <span class="health-label">${c.label}</span>
        <div class="health-bar-bg">
          <div class="health-bar" style="width:${pct}%;background:${color}"></div>
        </div>
        <span class="health-count">${c.pass} / ${c.total}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <p class="health-subtitle">Across ${ownRepos.length} own repo${ownRepos.length !== 1 ? 's' : ''}</p>
    <div class="health-checks">${checksHtml}</div>
    <div class="health-overall">
      <span class="health-overall-label">Overall</span>
      <div class="health-bar-bg health-bar-bg--overall">
        <div class="health-bar" style="width:${overallPct}%;background:${overallColor}"></div>
      </div>
      <span class="health-overall-pct" style="color:${overallColor}">${overallPct}%</span>
    </div>
  `;
}
