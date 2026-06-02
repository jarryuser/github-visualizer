import { toPng } from 'html-to-image';
import {
  fetchUser,
  fetchRepos,
  fetchAllLanguages,
  fetchContributions,
  fetchUserEvents,
  fetchRateLimit,
  fetchOrgDescription,
} from './api';
import { renderStreakGraph } from './streak';
import { renderLanguageChart } from './languages';
import { renderTopRepos } from './repos';
import { fetchProfileData, renderComparison } from './compare';
import { renderCommitHeatmap } from './commitHeatmap';
import { renderHealthReport } from './healthScore';
import { renderActivityChart } from './activityChart';
import { fetchProfileReadme, renderProfileReadme } from './profileReadme';
import { buildEmbedView } from './embed';
import type { Contribution, GithubEvent } from './api';

const isEmbed = new URLSearchParams(location.search).get('embed') === '1';

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Stored for re-rendering D3 charts on theme toggle
let lastContributions: Contribution[] | null = null;
let lastEvents: GithubEvent[] | null = null;
let isOrgProfile = false;

// DOM refs - Profile

const form = document.getElementById('search-form') as HTMLFormElement;
const input = document.getElementById('username-input') as HTMLInputElement;
const errorBox = document.getElementById('error-box') as HTMLElement;
const loadingEl = document.getElementById('loading') as HTMLElement;
const dashboard = document.getElementById('dashboard') as HTMLElement;
const avatarEl = document.getElementById('avatar') as HTMLImageElement;
const nameEl = document.getElementById('profile-name') as HTMLElement;
const orgBadge = document.getElementById('profile-org-badge') as HTMLElement;
const bioEl = document.getElementById('profile-bio') as HTMLElement;
const locationEl = document.getElementById('profile-location') as HTMLElement;
const profileLink = document.getElementById('profile-link') as HTMLAnchorElement;
const statRepos = document.getElementById('stat-repos') as HTMLElement;
const statStars = document.getElementById('stat-stars') as HTMLElement;
const statFollowers = document.getElementById('stat-followers') as HTMLElement;
const statStreak = document.getElementById('stat-streak') as HTMLElement;
const streakWrap = document.getElementById('streak-container') as HTMLElement;
const langWrap = document.getElementById('lang-container') as HTMLElement;
const reposWrap = document.getElementById('repos-container') as HTMLElement;
const commitHeatmapWrap = document.getElementById('commit-heatmap-container') as HTMLElement;
const healthWrap = document.getElementById('health-container') as HTMLElement;
const activityChartWrap = document.getElementById('activity-chart-container') as HTMLElement;
const rateLimitBadge = document.getElementById('rate-limit-badge') as HTMLElement;
const rateLimitDot = document.getElementById('rate-limit-dot') as HTMLElement;
const rateLimitText = document.getElementById('rate-limit-text') as HTMLElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const embedBtn = document.getElementById('embed-btn') as HTMLButtonElement;
const copyToast = document.getElementById('copy-toast') as HTMLElement;
const embedView = document.getElementById('embed-view') as HTMLElement;
const readmeCard = document.getElementById('readme-card') as HTMLElement;
const readmeContainer = document.getElementById('readme-container') as HTMLElement;

// DOM refs - Tabs & Compare

const tabProfile = document.getElementById('tab-profile') as HTMLButtonElement;
const tabCompare = document.getElementById('tab-compare') as HTMLButtonElement;
const panelProfile = document.getElementById('panel-profile') as HTMLElement;
const panelCompare = document.getElementById('panel-compare') as HTMLElement;
const compareForm = document.getElementById('compare-form') as HTMLFormElement;
const compareInputA = document.getElementById('compare-input-a') as HTMLInputElement;
const compareInputB = document.getElementById('compare-input-b') as HTMLInputElement;
const compareError = document.getElementById('compare-error') as HTMLElement;
const compareLoading = document.getElementById('compare-loading') as HTMLElement;
const compareResult = document.getElementById('compare-result') as HTMLElement;

// Tab routing

