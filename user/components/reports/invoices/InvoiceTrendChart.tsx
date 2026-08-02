'use client';

import { useMemo } from 'react';
import type { InvoiceTrendPoint } from '@/lib/types/invoiceReport';
import type { SalesTrendPoint, TrendGranularity } from '@/lib/types/report';
import { TrendChart } from '@/components/reports/TrendChart';

interface InvoiceTrendChartProps {
  data: InvoiceTrendPoint[];
  granularity: TrendGranularity;
  onGranularityChange: (granularity: TrendGranularity) => void;
  isLoading?: boolean;
}

const formatAxisDate = (iso: string, granularity: TrendGranularity): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  if (granularity === 'yearly') {
    return date.toLocaleDateString('en-IN', { year: 'numeric' });
  }
  if (granularity === 'monthly') {
    return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const InvoiceTrendChart = ({
  data,
  granularity,
  onGranularityChange,
  isLoading = false,
}: InvoiceTrendChartProps) => {
  // The shared sales chart plots three money series; invoice value maps onto
  // the gross series so the component can be reused as-is.
  const valueSeries: SalesTrendPoint[] = useMemo(
    () =>
      data.map((point) => ({
        date: point.date,
        grossSales: point.invoiceValue,
        collectedAmount: point.collectedAmount,
        outstandingAmount: point.outstandingAmount,
        invoiceCount: point.invoiceCount,
      })),
    [data],
  );

  const maxCount = data.reduce((max, point) => Math.max(max, point.invoiceCount), 0);

  return (
    <div className="space-y-6">
      <TrendChart
        data={valueSeries}
        granularity={granularity}
        onGranularityChange={onGranularityChange}
        isLoading={isLoading}
        title="Invoice Value & Collections Trend"
        description="Invoice value, collections, and outstanding over time."
        seriesLabels={{ grossSales: 'Invoice Value' }}
        emptyTitle="No invoice trend data"
        emptyDescription="No invoices were raised in the selected period."
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Invoice Count Trend</h3>
        <p className="mt-1 text-sm text-[#6B7280]">
          Number of invoices raised per {granularity.replace('ly', '')} period.
        </p>

        {isLoading ? (
          <div className="mt-4 h-32 w-full animate-pulse rounded-lg bg-[#F3F4F6]" />
        ) : data.length === 0 || maxCount === 0 ? (
          <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-[#E5E7EB] bg-[#fafbfc] text-sm text-[#6B7280]">
            No invoices in the selected period.
          </div>
        ) : (
          <ul className="mt-4 flex h-36 items-end gap-1.5 overflow-x-auto">
            {data.map((point) => (
              <li
                key={point.date}
                className="flex min-w-[28px] flex-1 flex-col items-center justify-end gap-1"
                title={`${formatAxisDate(point.date, granularity)}: ${point.invoiceCount} invoices`}
              >
                <span className="text-[10px] font-medium text-[#6B7280]">
                  {point.invoiceCount}
                </span>
                <span
                  className="w-full rounded-t bg-[#D32F2F]/85"
                  style={{
                    height: `${Math.max((point.invoiceCount / maxCount) * 88, 3)}px`,
                  }}
                  aria-hidden="true"
                />
                <span className="truncate text-[9px] text-[#9CA3AF]">
                  {formatAxisDate(point.date, granularity)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
