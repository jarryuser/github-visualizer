import * as d3 from 'd3';
import type { Contribution } from './api';

const CELL = 13;
const GAP = 3;
const STEP = CELL + GAP;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LEGEND_LABELS = ['Less', 'More'];

// GitHub-exact contribution colors
const GITHUB_COLORS: Record<string, string[]> = {
  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  dark:  ['#151b23', '#0e4429', '#006d32', '#26a641', '#39d353'],
};

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function themeColors(): string[] {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  return GITHUB_COLORS[theme] || GITHUB_COLORS.dark;
}

export function renderStreakGraph(
  container: HTMLElement,
  contributions: Contribution[]
): number {
  container.innerHTML = '';
  container.style.overflow = 'visible';
  const textColor = cssVar('--text-muted') || '#8b949e';
  const colors = themeColors();

  const weeks = d3.groups(
    contributions,
    d => d3.timeWeek.floor(new Date(d.date + 'T12:00:00')).toISOString()
  );

  const GUTTER = 28;
  const MONTH_H = 20;
  const LEGEND_H = 22;
  const svgW = GUTTER + weeks.length * STEP;
  const svgH = 7 * STEP + MONTH_H + LEGEND_H;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${svgW} ${svgH}`)
    .style('width', '100%')
    .style('display', 'block')
    .style('overflow', 'visible');

  // Tooltip
  const tooltipSel = d3.select(container)
    .append('div')
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,.78)')
    .style('color', '#fff')
    .style('font-size', '12px')
    .style('padding', '5px 10px')
    .style('border-radius', '6px')
    .style('pointer-events', 'none')
    .style('white-space', 'nowrap')
    .style('opacity', '0')
    .style('transition', 'opacity .1s');

  // Month labels
  const seenMonths = new Set<string>();
  const monthFmt = d3.timeFormat('%b');

  weeks.forEach(([weekIso], i) => {
    const weekDate = new Date(weekIso);
    const month = monthFmt(weekDate);
    if (seenMonths.has(month)) return;
    seenMonths.add(month);

    svg.append('text')
      .attr('x', GUTTER + i * STEP)
      .attr('y', 11)
      .attr('font-size', '10px')
      .attr('fill', textColor)
      .attr('font-family', 'monospace')
      .text(month);
  });

  // Day labels (left side)
  const cellTop = MONTH_H;
  [1, 3, 5].forEach(dayIdx => {
    svg.append('text')
      .attr('x', GUTTER - 4)
      .attr('y', dayIdx * STEP + cellTop + CELL * 0.75)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', textColor)
      .attr('font-family', 'monospace')
      .text(DAY_LABELS[dayIdx]);
  });

  // Cells
  const containerRect = container.getBoundingClientRect();

  weeks.forEach(([, days], weekIdx) => {
    svg.selectAll(null)
      .data(days)
      .join('rect')
      .attr('x', GUTTER + weekIdx * STEP)
      .attr('y', d => new Date(d.date + 'T12:00:00').getDay() * STEP + cellTop)
      .attr('width', CELL)
      .attr('height', CELL)
      .attr('rx', 2)
      .attr('fill', d => colors[d.level])
      .style('cursor', 'crosshair')
      .on('mouseover', function(event: MouseEvent, d: Contribution) {
        const fmt = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
        });
        const text = d.count === 0
          ? `No contributions on ${fmt}`
          : `${d.count} contribution${d.count > 1 ? 's' : ''} on ${fmt}`;

        tooltipSel
          .style('opacity', '1')
          .style('left', `${event.pageX - containerRect.left + 12}px`)
          .style('top', `${event.pageY - containerRect.top - 32}px`)
          .text(text);
      })
      .on('mouseout', () => tooltipSel.style('opacity', '0'));
  });

  // Legend
  const legendX = svgW - 175;
  const legendY = 7 * STEP + MONTH_H + 6;

  svg.append('text')
    .attr('x', legendX)
    .attr('y', legendY + 9)
    .attr('font-size', '10px')
    .attr('fill', textColor)
    .attr('font-family', 'monospace')
    .text(LEGEND_LABELS[0]);

  colors.forEach((c, i) => {
    svg.append('rect')
      .attr('x', legendX + 34 + i * (CELL + GAP))
      .attr('y', legendY)
      .attr('width', CELL)
      .attr('height', CELL)
      .attr('rx', 2)
      .attr('fill', c);
  });

  svg.append('text')
    .attr('x', legendX + 34 + colors.length * (CELL + GAP) + 2)
    .attr('y', legendY + 9)
    .attr('font-size', '10px')
    .attr('fill', textColor)
    .attr('font-family', 'monospace')
    .text(LEGEND_LABELS[1]);

  // Streak count
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