function switchTab(tab: 'profile' | 'compare') {
  const isProfile = tab === 'profile';

  panelProfile.style.display = isProfile ? 'block' : 'none';
  panelCompare.style.display = isProfile ? 'none' : 'block';

  tabProfile.classList.toggle('tab--active', isProfile);
  tabCompare.classList.toggle('tab--active', !isProfile);

  tabProfile.setAttribute('aria-selected', String(isProfile));
  tabCompare.setAttribute('aria-selected', String(!isProfile));

  const params = new URLSearchParams(location.search);
  if (tab === 'compare') {
    params.set('tab', 'compare');
  } else {
    params.delete('tab');
  }
  history.replaceState(null, '', `?${params.toString()}`);
}

tabProfile.addEventListener('click', () => switchTab('profile'));
tabCompare.addEventListener('click', () => switchTab('compare'));

// Profile helpers

let isLoading = false;
let currentUsername = '';

function setLoading(state: boolean) {
  isLoading = state;
  loadingEl.style.display = state ? 'flex' : 'none';
  dashboard.style.display = state ? 'none' : 'block';
  errorBox.style.display = 'none';
  if (state) {
    exportBtn.style.display = 'none';
    embedBtn.style.display = 'none';
    readmeCard.style.display = 'none';
    readmeContainer.innerHTML = '';
  }
}

function showError(msg: string) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  loadingEl.style.display = 'none';
  dashboard.style.display = 'none';
}

export function animateCount(el: HTMLElement, target: number, suffix = '') {
  const duration = 600;
  const start = performance.now();
  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * ease) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Rate limit badge

async function updateRateLimitBadge() {
  try {
    const rl = await fetchRateLimit();
    const resetIn = Math.max(0, Math.round((rl.reset * 1000 - Date.now()) / 60000));

    const dotClass =
      rl.remaining > 1000 ? 'rate-limit-dot--ok' :
      rl.remaining > 200  ? 'rate-limit-dot--warn' :
                            'rate-limit-dot--danger';

    rateLimitDot.className = `rate-limit-dot ${dotClass}`;
    rateLimitText.textContent = `${rl.remaining.toLocaleString()} / ${rl.limit.toLocaleString()} API requests`;
    rateLimitBadge.title = `Resets in ${resetIn} min`;
    rateLimitBadge.style.display = 'flex';
  } catch {
    // Non-critical - silently ignore if rate limit fetch fails
  }
}

// Profile dashboard

