import {
  fetchUser,
  fetchRepos,
  fetchAllLanguages,
  fetchContributions,
} from './api';
import { renderStreakGraph } from './streak';
import { renderLanguageChart } from './languages';
import { renderTopRepos } from './repos';
import { fetchProfileData, renderComparison } from './compare';

// ── DOM refs — Profile ─────────────────────────────────────────────────────────

const form          = document.getElementById('search-form')       as HTMLFormElement;
const input         = document.getElementById('username-input')    as HTMLInputElement;
const errorBox      = document.getElementById('error-box')         as HTMLElement;
const loadingEl     = document.getElementById('loading')           as HTMLElement;
const dashboard     = document.getElementById('dashboard')         as HTMLElement;
const avatarEl      = document.getElementById('avatar')            as HTMLImageElement;
const nameEl        = document.getElementById('profile-name')      as HTMLElement;
const bioEl         = document.getElementById('profile-bio')       as HTMLElement;
const locationEl    = document.getElementById('profile-location')  as HTMLElement;
const profileLink   = document.getElementById('profile-link')      as HTMLAnchorElement;
const statRepos     = document.getElementById('stat-repos')        as HTMLElement;
const statStars     = document.getElementById('stat-stars')        as HTMLElement;
const statFollowers = document.getElementById('stat-followers')    as HTMLElement;
const statStreak    = document.getElementById('stat-streak')       as HTMLElement;
const streakWrap    = document.getElementById('streak-container')  as HTMLElement;
const langWrap      = document.getElementById('lang-container')    as HTMLElement;
const reposWrap     = document.getElementById('repos-container')   as HTMLElement;

// ── DOM refs — Tabs & Compare ──────────────────────────────────────────────────

const tabProfile     = document.getElementById('tab-profile')     as HTMLButtonElement;
const tabCompare     = document.getElementById('tab-compare')     as HTMLButtonElement;
const panelProfile   = document.getElementById('panel-profile')   as HTMLElement;
const panelCompare   = document.getElementById('panel-compare')   as HTMLElement;
const compareForm    = document.getElementById('compare-form')    as HTMLFormElement;
const compareInputA  = document.getElementById('compare-input-a') as HTMLInputElement;
const compareInputB  = document.getElementById('compare-input-b') as HTMLInputElement;
const compareError   = document.getElementById('compare-error')   as HTMLElement;
const compareLoading = document.getElementById('compare-loading') as HTMLElement;
const compareResult  = document.getElementById('compare-result')  as HTMLElement;

// ── Tab routing ────────────────────────────────────────────────────────────────

function switchTab(tab: 'profile' | 'compare') {
  const isProfile = tab === 'profile';

  panelProfile.style.display  = isProfile ? 'block' : 'none';
  panelCompare.style.display  = isProfile ? 'none'  : 'block';

  tabProfile.classList.toggle('tab--active', isProfile);
  tabCompare.classList.toggle('tab--active', !isProfile);

  tabProfile.setAttribute('aria-selected', String(isProfile));
  tabCompare.setAttribute('aria-selected', String(!isProfile));

  // Reflect in URL without reload
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

// ── Profile helpers ────────────────────────────────────────────────────────────

let isLoading = false;

function setLoading(state: boolean) {
  isLoading = state;
  loadingEl.style.display = state ? 'flex'  : 'none';
  dashboard.style.display = state ? 'none'  : 'block';
  errorBox.style.display  = 'none';
}

function showError(msg: string) {
  errorBox.textContent    = msg;
  errorBox.style.display  = 'block';
  loadingEl.style.display = 'none';
  dashboard.style.display = 'none';
}

export function animateCount(el: HTMLElement, target: number, suffix = '') {
  const duration = 600;
  const start    = performance.now();
  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * ease) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Profile dashboard ──────────────────────────────────────────────────────────

async function buildDashboard(username: string) {
  if (isLoading) return;
  setLoading(true);

  try {
    const [user, repos] = await Promise.all([
      fetchUser(username),
      fetchRepos(username),
    ]);

    const [languages, contributions] = await Promise.all([
      fetchAllLanguages(username, repos),
      fetchContributions(username),
    ]);

    avatarEl.src             = user.avatar_url;
    avatarEl.alt             = user.login;
    nameEl.textContent       = user.name ?? user.login;
    bioEl.textContent        = user.bio ?? '';
    locationEl.style.display = user.location ? 'flex' : 'none';
    (locationEl.querySelector('span') as HTMLElement).textContent = user.location ?? '';
    profileLink.href         = user.html_url;
    profileLink.textContent  = `@${user.login}`;

    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    setLoading(false);

    animateCount(statRepos,     user.public_repos);
    animateCount(statStars,     totalStars);
    animateCount(statFollowers, user.followers);

    const streak = renderStreakGraph(streakWrap, contributions);
    animateCount(statStreak, streak, 'd');

    renderLanguageChart(langWrap, languages);
    renderTopRepos(reposWrap, repos);

    // Update URL
    const params = new URLSearchParams(location.search);
    params.set('user', username);
    history.replaceState(null, '', `?${params.toString()}`);

  } catch (err) {
    showError(err instanceof Error ? err.message : 'Something went wrong');
  }
}

// ── Compare ────────────────────────────────────────────────────────────────────

async function buildComparison(usernameA: string, usernameB: string) {
  compareError.style.display   = 'none';
  compareLoading.style.display = 'flex';
  compareResult.innerHTML      = '';

  try {
    // Fetch both profiles truly in parallel
    const [dataA, dataB] = await Promise.all([
      fetchProfileData(usernameA),
      fetchProfileData(usernameB),
    ]);

    compareLoading.style.display = 'none';
    renderComparison(compareResult, dataA, dataB);

    // Update URL
    const params = new URLSearchParams(location.search);
    params.set('tab', 'compare');
    params.set('a', usernameA);
    params.set('b', usernameB);
    history.replaceState(null, '', `?${params.toString()}`);

  } catch (err) {
    compareLoading.style.display = 'none';
    compareError.textContent     = err instanceof Error ? err.message : 'Something went wrong';
    compareError.style.display   = 'block';
  }
}

// ── Event listeners ────────────────────────────────────────────────────────────

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

// ── Init from URL ──────────────────────────────────────────────────────────────

const params = new URLSearchParams(location.search);

if (params.get('tab') === 'compare') {
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
