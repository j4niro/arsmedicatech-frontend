import * as d3 from 'd3';
import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";

export default function CalendarChart({
  data,
}: {
  data: { metricName: string; points: { date: string; value: number | null }[] }[];
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    if (!data.length || !data[0].points.length) return;

    const metric = data[0].metricName;
    const points = data[0].points;

    const parseDate = d3.timeParse('%Y-%m-%d');
    const dateValueMap = new Map<string, number | null>();
    points.forEach(p => {
      const d = p.date.slice(0, 10);
      dateValueMap.set(d, p.value);
    });

    const firstDate = points[0].date.slice(0, 10);
    const year = parseInt(firstDate.slice(0, 4));

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const days: { date: Date; value: number }[] = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      days.push({ date: new Date(d), value: dateValueMap.get(iso) ?? 0 });
    }

    const cellSize = 16;
    const weekDays = 7;
    const weeks = Math.ceil(days.length / weekDays);

    const margin = { top: 40, right: 20, bottom: 40, left: 40 };
    const width = weeks * cellSize + margin.left + margin.right;
    const height = weekDays * cellSize + margin.top + margin.bottom;

    const allValues = days.map(d => d.value);
    const color = d3.scaleSequential(d3.interpolateYlGn).domain([0, d3.max(allValues) ?? 1]);

    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg
      .selectAll('rect')
      .data(days)
      .enter()
      .append('rect')
      .attr('x', (_, i) => Math.floor(i / weekDays) * cellSize)
      .attr('y', d => d.date.getDay() * cellSize)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', d => color(d.value))
      .attr('stroke', '#fff');

    const months = d3.timeMonths(start, end);

    svg
      .selectAll('text.month')
      .data(months)
      .enter()
      .append('text')
      .attr('class', 'month')
      .attr('x', d => Math.floor(d3.timeDay.count(start, d) / weekDays) * cellSize)
      .attr('y', -8)
      .attr('font-size', 12)
      .text(d => t(d3.timeFormat('%b')(d)));

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    svg
      .selectAll('text.day')
      .data(weekdays)
      .enter()
      .append('text')
      .attr('class', 'day')
      .attr('x', -8)
      .attr('y', (_, i) => i * cellSize + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', 10)
      .text(d => t(d));

    const legendWidth = 80;
    const legendHeight = 10;

    const legendSvg = svg
      .append('g')
      .attr('transform', `translate(0,${weekDays * cellSize + 20})`);

    const legendScale = d3.scaleLinear().domain(color.domain() as [number, number]).range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(4).tickFormat(d3.format('.0f'));

    const defs = svg.append('defs');
    const gradientId = 'calendar-gradient';

    const gradient = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');

    for (let i = 0; i <= 100; i++) {
      gradient.append('stop')
        .attr('offset', `${i}%`)
        .attr('stop-color', color(legendScale.invert((i / 100) * legendWidth)));
    }

    legendSvg
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', `url(#${gradientId})`);

    legendSvg
      .append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .attr('font-size', 10);

    legendSvg
      .append('text')
      .attr('x', legendWidth / 2)
      .attr('y', legendHeight + 18)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .text(metric); // NON traduit

  }, [data]);

  return <div ref={ref}></div>;
}
