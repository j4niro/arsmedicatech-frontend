import * as d3 from 'd3';
import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";

export default function Heatmap({
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

    const parseDateTime = d3.timeParse('%Y-%m-%dT%H:%M');
    const allDates = Array.from(new Set(points.map(p => p.date.slice(0, 10)))).sort();

    let hasHour = points.some(p => p.date.includes('T'));

    const hours = hasHour
      ? Array.from(new Set(points.map(p => {
          const dt = parseDateTime(p.date);
          return dt ? dt.getHours().toString().padStart(2, '0') + ':00' : '00:00';
        }))).sort()
      : ['all'];

    const matrix = hours.map(hour =>
      allDates.map(date => {
        let match = points.find(p => {
          if (!hasHour) return p.date.slice(0, 10) === date;
          const dt = parseDateTime(p.date);
          return dt &&
            dt.getHours().toString().padStart(2, '0') + ':00' === hour &&
            p.date.slice(0, 10) === date;
        });

        return match ? match.value ?? 0 : 0;
      })
    );

    const margin = { top: 40, right: 20, bottom: 40, left: 60 };
    const cellSize = 28;

    const width = allDates.length * cellSize + margin.left + margin.right;
    const height = hours.length * cellSize + margin.top + margin.bottom;

    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const allValues = matrix.flat();
    const color = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([d3.min(allValues) ?? 0, d3.max(allValues) ?? 1]);

    svg
      .selectAll('g.row')
      .data(matrix)
      .enter()
      .append('g')
      .attr('class', 'row')
      .attr('transform', (_, i) => `translate(0,${i * cellSize})`)
      .selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', (_, j) => j * cellSize)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', d => color(d));

    svg
      .append('g')
      .selectAll('text')
      .data(allDates)
      .enter()
      .append('text')
      .attr('x', (_, i) => i * cellSize + cellSize / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .text(d => t(d));

    svg
      .append('g')
      .selectAll('text')
      .data(hours)
      .enter()
      .append('text')
      .attr('x', -8)
      .attr('y', (_, i) => i * cellSize + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', 12)
      .text(d => t(d));

    const legendWidth = 100;
    const legendHeight = 12;

    const legendSvg = svg.append('g')
      .attr('transform', `translate(0,${hours.length * cellSize + 20})`);

    const legendScale = d3.scaleLinear()
      .domain(color.domain() as [number, number])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format('.2f'));

    const defs = svg.append('defs');
    const gradientId = 'heatmap-gradient';

    const gradient = defs.append('linearGradient')
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

    legendSvg.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', `url(#${gradientId})`);

    legendSvg.append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .attr('font-size', 10);

    legendSvg.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', legendHeight + 24)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .text(metric); // non traduit

  }, [data]);

  return <div ref={ref}></div>;
}