async function buildDashboard(username: string) {
  if (isLoading) return;
  setLoading(true);

  try {
    const [user, repos] = await Promise.all([
      fetchUser(username),
      fetchRepos(username),
    ]);

    const isOrg = user.type === 'Organization';

    const [languages, contributions, events, orgDescription, readmeRaw] = await Promise.all([
      fetchAllLanguages(username, repos),
      isOrg ? Promise.resolve([] as Contribution[]) : fetchContributions(username),
      fetchUserEvents(username),
      isOrg ? fetchOrgDescription(username) : Promise.resolve(null),
      fetchProfileReadme(username),
    ]);

    avatarEl.src = user.avatar_url;
    avatarEl.alt = user.login;
    nameEl.textContent = user.name ?? user.login;
    orgBadge.style.display = isOrg ? 'inline-flex' : 'none';
    bioEl.textContent = isOrg ? (orgDescription ?? '') : (user.bio ?? '');
    locationEl.style.display = user.location ? 'flex' : 'none';
    (locationEl.querySelector('span') as HTMLElement).textContent = user.location ?? '';
    profileLink.href = user.html_url;
    profileLink.textContent = `@${user.login}`;

    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    setLoading(false);

    animateCount(statRepos, user.public_repos);
    animateCount(statStars, totalStars);
    animateCount(statFollowers, user.followers);

    const NA_MSG = '<p class="chart-unavailable">Not available for organizations</p>';

    if (isOrg) {
      activityChartWrap.innerHTML = NA_MSG;
      streakWrap.innerHTML = NA_MSG;
      statStreak.textContent = '—';
    } else {
      renderActivityChart(activityChartWrap, contributions);
      const streak = renderStreakGraph(streakWrap, contributions);
      animateCount(statStreak, streak, 'd');
    }

    renderLanguageChart(langWrap, languages);
    renderTopRepos(reposWrap, repos);
    renderCommitHeatmap(commitHeatmapWrap, events);
    renderHealthReport(healthWrap, repos);
    if (readmeRaw) renderProfileReadme(readmeCard, readmeContainer, readmeRaw);
    updateRateLimitBadge();

    isOrgProfile = isOrg;
    lastContributions = contributions;
    lastEvents = events;
    currentUsername = username;
    exportBtn.style.display = 'flex';
    embedBtn.style.display = 'flex';

    const params = new URLSearchParams(location.search);
    params.set('user', username);
    history.replaceState(null, '', `?${params.toString()}`);

  } catch (err) {
    showError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

// Compare

async function buildComparison(usernameA: string, usernameB: string) {
  compareError.style.display = 'none';
  compareLoading.style.display = 'flex';
  compareResult.innerHTML = '';

  try {
    const [dataA, dataB] = await Promise.all([
      fetchProfileData(usernameA),
      fetchProfileData(usernameB),
    ]);

    compareLoading.style.display = 'none';
    renderComparison(compareResult, dataA, dataB);

    const params = new URLSearchParams(location.search);
    params.set('tab', 'compare');
    params.set('a', usernameA);
    params.set('b', usernameB);
    history.replaceState(null, '', `?${params.toString()}`);

  } catch (err) {
    compareLoading.style.display = 'none';
    compareError.textContent = err instanceof Error ? err.message : 'Something went wrong';
    compareError.style.display = 'block';
  }
}

// Event listeners

form.addEventListener('submit', e => {
  e.preventDefault();
  const username = input.value.trim();
  if (username) buildDashboard(username);
});

compareForm.addEventListener('submit', e => {
  e.preventDefault();
  const a = compareInputA.value.trim();
  const b = compareInputB.value.trim();
  if (a && b) buildComparison(a, b);
});

// Export

async function exportDashboard() {
  exportBtn.disabled = true;
  try {
    const pad = 20;
    const dataUrl = await toPng(dashboard, {
      backgroundColor: cssVar('--bg') || '#0d1117',
      cacheBust: true,
      width: dashboard.offsetWidth + pad * 2,
      height: dashboard.offsetHeight + pad * 2,
      style: { padding: `${pad}px`, boxSizing: 'border-box' },
    });
    const link = document.createElement('a');
    link.download = `${currentUsername}-github-stats.png`;
    link.href = dataUrl;
    link.click();
  } catch {
    // non-critical
  } finally {
    exportBtn.disabled = false;
  }
}

exportBtn.addEventListener('click', exportDashboard);

let toastTimer: ReturnType<typeof setTimeout>;

function showToast(msg: string) {
  clearTimeout(toastTimer);
  copyToast.textContent = msg;
  copyToast.classList.add('show');
  toastTimer = setTimeout(() => copyToast.classList.remove('show'), 2500);
}

embedBtn.addEventListener('click', async () => {
  const theme = document.documentElement.getAttribute('data-theme') ?? 'dark';
  const base = `${location.origin}${location.pathname}`;
  const src = `${base}?user=${currentUsername}&embed=1&theme=${theme}`;
  const code = `<iframe src="${src}" width="480" height="260" frameborder="0" style="border-radius:12px"></iframe>`;
  try {
    await navigator.clipboard.writeText(code);
    embedBtn.classList.add('copied');
    setTimeout(() => embedBtn.classList.remove('copied'), 2000);
    showToast('Embed code copied!');
  } catch {
    // clipboard API not available
  }
});

// Theme

const themeToggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement;

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);

  // Re-render D3 charts that use theme-dependent colors
  if (lastContributions && !isOrgProfile) {
    renderActivityChart(activityChartWrap, lastContributions);
    renderStreakGraph(streakWrap, lastContributions);
  }
  if (lastEvents) renderCommitHeatmap(commitHeatmapWrap, lastEvents);
});

const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
if (savedTheme && !isEmbed) applyTheme(savedTheme);

// Init from URL

const params = new URLSearchParams(location.search);

if (isEmbed) {
  const urlTheme = params.get('theme');
  if (urlTheme === 'light' || urlTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', urlTheme);
  }
  document.body.classList.add('embed-mode');
  embedView.style.display = 'block';
  const urlUser = params.get('user');
  if (urlUser) buildEmbedView(embedView, urlUser);
} else if (params.get('tab') === 'compare') {
  switchTab('compare');
  const a = params.get('a');
  const b = params.get('b');
  if (a && b) {
    compareInputA.value = a;
    compareInputB.value = b;
    buildComparison(a, b);
  }
} else {
  switchTab('profile');
  const urlUser = params.get('user');
  if (urlUser) {
    input.value = urlUser;
    buildDashboard(urlUser);
  }
}
