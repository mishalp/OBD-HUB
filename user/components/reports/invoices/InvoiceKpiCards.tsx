import type { InvoiceReportSummary } from '@/lib/types/invoiceReport';
import { INVOICE_REPORT_STATUS_COLORS } from '@/lib/types/invoiceReport';

interface InvoiceKpiCardsProps {
  summary: InvoiceReportSummary | null;
  isLoading?: boolean;
}

export const InvoiceKpiCards = ({ summary, isLoading = false }: InvoiceKpiCardsProps) => {
  const kpis = [
    { status: 'Draft', label: 'Draft', value: summary?.draftCount ?? 0 },
    { status: 'Unpaid', label: 'Unpaid', value: summary?.unpaidCount ?? 0 },
    {
      status: 'Partially Paid',
      label: 'Partially Paid',
      value: summary?.partiallyPaidCount ?? 0,
    },
    { status: 'Paid', label: 'Paid', value: summary?.paidCount ?? 0 },
    { status: 'Cancelled', label: 'Cancelled', value: summary?.cancelledCount ?? 0 },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <article
          key={kpi.status}
          className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: INVOICE_REPORT_STATUS_COLORS[kpi.status] ?? '#9CA3AF',
              }}
              aria-hidden="true"
            />
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              {kpi.label}
            </p>
          </div>
          {isLoading ? (
            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-[#F3F4F6]" />
          ) : (
            <p className="mt-2 text-2xl font-semibold text-[#111827]">{kpi.value}</p>
          )}
          <p className="mt-2 text-xs text-[#9CA3AF]">Invoices in period</p>
        </article>
      ))}
    </section>
  );
};
