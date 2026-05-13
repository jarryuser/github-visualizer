import {
  fetchUser,
  fetchRepos,
  fetchAllLanguages,
  fetchContributions,
} from './api';
import { renderStreakGraph } from './streak';
import { renderLanguageChart } from './languages';
import { renderTopRepos } from './repos';

// ── DOM refs ───────────────────────────────────────────────────────────────────

const form         = document.getElementById('search-form')       as HTMLFormElement;
const input        = document.getElementById('username-input')    as HTMLInputElement;
const errorBox     = document.getElementById('error-box')         as HTMLElement;
const loadingEl    = document.getElementById('loading')           as HTMLElement;
const dashboard    = document.getElementById('dashboard')         as HTMLElement;

// Profile
const avatarEl     = document.getElementById('avatar')            as HTMLImageElement;
const nameEl       = document.getElementById('profile-name')      as HTMLElement;
const bioEl        = document.getElementById('profile-bio')       as HTMLElement;
const locationEl   = document.getElementById('profile-location')  as HTMLElement;
const profileLink  = document.getElementById('profile-link')      as HTMLAnchorElement;

// Stats
const statRepos    = document.getElementById('stat-repos')        as HTMLElement;
const statStars    = document.getElementById('stat-stars')        as HTMLElement;
const statFollowers= document.getElementById('stat-followers')    as HTMLElement;
const statStreak   = document.getElementById('stat-streak')       as HTMLElement;

// Charts
const streakWrap   = document.getElementById('streak-container')  as HTMLElement;
const langWrap     = document.getElementById('lang-container')    as HTMLElement;
const reposWrap    = document.getElementById('repos-container')   as HTMLElement;

// ── State ──────────────────────────────────────────────────────────────────────

let isLoading = false;

// ── UI helpers ─────────────────────────────────────────────────────────────────

function setLoading(state: boolean) {
  isLoading = state;
  loadingEl.style.display  = state ? 'flex'  : 'none';
  dashboard.style.display  = state ? 'none'  : 'block';
  errorBox.style.display   = 'none';
}

function showError(msg: string) {
  errorBox.textContent    = msg;
  errorBox.style.display  = 'block';
  loadingEl.style.display = 'none';
  dashboard.style.display = 'none';
}

function animateCount(el: HTMLElement, target: number, suffix = '') {
  const duration = 600;
  const start    = performance.now();

  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);  // cubic ease-out
    el.textContent = Math.round(target * ease) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

// ── Main ───────────────────────────────────────────────────────────────────────

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

    // ── Profile ────────────────────────────────────────────────────────────────
    avatarEl.src          = user.avatar_url;
    avatarEl.alt          = user.login;
    nameEl.textContent    = user.name ?? user.login;
    bioEl.textContent     = user.bio ?? '';
    locationEl.textContent= user.location ?? '';
    locationEl.style.display = user.location ? 'flex' : 'none';
    profileLink.href      = user.html_url;
    profileLink.textContent = `@${user.login}`;

    // ── Stats ──────────────────────────────────────────────────────────────────
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

    setLoading(false);   

    animateCount(statRepos,     user.public_repos);
    animateCount(statStars,     totalStars);
    animateCount(statFollowers, user.followers);

    // ── Streak graph ───────────────────────────────────────────────────────────
    const streak = renderStreakGraph(streakWrap, contributions);
    animateCount(statStreak, streak, 'd');

    // ── Language chart ─────────────────────────────────────────────────────────
    renderLanguageChart(langWrap, languages);

    // ── Top repos ──────────────────────────────────────────────────────────────
    renderTopRepos(reposWrap, repos);

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Something went wrong';
    showError(msg);
  }
}

// ── Event listeners ────────────────────────────────────────────────────────────

form.addEventListener('submit', e => {
  e.preventDefault();
  const username = input.value.trim();
  if (username) buildDashboard(username);
});

const urlUser = new URLSearchParams(location.search).get('user');
if (urlUser) {
  input.value = urlUser;
  buildDashboard(urlUser);
}
