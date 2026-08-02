'use client';

import type { InvoiceStatusBreakdownItem } from '@/lib/types/invoiceReport';
import { INVOICE_REPORT_STATUS_COLORS } from '@/lib/types/invoiceReport';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { EmptyReportState } from '@/components/reports/EmptyReportState';

interface InvoiceStatusChartProps {
  statuses: InvoiceStatusBreakdownItem[];
  totalInvoices: number;
  isLoading?: boolean;
}

const SIZE = 200;
const RADIUS = 78;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const InvoiceStatusChart = ({
  statuses,
  totalInvoices,
  isLoading = false,
}: InvoiceStatusChartProps) => {
  const visible = statuses.filter((entry) => entry.invoiceCount > 0);
  const hasData = visible.length > 0 && totalInvoices > 0;

  // Each arc starts where the previous one ended, so offsets are the running
  // total of every preceding segment.
  const arcs = visible.map((entry, index) => {
    const precedingCount = visible
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.invoiceCount, 0);

    return {
      status: entry.status,
      color: INVOICE_REPORT_STATUS_COLORS[entry.status] ?? '#9CA3AF',
      dash: (entry.invoiceCount / totalInvoices) * CIRCUMFERENCE,
      offset: (precedingCount / totalInvoices) * CIRCUMFERENCE,
    };
  });

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#111827]">
          Invoice Status Distribution
        </h3>
        <p className="mt-1 text-sm text-[#6B7280]">
          Share of invoices by status for the selected period.
        </p>
      </div>

      {isLoading ? (
        <div className="h-[220px] w-full animate-pulse rounded-lg bg-[#F3F4F6]" />
      ) : !hasData ? (
        <EmptyReportState
          title="No invoices"
          description="No invoices were created in the selected period."
        />
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="h-48 w-48 shrink-0 -rotate-90"
            role="img"
            aria-label="Invoice status distribution donut chart"
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth={STROKE}
            />
            {arcs.map((arc) => (
              <circle
                key={arc.status}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE}
                strokeDasharray={`${arc.dash} ${CIRCUMFERENCE - arc.dash}`}
                strokeDashoffset={-arc.offset}
              >
                <title>{arc.status}</title>
              </circle>
            ))}
          </svg>

          <dl className="w-full space-y-2">
            {statuses.map((entry) => (
              <div
                key={entry.status}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#F3F4F6] px-3 py-2"
              >
                <dt className="flex items-center gap-2 text-sm text-[#374151]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        INVOICE_REPORT_STATUS_COLORS[entry.status] ?? '#9CA3AF',
                    }}
                    aria-hidden="true"
                  />
                  {entry.status}
                </dt>
                <dd className="text-right text-sm">
                  <span className="font-semibold text-[#111827]">
                    {entry.invoiceCount}
                  </span>
                  <span className="ml-2 text-xs text-[#9CA3AF]">
                    {entry.percentage.toFixed(1)}% · {formatMoney(entry.totalAmount)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
};
