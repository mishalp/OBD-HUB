'use client';

import { useMemo, useState } from 'react';
import type { SalesTrendPoint, TrendGranularity } from '@/lib/types/report';
import { TREND_GRANULARITIES, TREND_GRANULARITY_LABELS } from '@/lib/types/report';
import { formatMoney } from '@/lib/utils/invoiceCalculations';

type SeriesKey = 'grossSales' | 'collectedAmount' | 'outstandingAmount';

interface TrendChartProps {
  data: SalesTrendPoint[];
  granularity: TrendGranularity;
  onGranularityChange?: (granularity: TrendGranularity) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  showGranularity?: boolean;
  /** Renames series so the chart can be reused for non-sales datasets. */
  seriesLabels?: Partial<Record<SeriesKey, string>>;
  emptyTitle?: string;
  emptyDescription?: string;
}

const DEFAULT_SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: 'grossSales', label: 'Gross Sales', color: '#D32F2F' },
  { key: 'collectedAmount', label: 'Collected', color: '#111111' },
  { key: 'outstandingAmount', label: 'Outstanding', color: '#6B7280' },
];

const WIDTH = 820;
const HEIGHT = 300;
const PADDING = { top: 16, right: 18, bottom: 40, left: 64 };

const formatAxisDate = (iso: string, granularity: TrendGranularity): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  switch (granularity) {
    case 'yearly':
      return date.toLocaleDateString('en-IN', { year: 'numeric' });
    case 'monthly':
      return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    case 'weekly':
    case 'daily':
    default:
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }
};

const compactMoney = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(Math.round(value));
};

export const TrendChart = ({
  data,
  granularity,
  onGranularityChange,
  isLoading = false,
  title = 'Sales Trend',
  description = 'Gross sales, collections, and outstanding over time.',
  showGranularity = true,
  seriesLabels,
  emptyTitle = 'No trend data',
  emptyDescription = 'There are no invoices in the selected period.',
}: TrendChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const SERIES = useMemo(
    () =>
      DEFAULT_SERIES.map((definition) => ({
        ...definition,
        label: seriesLabels?.[definition.key] ?? definition.label,
      })),
    [seriesLabels],
  );

  const chart = useMemo(() => {
    const innerWidth = WIDTH - PADDING.left - PADDING.right;
    const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

    const maxValue = data.reduce((max, point) => {
      return Math.max(max, point.grossSales, point.collectedAmount, point.outstandingAmount);
    }, 0);
    const niceMax = maxValue <= 0 ? 100 : maxValue * 1.1;

    const xFor = (index: number): number => {
      if (data.length <= 1) {
        return PADDING.left + innerWidth / 2;
      }
      return PADDING.left + (innerWidth * index) / (data.length - 1);
    };

    const yFor = (value: number): number => {
      return PADDING.top + innerHeight - (innerHeight * value) / niceMax;
    };

    const series = SERIES.map((definition) => {
      const points = data.map((point, index) => ({
        x: xFor(index),
        y: yFor(point[definition.key]),
      }));
      const path = points
        .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`)
        .join(' ');
      return { ...definition, points, path };
    });

    const yTicks = Array.from({ length: 5 }, (_, index) => {
      const value = (niceMax / 4) * index;
      return { value, y: yFor(value) };
    });

    return { innerWidth, innerHeight, xFor, series, yTicks };
  }, [data, SERIES]);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
        </div>
        {showGranularity && onGranularityChange ? (
          <div
            className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-0.5"
            role="group"
            aria-label="Trend granularity"
          >
            {TREND_GRANULARITIES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onGranularityChange(option)}
                aria-pressed={granularity === option}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  granularity === option
                    ? 'bg-white text-[#D32F2F] shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {TREND_GRANULARITY_LABELS[option]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="h-[300px] w-full animate-pulse rounded-lg bg-[#F3F4F6]" />
      ) : data.length === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-[#E5E7EB] bg-[#fafbfc] text-center">
          <p className="text-sm font-medium text-[#111827]">{emptyTitle}</p>
          <p className="mt-1 text-sm text-[#6B7280]">{emptyDescription}</p>
        </div>
      ) : (
        <>
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-auto w-full"
              role="img"
              aria-label="Sales trend line chart"
              preserveAspectRatio="xMidYMid meet"
            >
              {chart.yTicks.map((tick) => (
                <g key={tick.value}>
                  <line
                    x1={PADDING.left}
                    y1={tick.y}
                    x2={WIDTH - PADDING.right}
                    y2={tick.y}
                    stroke="#F3F4F6"
                    strokeWidth={1}
                  />
                  <text
                    x={PADDING.left - 10}
                    y={tick.y + 4}
                    textAnchor="end"
                    className="fill-[#9CA3AF] text-[10px]"
                  >
                    {compactMoney(tick.value)}
                  </text>
                </g>
              ))}

              {data.map((point, index) => {
                const x = chart.xFor(index);
                const showLabel =
                  data.length <= 8 || index % Math.ceil(data.length / 8) === 0;
                return showLabel ? (
                  <text
                    key={point.date}
                    x={x}
                    y={HEIGHT - PADDING.bottom + 20}
                    textAnchor="middle"
                    className="fill-[#9CA3AF] text-[10px]"
                  >
                    {formatAxisDate(point.date, granularity)}
                  </text>
                ) : null;
              })}

              {chart.series.map((series) => (
                <path
                  key={series.key}
                  d={series.path}
                  fill="none"
                  stroke={series.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {chart.series.map((series) =>
                series.points.map((coord, index) => (
                  <circle
                    key={`${series.key}-${index}`}
                    cx={coord.x}
                    cy={coord.y}
                    r={activeIndex === index ? 4 : 2.5}
                    fill="#ffffff"
                    stroke={series.color}
                    strokeWidth={2}
                  />
                )),
              )}

              {data.map((point, index) => (
                <rect
                  key={`hit-${point.date}`}
                  x={chart.xFor(index) - 12}
                  y={PADDING.top}
                  width={24}
                  height={chart.innerHeight}
                  fill="transparent"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              ))}
            </svg>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4">
              {SERIES.map((series) => (
                <span key={series.key} className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: series.color }}
                    aria-hidden="true"
                  />
                  {series.label}
                </span>
              ))}
            </div>
            {activeIndex !== null && data[activeIndex] ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-[#FAFAFA] px-3 py-1.5 text-xs text-[#6B7280]">
                <span className="font-medium text-[#111827]">
                  {formatAxisDate(data[activeIndex].date, granularity)}
                </span>
                {SERIES.map((series) => (
                  <span key={series.key}>
                    <span style={{ color: series.color }}>{series.label}: </span>
                    {formatMoney(data[activeIndex][series.key])}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};
