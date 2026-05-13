import * as d3 from 'd3';
import type { Contribution } from './api';

const CELL    = 13;
const GAP     = 3;
const STEP    = CELL + GAP;
const COLORS  = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


export function renderStreakGraph(
  container: HTMLElement,
  contributions: Contribution[]
): number {
  container.innerHTML = '';

  const weeks = d3.groups(
    contributions,
    d => d3.timeWeek.floor(new Date(d.date + 'T12:00:00')).toISOString()
  );

  const DAY_LABEL_WIDTH = 28;
  const svgWidth  = weeks.length * STEP + DAY_LABEL_WIDTH;
  const svgHeight = 7 * STEP + 20;  // +20 для лейблов месяцев сверху

  const svg = d3.select(container)
    .append('svg')
    .attr('width',  svgWidth)
    .attr('height', svgHeight)
    .style('display', 'block');

  // ── Tooltip ────────────────────────────────────────────────────────────────
  const tooltipSel = d3.select(container)
    .append('div')
    .style('position',        'absolute')
    .style('background',      'rgba(0,0,0,.78)')
    .style('color',           '#fff')
    .style('font-size',       '12px')
    .style('padding',         '5px 10px')
    .style('border-radius',   '6px')
    .style('pointer-events',  'none')
    .style('white-space',     'nowrap')
    .style('opacity',         '0')
    .style('transition',      'opacity .1s');

  // ── Months labels ─────────────────────────────────────────────────────────
  const seenMonths = new Set<string>();
  const monthFmt   = d3.timeFormat('%b');

  weeks.forEach(([weekIso], i) => {
    const weekDate = new Date(weekIso);
    const month    = monthFmt(weekDate);
    if (seenMonths.has(month)) return;
    seenMonths.add(month);

    svg.append('text')
      .attr('x',           i * STEP)
      .attr('y',           11)
      .attr('font-size',   '10px')
      .attr('fill',        '#8b949e')
      .attr('font-family', 'monospace')
      .text(month);
  });

  // ── Cells ─────────────────────────────────────────────────────────────────
  const containerRect = container.getBoundingClientRect();

  weeks.forEach(([, days], weekIdx) => {
    svg.selectAll(null)
      .data(days)
      .join('rect')
      .attr('x',      weekIdx * STEP)
      .attr('y',      d => new Date(d.date + 'T12:00:00').getDay() * STEP + 16)
      .attr('width',  CELL)
      .attr('height', CELL)
      .attr('rx',     2)
      .attr('fill',   d => COLORS[d.level])
      .style('cursor', 'crosshair')
      .on('mouseover', function(event: MouseEvent, d: Contribution) {
        const fmt  = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
        });
        const text = d.count === 0
          ? `No contributions on ${fmt}`
          : `${d.count} contribution${d.count > 1 ? 's' : ''} on ${fmt}`;

        tooltipSel
          .style('opacity', '1')
          .style('left',    `${event.pageX - containerRect.left + 12}px`)
          .style('top',     `${event.pageY - containerRect.top  - 32}px`)
          .text(text);
      })
      .on('mouseout', () => tooltipSel.style('opacity', '0'));
  });

  // ── Day labels ────────────────────────────────────────────────────────────
  [1, 3, 5].forEach(dayIdx => {
    svg.append('text')
      .attr('x',           weeks.length * STEP + 4)
      .attr('y',           dayIdx * STEP + 16 + CELL * 0.75)
      .attr('font-size',   '10px')
      .attr('fill',        '#8b949e')
      .attr('font-family', 'monospace')
      .text(DAY_LABELS[dayIdx]);
  });

  // ── streak ─────────────────────────────────────────────────────────
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
