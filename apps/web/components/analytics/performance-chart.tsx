"use client";
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';

interface DataPoint {
  time: string;
  value: number;
}

interface PerformanceChartProps {
  data: DataPoint[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
  title?: string;
}

export function PerformanceChart({ 
  data, 
  colors: {
    backgroundColor = 'transparent',
    lineColor = '#6366f1',
    textColor = '#94a3b8',
    areaTopColor = 'rgba(99, 102, 241, 0.5)',
    areaBottomColor = 'rgba(99, 102, 241, 0.05)',
  } = {},
  title
}: PerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
    });

    const newSeries = chartRef.current.addAreaSeries({ 
      lineColor, 
      topColor: areaTopColor, 
      bottomColor: areaBottomColor,
      lineWidth: 2
    });

    newSeries.setData(data);
    chartRef.current.timeScale().fitContent();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.remove();
    };
  }, [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

  return (
    <div className="w-full flex flex-col space-y-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      {title && <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>}
      <div ref={chartContainerRef} className="w-full relative" />
    </div>
  );
}
