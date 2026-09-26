import Link from 'next/link';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { EmptyReportState } from '@/components/reports/EmptyReportState';

interface TimelineItem {
  date: string;
  type: 'invoice' | 'payment';
  label: string;
  amount: number;
  referenceId: string;
  status?: string;
}

interface CustomerTimelineProps {
  items: TimelineItem[];
  isLoading?: boolean;
}

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const CustomerTimeline = ({ items, isLoading = false }: CustomerTimelineProps) => {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="text-base font-semibold text-[#111827]">Purchase Timeline</h3>
      <p className="mt-1 text-sm text-[#6B7280]">
        Combined invoice and payment activity for the period.
      </p>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 w-full animate-pulse rounded bg-[#F3F4F6]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyReportState
            title="No activity"
            description="No invoices or payments in this period."
          />
        </div>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item) => {
            const href =
              item.type === 'invoice'
                ? `/invoices/view?id=${item.referenceId}`
                : `/payments/view?id=${item.referenceId}`;

            return (
              <li
                key={`${item.type}-${item.referenceId}`}
                className="flex items-start gap-3 rounded-lg border border-[#F3F4F6] px-3 py-3"
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    item.type === 'invoice'
                      ? 'bg-[#F3F4F6] text-[#111827]'
                      : 'bg-[#F0FDF4] text-[#15803D]'
                  }`}
                >
                  {item.type === 'invoice' ? 'IN' : 'PY'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={href}
                      className="truncate text-sm font-medium text-[#D32F2F] hover:underline"
                    >
                      {item.label}
                    </Link>
                    <span className="text-sm font-semibold text-[#111827]">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#9CA3AF]">
                    {formatDate(item.date)}
                    {item.status ? ` · ${item.status}` : ''}
                    {` · ${item.type === 'invoice' ? 'Invoice' : 'Payment'}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
