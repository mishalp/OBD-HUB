'use client';

import { useMemo, useState } from 'react';
import type {
  AcquisitionTrendPoint,
  PurchaseFrequencyBucket,
  RevenueByCustomerPoint,
} from '@/lib/types/customerReport';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { EmptyReportState } from '@/components/reports/EmptyReportState';

type ChartMode = 'acquisition' | 'revenue' | 'frequency';

interface CustomerTrendChartProps {
  acquisitionTrend: AcquisitionTrendPoint[];
  revenueByCustomer: RevenueByCustomerPoint[];
  purchaseFrequency: PurchaseFrequencyBucket[];
  isLoading?: boolean;
}

const WIDTH = 820;
const HEIGHT = 280;
const PADDING = { top: 16, right: 18, bottom: 48, left: 56 };

const MODE_LABELS: Record<ChartMode, string> = {
  acquisition: 'Customer Acquisition',
  revenue: 'Revenue by Customer',
  frequency: 'Purchase Frequency',
};

const formatAxisDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const compact = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(Math.round(value));
};

export const CustomerTrendChart = ({
  acquisitionTrend,
  revenueByCustomer,
  purchaseFrequency,
  isLoading = false,
}: CustomerTrendChartProps) => {
  const [mode, setMode] = useState<ChartMode>('acquisition');

  const bars = useMemo(() => {
    if (mode === 'acquisition') {
      return acquisitionTrend.map((point) => ({
        label: formatAxisDate(point.date),
        value: point.count,
        tooltip: `${formatAxisDate(point.date)}: ${point.count} new`,
      }));
    }
    if (mode === 'revenue') {
      return revenueByCustomer.map((point) => ({
        label: point.name.length > 10 ? `${point.name.slice(0, 10)}…` : point.name,
        value: point.revenue,
        tooltip: `${point.name}: ${formatMoney(point.revenue)}`,
      }));
    }
    return purchaseFrequency.map((bucket) => ({
      label: bucket.label,
      value: bucket.count,
      tooltip: `${bucket.label}: ${bucket.count}`,
    }));
  }, [mode, acquisitionTrend, revenueByCustomer, purchaseFrequency]);

  const chart = useMemo(() => {
    const innerWidth = WIDTH - PADDING.left - PADDING.right;
    const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
    const maxValue = bars.reduce((max, bar) => Math.max(max, bar.value), 0);
    const niceMax = maxValue <= 0 ? 1 : maxValue * 1.15;
    const gap = 8;
    const barWidth =
      bars.length === 0 ? 0 : Math.max(8, (innerWidth - gap * (bars.length - 1)) / bars.length);

    return {
      innerHeight,
      niceMax,
      barWidth,
      gap,
      items: bars.map((bar, index) => {
        const height = (innerHeight * bar.value) / niceMax;
        const x = PADDING.left + index * (barWidth + gap);
        const y = PADDING.top + innerHeight - height;
        return { ...bar, x, y, height };
      }),
    };
  }, [bars]);

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">Customer Trends</h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            Acquisition, revenue concentration, and purchase frequency.
          </p>
        </div>
        <div
          className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-0.5"
          role="group"
          aria-label="Chart mode"
        >
          {(Object.keys(MODE_LABELS) as ChartMode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === option
                  ? 'bg-white text-[#D32F2F] shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {MODE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[280px] w-full animate-pulse rounded-lg bg-[#F3F4F6]" />
      ) : bars.length === 0 || bars.every((bar) => bar.value === 0) ? (
        <EmptyReportState
          title="No chart data"
          description="There is no customer activity to chart for this period."
        />
      ) : (
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label={MODE_LABELS[mode]}
            preserveAspectRatio="xMidYMid meet"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const value = chart.niceMax * ratio;
              const y = PADDING.top + chart.innerHeight * (1 - ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={PADDING.left}
                    y1={y}
                    x2={WIDTH - PADDING.right}
                    y2={y}
                    stroke="#F3F4F6"
                    strokeWidth={1}
                  />
                  <text
                    x={PADDING.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-[#9CA3AF] text-[10px]"
                  >
                    {mode === 'revenue' ? compact(value) : Math.round(value)}
                  </text>
                </g>
              );
            })}

            {chart.items.map((item) => (
              <g key={`${item.label}-${item.x}`}>
                <rect
                  x={item.x}
                  y={item.y}
                  width={chart.barWidth}
                  height={Math.max(item.height, 1)}
                  rx={4}
                  fill="#D32F2F"
                  opacity={0.85}
                >
                  <title>{item.tooltip}</title>
                </rect>
                <text
                  x={item.x + chart.barWidth / 2}
                  y={HEIGHT - 14}
                  textAnchor="middle"
                  className="fill-[#9CA3AF] text-[9px]"
                >
                  {item.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </section>
  );
};
