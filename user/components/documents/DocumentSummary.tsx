import { formatDocumentMoney } from '@/lib/documents/types';

interface DocumentSummaryProps {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  currencySymbol?: string;
}

export const DocumentSummary = ({
  subtotal,
  discountTotal,
  taxTotal,
  grandTotal,
  currencySymbol = '₹',
}: DocumentSummaryProps) => {
  return (
    <aside className="ml-auto w-full max-w-[240px] text-sm">
      <div className="space-y-2 border border-[#e5e5e5] p-3">
        <div className="flex justify-between gap-3">
          <span className="text-[#525252]">Subtotal</span>
          <span className="font-medium text-black">
            {formatDocumentMoney(subtotal, currencySymbol)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[#525252]">Discount Total</span>
          <span className="font-medium text-black">
            {formatDocumentMoney(discountTotal, currencySymbol)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[#525252]">Tax Total</span>
          <span className="font-medium text-black">
            {formatDocumentMoney(taxTotal, currencySymbol)}
          </span>
        </div>
        <div className="flex justify-between gap-3 bg-[#b91c1c] px-2 py-2 text-white">
          <span className="font-semibold">Grand Total</span>
          <span className="font-semibold">
            {formatDocumentMoney(grandTotal, currencySymbol)}
          </span>
        </div>
      </div>
    </aside>
  );
};
