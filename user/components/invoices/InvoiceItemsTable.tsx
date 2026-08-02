'use client';

import type { InvoiceLineForm } from '@/lib/types/invoice';
import type { Item } from '@/lib/types/item';
import { InvoiceItemRow } from '@/components/invoices/InvoiceItemRow';

interface InvoiceItemsTableProps {
  items: InvoiceLineForm[];
  disabled?: boolean;
  onChange: (key: string, patch: Partial<InvoiceLineForm>) => void;
  onSelectItem: (key: string, item: Item) => void;
  onAddRow: () => void;
  onRemoveRow: (key: string) => void;
}

export const InvoiceItemsTable = ({
  items,
  disabled = false,
  onChange,
  onSelectItem,
  onAddRow,
  onRemoveRow,
}: InvoiceItemsTableProps) => {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">Invoice Items</h3>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            Add products or services. Totals update automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddRow}
          disabled={disabled}
          className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:opacity-60"
        >
          Add Row
        </button>
      </div>

      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-[980px] w-full divide-y divide-[#E5E7EB] text-left text-sm">
          <thead className="bg-[#FAFAFA] text-xs uppercase tracking-wide text-[#6B7280]">
            <tr>
              <th className="px-3 py-3">Item / Description</th>
              <th className="px-3 py-3">Qty</th>
              <th className="px-3 py-3">Unit</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Discount</th>
              <th className="px-3 py-3">Tax %</th>
              <th className="px-3 py-3">Tax Amount</th>
              <th className="px-3 py-3">Line Total</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {items.map((line) => (
              <InvoiceItemRow
                key={line.key}
                line={line}
                disabled={disabled}
                canRemove={items.length > 1}
                onChange={onChange}
                onSelectItem={onSelectItem}
                onRemove={onRemoveRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
