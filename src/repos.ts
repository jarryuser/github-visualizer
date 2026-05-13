import type { GithubRepo } from './api';
import { LANG_COLORS } from './languages';

/**
 * Рендерит карточки топ-репозиториев по звёздам.
 * Исключает форки — показываем только собственные проекты.
 */
export function renderTopRepos(
  container: HTMLElement,
  repos: GithubRepo[],
  limit = 5
): void {
  container.innerHTML = '';

  const top = repos
    .filter(r => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit);

  if (top.length === 0) {
    container.innerHTML =
      '<p style="font-size:13px;color:var(--color-text-tertiary)">No repositories found</p>';
    return;
  }

  top.forEach((repo, i) => {
    const card = document.createElement('div');
    card.className = 'repo-card' + (i === 0 ? '' : ' repo-card--bordered');

    const langDot = repo.language
      ? `<span class="lang-dot" style="background:${LANG_COLORS[repo.language] ?? '#8b949e'}"></span>
         <span class="repo-lang">${repo.language}</span>`
      : '';

    const updatedAgo = timeAgo(new Date(repo.updated_at));

    card.innerHTML = `
      <div class="repo-header">
        <a class="repo-name" href="${repo.html_url}" target="_blank" rel="noopener">
          ${repo.name}
        </a>
        <div class="repo-stats">
          <span class="repo-stat">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.751.751 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
            </svg>
            ${repo.stargazers_count}
          </span>
          <span class="repo-stat">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 100-1.5.75.75 0 000 1.5zm-3 8.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z"/>
            </svg>
            ${repo.forks_count}
          </span>
        </div>
      </div>
      ${repo.description
        ? `<p class="repo-desc">${repo.description}</p>`
        : ''}
      <div class="repo-footer">
        <div class="repo-lang-wrap">${langDot}</div>
        <span class="repo-updated">Updated ${updatedAgo}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60)          return 'just now';
  if (seconds < 3600)        return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)       return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30)  return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 86400 * 365) return `${Math.floor(seconds / (86400 * 30))}mo ago`;
  return `${Math.floor(seconds / (86400 * 365))}y ago`;
}
