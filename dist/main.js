import { fetchUser, fetchRepos, fetchAllLanguages, fetchContributions, } from './api';
import { renderStreakGraph } from './streak';
import { renderLanguageChart } from './languages';
import { renderTopRepos } from './repos';
// ── DOM refs ───────────────────────────────────────────────────────────────────
const form = document.getElementById('search-form');
const input = document.getElementById('username-input');
const errorBox = document.getElementById('error-box');
const loadingEl = document.getElementById('loading');
const dashboard = document.getElementById('dashboard');
// Profile
const avatarEl = document.getElementById('avatar');
const nameEl = document.getElementById('profile-name');
const bioEl = document.getElementById('profile-bio');
const locationEl = document.getElementById('profile-location');
const profileLink = document.getElementById('profile-link');
// Stats
const statRepos = document.getElementById('stat-repos');
const statStars = document.getElementById('stat-stars');
const statFollowers = document.getElementById('stat-followers');
const statStreak = document.getElementById('stat-streak');
// Charts
const streakWrap = document.getElementById('streak-container');
const langWrap = document.getElementById('lang-container');
const reposWrap = document.getElementById('repos-container');
// ── State ──────────────────────────────────────────────────────────────────────
let isLoading = false;
// ── UI helpers ─────────────────────────────────────────────────────────────────
function setLoading(state) {
    isLoading = state;
    loadingEl.style.display = state ? 'flex' : 'none';
    dashboard.style.display = state ? 'none' : 'block';
    errorBox.style.display = 'none';
}
function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
    loadingEl.style.display = 'none';
    dashboard.style.display = 'none';
}
function animateCount(el, target, suffix = '') {
    const duration = 600;
    const start = performance.now();
    const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
        el.textContent = Math.round(target * ease) + suffix;
        if (progress < 1)
            requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}
// ── Main ───────────────────────────────────────────────────────────────────────
async function buildDashboard(username) {
    if (isLoading)
        return;
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
        avatarEl.src = user.avatar_url;
        avatarEl.alt = user.login;
        nameEl.textContent = user.name ?? user.login;
        bioEl.textContent = user.bio ?? '';
        locationEl.textContent = user.location ?? '';
        locationEl.style.display = user.location ? 'flex' : 'none';
        profileLink.href = user.html_url;
        profileLink.textContent = `@${user.login}`;
        // ── Stats ──────────────────────────────────────────────────────────────────
        const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
        setLoading(false);
        animateCount(statRepos, user.public_repos);
        animateCount(statStars, totalStars);
        animateCount(statFollowers, user.followers);
        // ── Streak graph ───────────────────────────────────────────────────────────
        const streak = renderStreakGraph(streakWrap, contributions);
        animateCount(statStreak, streak, 'd');
        // ── Language chart ─────────────────────────────────────────────────────────
        renderLanguageChart(langWrap, languages);
        // ── Top repos ──────────────────────────────────────────────────────────────
        renderTopRepos(reposWrap, repos);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        showError(msg);
    }
}
// ── Event listeners ────────────────────────────────────────────────────────────
form.addEventListener('submit', e => {
    e.preventDefault();
    const username = input.value.trim();
    if (username)
        buildDashboard(username);
});
const urlUser = new URLSearchParams(location.search).get('user');
if (urlUser) {
    input.value = urlUser;
    buildDashboard(urlUser);
}
