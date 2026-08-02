import { formatMoney, type InvoiceTotals } from '@/lib/utils/invoiceCalculations';

interface InvoiceSummaryCardProps {
  totals: InvoiceTotals;
  currencySymbol?: string;
}

export const InvoiceSummaryCard = ({
  totals,
  currencySymbol = '₹',
}: InvoiceSummaryCardProps) => {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="text-base font-semibold text-[#111827]">Summary</h3>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#6B7280]">Subtotal</dt>
          <dd className="font-medium text-[#111827]">
            {formatMoney(totals.subtotal, currencySymbol)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#6B7280]">Discount Total</dt>
          <dd className="font-medium text-[#111827]">
            {formatMoney(totals.discountTotal, currencySymbol)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#6B7280]">Tax Total</dt>
          <dd className="font-medium text-[#111827]">
            {formatMoney(totals.taxTotal, currencySymbol)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3">
          <dt className="text-base font-semibold text-[#111827]">Grand Total</dt>
          <dd className="text-lg font-semibold text-[#D32F2F]">
            {formatMoney(totals.grandTotal, currencySymbol)}
          </dd>
        </div>
      </dl>
    </section>
  );
};
