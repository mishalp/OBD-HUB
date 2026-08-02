import type { InvoiceItemSnapshot } from '@/lib/types/invoice';
import { formatDocumentMoney } from '@/lib/documents/types';
import { showsQuantityFields } from '@/lib/utils/invoiceItemDisplay';

interface DocumentItemsTableProps {
  items: InvoiceItemSnapshot[];
  currencySymbol?: string;
}

export const DocumentItemsTable = ({
  items,
  currencySymbol = '₹',
}: DocumentItemsTableProps) => {
  return (
    <section className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <thead>
          <tr className="bg-[#b91c1c] text-white">
            <th className="px-2 py-2 font-semibold">#</th>
            <th className="px-2 py-2 font-semibold">Item</th>
            <th className="px-2 py-2 font-semibold">Description</th>
            <th className="px-2 py-2 font-semibold">Qty</th>
            <th className="px-2 py-2 font-semibold">Unit</th>
            <th className="px-2 py-2 font-semibold">Price</th>
            <th className="px-2 py-2 font-semibold">Discount</th>
            <th className="px-2 py-2 font-semibold">Tax</th>
            <th className="px-2 py-2 font-semibold">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const showQty = showsQuantityFields(item.type);

            return (
              <tr
                key={`${item.itemId}-${index}`}
                className={index % 2 === 1 ? 'bg-[#f5f5f5]' : 'bg-white'}
              >
                <td className="border-b border-[#e5e5e5] px-2 py-2 align-top">{index + 1}</td>
                <td className="border-b border-[#e5e5e5] px-2 py-2 align-top font-medium text-black">
                  {item.itemName}
                </td>
                <td className="border-b border-[#e5e5e5] px-2 py-2 align-top text-[#525252]">
                  {item.itemCode} · {item.type}
                </td>
                <td className="border-b border-[#e5e5e5] px-2 py-2 align-top">
                  {showQty ? item.quantity : null}
                </td>
                <td className="border-b border-[#e5e5e5] px-2 py-2 align-top">
                  {showQty ? item.unit : null}
                </td>
                <td className="border-b border-[#e5e5e5] px-2 py-2 align-top">
                  {formatDocumentMoney(item.unitPrice, currencySymbol)}
                </td>
                <td className="border-b border-[#e5e5e5] px-2 py-2 align-top">
                  {formatDocumentMoney(item.discount, currencySymbol)}
                </td>
                <td className="border-b border-[#e5e5e5] px-2 py-2 align-top">
                  {formatDocumentMoney(item.taxAmount, currencySymbol)}
                  {/* <span className="block text-[10px] text-[#737373]">{item.taxRate}%</span> */}
                </td>
                <td className="border-b border-[#e5e5e5] px-2 py-2 align-top font-medium">
                  {formatDocumentMoney(item.lineTotal, currencySymbol)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};
