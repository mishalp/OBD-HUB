'use client';

import type { InvoiceLineForm } from '@/lib/types/invoice';
import type { Item } from '@/lib/types/item';
import { calculateLineItem, formatMoney } from '@/lib/utils/invoiceCalculations';
import {
  invoicePriceColumnLabel,
  showsQuantityFields,
} from '@/lib/utils/invoiceItemDisplay';
import { ItemSelector } from '@/components/invoices/ItemSelector';
import { NumberInput } from '@/components/ui/NumberInput';

interface InvoiceItemRowProps {
  line: InvoiceLineForm;
  disabled?: boolean;
  canRemove: boolean;
  onChange: (key: string, patch: Partial<InvoiceLineForm>) => void;
  onSelectItem: (key: string, item: Item) => void;
  onRemove: (key: string) => void;
}

const numberInputClassName =
  'h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#111827] outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:bg-[#FAFAFA]';

export const InvoiceItemRow = ({
  line,
  disabled = false,
  canRemove,
  onChange,
  onSelectItem,
  onRemove,
}: InvoiceItemRowProps) => {
  const showQtyUnit = showsQuantityFields(line.type);
  const calculated = calculateLineItem({
    quantity: showQtyUnit ? line.quantity : 1,
    unitPrice: line.unitPrice,
    discount: line.discount,
    taxRate: line.taxRate,
  });

  return (
    <tr className="align-top">
      <td className="px-3 py-2">
        <ItemSelector
          value={line.itemId}
          label={line.itemName}
          disabled={disabled}
          onSelect={(item) => onSelectItem(line.key, item)}
        />
        {/* {line.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-[#6B7280]">{line.description}</p>
        ) : null}
        {line.type ? (
          <p className="mt-1 text-xs text-[#6B7280]">{line.type}</p>
        ) : null} */}
      </td>
      <td className="px-3 py-2">
        {showQtyUnit ? (
          <NumberInput
            min={0.01}
            step="0.01"
            className={numberInputClassName}
            value={line.quantity}
            emptyValue={1}
            disabled={disabled}
            onValueChange={(quantity) => onChange(line.key, { quantity })}
            aria-label="Quantity"
          />
        ) : null}
      </td>
      <td className="px-3 py-2">
        {showQtyUnit ? (
          <input
            type="text"
            className={numberInputClassName}
            value={line.unit}
            disabled={disabled}
            onChange={(event) => onChange(line.key, { unit: event.target.value })}
            aria-label="Unit"
          />
        ) : null}
      </td>
      <td className="px-3 py-2">
        <NumberInput
          min={0}
          step="0.01"
          className={numberInputClassName}
          value={line.unitPrice}
          emptyValue={0}
          disabled={disabled}
          onValueChange={(unitPrice) => onChange(line.key, { unitPrice })}
          aria-label={invoicePriceColumnLabel(line.type)}
        />
      </td>
      <td className="px-3 py-2">
        <NumberInput
          min={0}
          step="0.01"
          className={numberInputClassName}
          value={line.discount}
          emptyValue={0}
          disabled={disabled}
          onValueChange={(discount) => onChange(line.key, { discount })}
          aria-label="Discount"
        />
      </td>
      <td className="px-3 py-2">
        <NumberInput
          min={0}
          max={100}
          step="0.01"
          className={numberInputClassName}
          value={line.taxRate}
          emptyValue={0}
          disabled={disabled}
          onValueChange={(taxRate) => onChange(line.key, { taxRate })}
          aria-label="Tax rate"
        />
      </td>
      <td className="px-3 py-2 text-sm text-[#374151]">
        {formatMoney(calculated.taxAmount)}
      </td>
      <td className="px-3 py-2 text-sm font-medium text-[#111827]">
        {formatMoney(calculated.lineTotal)}
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          disabled={disabled || !canRemove}
          onClick={() => onRemove(line.key)}
          className="rounded-md border border-[#FECACA] px-2 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove
        </button>
      </td>
    </tr>
  );
};
