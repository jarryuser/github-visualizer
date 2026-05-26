import * as d3 from 'd3';
import type { GithubEvent } from './api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELL = 14;
const GAP = 2;
const STEP = CELL + GAP;

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function renderCommitHeatmap(container: HTMLElement, events: GithubEvent[]) {
  container.innerHTML = '';
  const textColor = cssVar('--text-muted') || '#8b949e';
  const textColorFaint = cssVar('--border') || '#484f58';
  const bgCard = cssVar('--bg-card') || '#161b22';
  const accent = cssVar('--accent') || '#388bfd';

  const pushEvents = events.filter(e => e.type === 'PushEvent');

  if (pushEvents.length === 0) {
    container.innerHTML =
      '<p style="font-size:13px;color:var(--color-text-tertiary)">No push events found in the last 90 days.</p>';
    return;
  }

  // Build a [day][hour] count grid (UTC times)
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const event of pushEvents) {
    const d = new Date(event.created_at);
    grid[d.getUTCDay()][d.getUTCHours()]++;
  }

  const maxVal = Math.max(1, ...grid.flat());

  const colorScale = d3.scaleSequential()
    .domain([0, maxVal])
    .interpolator(d3.interpolate(bgCard, accent));

  const leftPad = 32;
  const topPad = 22;
  const svgWidth = leftPad + 24 * STEP;
  const svgHeight = topPad + 7 * STEP + 24;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .style('display', 'block');

  // Hour labels every 6 hours
  for (let h = 0; h < 24; h += 6) {
    svg.append('text')
      .attr('x', leftPad + h * STEP + CELL / 2)
      .attr('y', topPad - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', textColor)
      .attr('font-family', 'monospace')
      .text(`${h}:00`);
  }

  // Day labels
  DAYS.forEach((day, i) => {
    svg.append('text')
      .attr('x', leftPad - 4)
      .attr('y', topPad + i * STEP + CELL * 0.75)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', textColor)
      .attr('font-family', 'monospace')
      .text(day);
  });

  const tooltip = d3.select(container)
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

  const containerRect = container.getBoundingClientRect();

  // Cells
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const count = grid[day][hour];
      svg.append('rect')
        .attr('x', leftPad + hour * STEP)
        .attr('y', topPad + day * STEP)
        .attr('width', CELL)
        .attr('height', CELL)
        .attr('rx', 2)
        .attr('fill', count === 0 ? bgCard : colorScale(count))
        .style('cursor', count > 0 ? 'crosshair' : 'default')
        .on('mouseover', function(event: MouseEvent) {
          if (count === 0) return;
          const label = `${count} push${count > 1 ? 'es' : ''} on ${DAYS[day]} at ${hour}:00 UTC`;
          tooltip
            .style('opacity', '1')
            .style('left', `${event.pageX - containerRect.left + 12}px`)
            .style('top', `${event.pageY - containerRect.top - 32}px`)
            .text(label);
        })
        .on('mouseout', () => tooltip.style('opacity', '0'));
    }
  }

  // Find peak day+hour
  let peakDay = 0;
  let peakHour = 0;
  let peakCount = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (grid[d][h] > peakCount) {
        peakCount = grid[d][h];
        peakDay = d;
        peakHour = h;
      }
    }
  }

  const footerText = `Most active on ${DAYS[peakDay]}s at ${peakHour}:00 UTC - ${pushEvents.length} push events total`;

  svg.append('text')
    .attr('x', leftPad)
    .attr('y', topPad + 7 * STEP + 16)
    .attr('font-size', '10px')
    .attr('fill', textColorFaint)
    .attr('font-family', 'monospace')
    .text(footerText);
}
