import * as d3 from 'd3';
import type { LangData } from './api';

// Official language colors (matching GitHub Linguist)
export const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5',
  TypeScript: '#3178C6',
  JavaScript: '#F1E05A',
  'C++': '#F34B7D',
  'C#': '#178600',
  C: '#555555',
  Java: '#B07219',
  Rust: '#DEA584',
  Go: '#00ADD8',
  HTML: '#E34C26',
  CSS: '#563D7C',
  SCSS: '#C6538C',
  Shell: '#89E051',
  Arduino: '#BD79D1',
  Jupyter: '#DA5B0B',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Ruby: '#701516',
  PHP: '#4F5D95',
};

/**
 * Renders an animated horizontal bar chart by language.
 * Each row: [colored dot + name] [bar] [percent]
 * Bars animate from 0 to their value via d3.transition.
 */
export function renderLanguageChart(
  container: HTMLElement,
  languages: LangData[]
): void {
  container.innerHTML = '';

  if (languages.length === 0) {
    container.innerHTML =
      '<p style="font-size:13px;color:var(--color-text-tertiary)">No language data</p>';
    return;
  }

  const maxPct = d3.max(languages, d => d.percent) ?? 100;

  const xScale = d3.scaleLinear()
    .domain([0, maxPct])
    .range([0, 100]); // as percent of container width

  const parent = d3.select(container);

  const rows = parent.selectAll<HTMLDivElement, LangData>('.lang-row')
    .data(languages)
    .join('div')
    .attr('class', 'lang-row');

  // Language name with colored dot
  rows.append('div')
    .attr('class', 'lang-name')
    .html(d => {
      const color = LANG_COLORS[d.name] ?? '#8b949e';
      return `<span class="lang-dot" style="background:${color}"></span>${d.name}`;
    });

  // Progress bar
  const barWraps = rows.append('div')
    .attr('class', 'lang-bar-bg');

  barWraps.append('div')
    .attr('class', 'lang-bar')
    .style('background', d => LANG_COLORS[d.name] ?? '#8b949e')
    .style('width', '0%')
    .transition()
    .duration(500)
    .delay((_, i) => i * 70)
    .ease(d3.easeCubicOut)
    .style('width', d => `${xScale(d.percent)}%`);

  // Percent label
  rows.append('div')
    .attr('class', 'lang-pct')
    .text(d => `${d.percent}%`);
}
