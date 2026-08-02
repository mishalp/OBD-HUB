'use client';

import { useMemo } from 'react';
import type { Customer } from '@/lib/types/customer';
import type {
  CreatableInvoiceStatus,
  EditableInvoiceStatus,
  InvoiceFormState,
  InvoiceInitialPaymentForm,
  InvoiceLineForm,
} from '@/lib/types/invoice';
import type { Item } from '@/lib/types/item';
import {
  calculateInvoiceTotals,
  calculateLineItem,
} from '@/lib/utils/invoiceCalculations';
import { CustomerSelector } from '@/components/invoices/CustomerSelector';
import { InvoiceItemsTable } from '@/components/invoices/InvoiceItemsTable';
import { InvoicePaymentSection } from '@/components/invoices/InvoicePaymentSection';
import { InvoiceSummaryCard } from '@/components/invoices/InvoiceSummaryCard';
import { createEmptyInvoiceLine } from '@/lib/types/invoice';

interface InvoiceFormProps {
  form: InvoiceFormState;
  selectedCustomer: Customer | null;
  invoiceNumber: string;
  disabled?: boolean;
  /** When true, status selector includes Paid (create flow only). */
  allowPaidStatus?: boolean;
  customerError?: string;
  itemsError?: string;
  paymentErrors?: Partial<Record<keyof InvoiceInitialPaymentForm, string>>;
  serverError?: string | null;
  onCustomerChange: (customer: Customer | null) => void;
  onAddCustomer?: () => void;
  onFieldChange: <K extends keyof InvoiceFormState>(
    key: K,
    value: InvoiceFormState[K],
  ) => void;
  onPaymentChange: (patch: Partial<InvoiceInitialPaymentForm>) => void;
  onLineChange: (key: string, patch: Partial<InvoiceLineForm>) => void;
  onSelectItem: (key: string, item: Item) => void;
  onAddRow: () => void;
  onRemoveRow: (key: string) => void;
}

const inputClassName =
  'h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:bg-[#FAFAFA]';

export const InvoiceForm = ({
  form,
  selectedCustomer,
  invoiceNumber,
  disabled = false,
  allowPaidStatus = false,
  customerError,
  itemsError,
  paymentErrors,
  serverError,
  onCustomerChange,
  onAddCustomer,
  onFieldChange,
  onPaymentChange,
  onLineChange,
  onSelectItem,
  onAddRow,
  onRemoveRow,
}: InvoiceFormProps) => {
  const totals = useMemo(() => {
    const lines = form.items.map((line) =>
      calculateLineItem({
        quantity: line.type === 'Service' ? 1 : line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        taxRate: line.taxRate,
      }),
    );
    return calculateInvoiceTotals(lines);
  }, [form.items]);

  const showPaymentSection = allowPaidStatus && form.status === 'Paid';

  const handleStatusChange = (value: string): void => {
    if (allowPaidStatus) {
      onFieldChange('status', value as CreatableInvoiceStatus);
      return;
    }
    onFieldChange('status', value as EditableInvoiceStatus);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Customer Information</h3>
        <div className="mt-4">
          <CustomerSelector
            value={form.customerId}
            selectedCustomer={selectedCustomer}
            disabled={disabled}
            error={customerError}
            onChange={onCustomerChange}
            onAddCustomer={onAddCustomer}
          />
        </div>
      </section>

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Invoice Information</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111827]" htmlFor="invoice-number">
              Invoice Number
            </label>
            <input
              id="invoice-number"
              className={inputClassName}
              value={invoiceNumber}
              readOnly
              disabled
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111827]" htmlFor="invoice-date">
              Invoice Date
            </label>
            <input
              id="invoice-date"
              type="date"
              className={inputClassName}
              value={form.invoiceDate}
              disabled={disabled}
              onChange={(event) => onFieldChange('invoiceDate', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111827]" htmlFor="due-date">
              Due Date
            </label>
            <input
              id="due-date"
              type="date"
              className={inputClassName}
              value={form.dueDate}
              disabled={disabled}
              onChange={(event) => onFieldChange('dueDate', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111827]" htmlFor="invoice-status">
              Status
            </label>
            <select
              id="invoice-status"
              className={inputClassName}
              value={form.status === 'Partially Paid' || form.status === 'Cancelled' ? 'Unpaid' : form.status}
              disabled={disabled}
              onChange={(event) => handleStatusChange(event.target.value)}
            >
              <option value="Draft">Draft</option>
              <option value="Unpaid">Unpaid</option>
              {allowPaidStatus ? <option value="Paid">Paid</option> : null}
            </select>
          </div>
        </div>
      </section>

      <InvoicePaymentSection
        open={showPaymentSection}
        payment={form.payment}
        disabled={disabled}
        errors={paymentErrors}
        onChange={onPaymentChange}
      />

      <InvoiceItemsTable
        items={form.items}
        disabled={disabled}
        onChange={onLineChange}
        onSelectItem={onSelectItem}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
      />
      {itemsError ? <p className="text-sm text-[#DC2626]">{itemsError}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111827]" htmlFor="invoice-notes">
              Notes
            </label>
            <textarea
              id="invoice-notes"
              rows={4}
              className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:bg-[#FAFAFA]"
              value={form.notes}
              disabled={disabled}
              onChange={(event) => onFieldChange('notes', event.target.value)}
              placeholder="Optional notes for this invoice"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111827]" htmlFor="invoice-terms">
              Terms & Conditions
            </label>
            <textarea
              id="invoice-terms"
              rows={4}
              className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:bg-[#FAFAFA]"
              value={form.terms}
              disabled={disabled}
              onChange={(event) => onFieldChange('terms', event.target.value)}
              placeholder="Optional payment terms"
            />
          </div>
        </section>

        <InvoiceSummaryCard totals={totals} />
      </div>

      {serverError ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {serverError}
        </div>
      ) : null}
    </div>
  );
};

export const applyItemToLine = (item: Item): Partial<InvoiceLineForm> => ({
  itemId: item.id,
  itemCode: item.itemCode,
  itemName: item.name,
  description: item.description ?? '',
  type: item.type,
  unit: item.unit,
  unitPrice: item.price,
  taxRate: item.taxRate,
  // Services always use quantity 1; products start at 1 and remain editable.
  quantity: 1,
  discount: 0,
});

export { createEmptyInvoiceLine };
