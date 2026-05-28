import * as d3 from 'd3';
import type { Contribution } from './api';

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function renderActivityChart(container: HTMLElement, contributions: Contribution[]) {
  container.innerHTML = '';

  const accent = cssVar('--accent') || '#2f81f7';
  const textColor = cssVar('--text-muted') || '#8b949e';
  const gridColor = cssVar('--border') || '#30363d';

  // Aggregate by week
  const byWeek = d3.rollup(
    contributions,
    v => d3.sum(v, d => d.count),
    d => d3.timeWeek.floor(new Date(d.date + 'T12:00:00')).toISOString()
  );

  const data = Array.from(byWeek, ([iso, total]) => ({
    date: new Date(iso),
    total,
  })).sort((a, b) => a.date.getTime() - b.date.getTime());

  if (data.length === 0) return;

  const margin = { top: 12, right: 12, bottom: 22, left: 28 };
  const totalWidth = container.getBoundingClientRect().width || 600;
  const totalHeight = 130;
  const W = totalWidth - margin.left - margin.right;
  const H = totalHeight - margin.top - margin.bottom;

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date) as [Date, Date])
    .range([0, W]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.total) ?? 1])
    .range([H, 0])
    .nice();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', totalWidth)
    .attr('height', totalHeight)
    .style('display', 'block');

  const defs = svg.append('defs');
  const gradId = 'activity-area-grad';
  const grad = defs.append('linearGradient')
    .attr('id', gradId)
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%');
  grad.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', accent)
    .attr('stop-opacity', 0.35);
  grad.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', accent)
    .attr('stop-opacity', 0.02);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Grid lines
  g.append('g')
    .call(
      d3.axisLeft(y).ticks(3).tickSize(-W).tickFormat(() => '')
    )
    .call(ax => {
      ax.select('.domain').remove();
      ax.selectAll('.tick line')
        .attr('stroke', gridColor)
        .attr('stroke-dasharray', '3,4');
    });

  // Area
  const area = d3.area<{ date: Date; total: number }>()
    .x(d => x(d.date))
    .y0(H)
    .y1(d => y(d.total))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(data)
    .attr('fill', `url(#${gradId})`)
    .attr('d', area);

  // Line
  const line = d3.line<{ date: Date; total: number }>()
    .x(d => x(d.date))
    .y(d => y(d.total))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', accent)
    .attr('stroke-width', 1.5)
    .attr('d', line);

  // X axis - month labels
  g.append('g')
    .attr('transform', `translate(0,${H})`)
    .call(
      d3.axisBottom(x)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat('%b') as any)
        .tickSize(0)
        .tickPadding(6)
    )
    .call(ax => {
      ax.select('.domain').remove();
      ax.selectAll('text')
        .attr('fill', textColor)
        .attr('font-size', '10px')
        .attr('font-family', 'monospace');
    });

  // Y axis labels
  g.append('g')
    .call(
      d3.axisLeft(y).ticks(3).tickSize(0).tickPadding(4)
    )
    .call(ax => {
      ax.select('.domain').remove();
      ax.selectAll('text')
        .attr('fill', textColor)
        .attr('font-size', '9px')
        .attr('font-family', 'monospace');
    });

  // Hover elements
  const hoverLine = g.append('line')
    .attr('stroke', textColor)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3')
    .attr('y1', 0)
    .attr('y2', H)
    .style('opacity', 0)
    .style('pointer-events', 'none');

  const hoverDot = g.append('circle')
    .attr('r', 4)
    .attr('fill', accent)
    .attr('stroke-width', 2)
    .style('opacity', 0)
    .style('pointer-events', 'none');

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

  const bisect = d3.bisector<{ date: Date; total: number }, Date>(d => d.date).left;
  const containerRect = container.getBoundingClientRect();

  // Invisible overlay for mouse events
  svg.append('rect')
    .attr('width', totalWidth)
    .attr('height', totalHeight)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mousemove', function(event: MouseEvent) {
      const [mx] = d3.pointer(event, g.node());
      const hoverDate = x.invert(mx);
      const idx = bisect(data, hoverDate, 1);
      const d0 = data[idx - 1];
      const d1 = data[idx];
      if (!d0) return;
      const d =
        !d1 || hoverDate.getTime() - d0.date.getTime() < d1.date.getTime() - hoverDate.getTime()
          ? d0
          : d1;

      const px = x(d.date);
      const py = y(d.total);

      hoverLine.attr('x1', px).attr('x2', px).style('opacity', 0.5);
      hoverDot.attr('cx', px).attr('cy', py).style('opacity', 1);

      const label = d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      tooltip
        .style('opacity', '1')
        .style('left', `${event.pageX - containerRect.left + 12}px`)
        .style('top', `${event.pageY - containerRect.top - 36}px`)
        .text(`Week of ${label}: ${d.total} contribution${d.total !== 1 ? 's' : ''}`);
    })
    .on('mouseleave', () => {
      hoverLine.style('opacity', 0);
      hoverDot.style('opacity', 0);
      tooltip.style('opacity', '0');
    });
}
