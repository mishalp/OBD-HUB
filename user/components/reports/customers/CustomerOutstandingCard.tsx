interface CustomerOutstandingCardProps {
  outstandingAmount: string;
  outstandingInvoiceCount: number;
  totalCollected: string;
  paymentCount: number;
  averagePayment: string;
  averagePaymentTime: number | null;
}

export const CustomerOutstandingCard = ({
  outstandingAmount,
  outstandingInvoiceCount,
  totalCollected,
  paymentCount,
  averagePayment,
  averagePaymentTime,
}: CustomerOutstandingCardProps) => {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="text-base font-semibold text-[#111827]">Outstanding & Payments</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#B45309]">
            Outstanding
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#111827]">{outstandingAmount}</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Across {outstandingInvoiceCount} open invoices
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#15803D]">
            Collected
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#111827]">{totalCollected}</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {paymentCount} payments · Avg {averagePayment}
          </p>
        </div>
      </div>
      <p className="mt-4 rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs text-[#6B7280]">
        Average payment time:{' '}
        {averagePaymentTime === null
          ? 'Coming soon (placeholder)'
          : `${averagePaymentTime} days`}
      </p>
    </section>
  );
};
