interface CustomerRevenueCardProps {
  title?: string;
  revenue: string;
  invoiceCount: number;
  averageInvoice: string;
  paidCount: number;
  unpaidCount: number;
  partiallyPaidCount: number;
}

export const CustomerRevenueCard = ({
  title = 'Revenue Summary',
  revenue,
  invoiceCount,
  averageInvoice,
  paidCount,
  unpaidCount,
  partiallyPaidCount,
}: CustomerRevenueCardProps) => {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
      <p className="mt-3 text-2xl font-semibold text-[#111827]">{revenue}</p>
      <p className="mt-1 text-sm text-[#6B7280]">
        {invoiceCount} invoices · Avg {averageInvoice}
      </p>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-[#F0FDF4] px-2 py-3">
          <dt className="text-xs text-[#15803D]">Paid</dt>
          <dd className="mt-1 text-lg font-semibold text-[#111827]">{paidCount}</dd>
        </div>
        <div className="rounded-lg bg-[#FFFBEB] px-2 py-3">
          <dt className="text-xs text-[#B45309]">Unpaid</dt>
          <dd className="mt-1 text-lg font-semibold text-[#111827]">{unpaidCount}</dd>
        </div>
        <div className="rounded-lg bg-[#F3F4F6] px-2 py-3">
          <dt className="text-xs text-[#111827]">Partial</dt>
          <dd className="mt-1 text-lg font-semibold text-[#111827]">{partiallyPaidCount}</dd>
        </div>
      </dl>
    </section>
  );
};
