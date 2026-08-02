'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { invoicesApi } from '@/lib/api/invoices';
import { ApiClientError } from '@/lib/api/client';
import type { InvoiceListItem } from '@/lib/types/invoice';
import type { PaymentFormState, PaymentMethod } from '@/lib/types/payment';
import { PAYMENT_METHODS } from '@/lib/types/payment';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { StringNumberInput } from '@/components/ui/NumberInput';

export interface PayableInvoiceOption {
  id: string;
  invoiceNumber: string;
  grandTotal: number;
  totalPaid: number;
  outstandingBalance: number;
  customer: { name: string } | null;
}

interface PaymentFormProps {
  values: PaymentFormState;
  lockedInvoice?: PayableInvoiceOption | null;
  errors?: Partial<Record<keyof PaymentFormState, string>>;
  isSubmitting?: boolean;
  onChange: (values: PaymentFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const controlClassName = 'ui-input h-11';

const readOnlyClassName = 'ui-input h-11 bg-[#FAFAFA] text-[#6B7280]';

export const PaymentForm = ({
  values,
  lockedInvoice = null,
  errors = {},
  isSubmitting = false,
  onChange,
  onSubmit,
  onCancel,
}: PaymentFormProps) => {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<InvoiceListItem[]>([]);
  const [pickedInvoice, setPickedInvoice] = useState<PayableInvoiceOption | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedInvoice = lockedInvoice ?? pickedInvoice;

  useEffect(() => {
    if (!open || lockedInvoice) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoadingInvoices(true);
        setLoadError(null);

        try {
          const [unpaid, partial] = await Promise.all([
            invoicesApi.list({
              page: 1,
              limit: 25,
              search: search.trim(),
              status: 'Unpaid',
              customer: '',
              fromDate: '',
              toDate: '',
              sortBy: 'invoiceDate',
              sortOrder: 'desc',
            }),
            invoicesApi.list({
              page: 1,
              limit: 25,
              search: search.trim(),
              status: 'Partially Paid',
              customer: '',
              fromDate: '',
              toDate: '',
              sortBy: 'invoiceDate',
              sortOrder: 'desc',
            }),
          ]);

          if (!cancelled) {
            const merged = [...unpaid.invoices, ...partial.invoices];
            const unique = new Map(merged.map((invoice) => [invoice.id, invoice]));
            setOptions(Array.from(unique.values()));
          }
        } catch (err) {
          if (!cancelled) {
            setOptions([]);
            setLoadError(
              err instanceof ApiClientError ? err.message : 'Unable to load invoices.',
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingInvoices(false);
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, search, lockedInvoice]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateField = <K extends keyof PaymentFormState>(
    key: K,
    value: PaymentFormState[K],
  ): void => {
    onChange({ ...values, [key]: value });
  };

  const selectInvoice = (invoice: InvoiceListItem): void => {
    setPickedInvoice({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      grandTotal: invoice.grandTotal,
      totalPaid: invoice.totalPaid,
      outstandingBalance: invoice.outstandingBalance,
      customer: invoice.customer ? { name: invoice.customer.name } : null,
    });
    onChange({
      ...values,
      invoiceId: invoice.id,
      amount: String(invoice.outstandingBalance),
    });
    setOpen(false);
    setSearch('');
  };

  const outstanding = selectedInvoice?.outstandingBalance ?? null;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div ref={containerRef} className="relative">
        <label className="mb-1.5 block text-sm font-medium text-[#374151]">Invoice</label>
        {lockedInvoice ? (
          <input
            type="text"
            readOnly
            value={`${lockedInvoice.invoiceNumber} — ${lockedInvoice.customer?.name ?? 'Customer'}`}
            className={readOnlyClassName}
          />
        ) : (
          <>
            <input
              type="text"
              value={
                open
                  ? search
                  : selectedInvoice
                    ? `${selectedInvoice.invoiceNumber} — ${selectedInvoice.customer?.name ?? ''}`
                    : ''
              }
              onChange={(event) => {
                setSearch(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search unpaid invoices..."
              className={controlClassName}
              aria-controls={listId}
              aria-expanded={open}
              aria-autocomplete="list"
              role="combobox"
            />
            {open ? (
              <div
                id={listId}
                role="listbox"
                className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-[#E5E7EB] bg-white shadow-lg"
              >
                {isLoadingInvoices ? (
                  <p className="px-3 py-2 text-sm text-[#6B7280]">Loading invoices...</p>
                ) : loadError ? (
                  <p className="px-3 py-2 text-sm text-[#DC2626]">{loadError}</p>
                ) : options.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-[#6B7280]">No payable invoices found.</p>
                ) : (
                  options.map((invoice) => (
                    <button
                      key={invoice.id}
                      type="button"
                      role="option"
                      aria-selected={values.invoiceId === invoice.id}
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-[#FAFAFA]"
                      onClick={() => selectInvoice(invoice)}
                    >
                      <span className="text-sm font-medium text-[#111827]">
                        {invoice.invoiceNumber}
                      </span>
                      <span className="text-xs text-[#6B7280]">
                        {invoice.customer?.name ?? 'Customer'} · Outstanding{' '}
                        {formatMoney(invoice.outstandingBalance)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </>
        )}
        {errors.invoiceId ? (
          <p className="mt-1 text-xs text-[#DC2626]">{errors.invoiceId}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#374151]">Customer</label>
          <input
            type="text"
            readOnly
            value={selectedInvoice?.customer?.name ?? '—'}
            className={readOnlyClassName}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#374151]">
            Outstanding Amount
          </label>
          <input
            type="text"
            readOnly
            value={outstanding !== null ? formatMoney(outstanding) : '—'}
            className={readOnlyClassName}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#374151]">Grand Total</label>
          <input
            type="text"
            readOnly
            value={selectedInvoice ? formatMoney(selectedInvoice.grandTotal) : '—'}
            className={readOnlyClassName}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#374151]">Amount</label>
          <StringNumberInput
            min="0.01"
            step="0.01"
            value={values.amount}
            onValueChange={(amount) => updateField('amount', amount)}
            className={controlClassName}
            required
          />
          {errors.amount ? (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.amount}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#374151]">
            Payment Date
          </label>
          <input
            type="date"
            value={values.paymentDate}
            onChange={(event) => updateField('paymentDate', event.target.value)}
            className={controlClassName}
            required
          />
          {errors.paymentDate ? (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.paymentDate}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#374151]">
            Payment Method
          </label>
          <select
            value={values.paymentMethod}
            onChange={(event) =>
              updateField('paymentMethod', event.target.value as PaymentMethod | '')
            }
            className={controlClassName}
            required
          >
            <option value="">Select method</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          {errors.paymentMethod ? (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.paymentMethod}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#374151]">
          Reference Number
        </label>
        <input
          type="text"
          value={values.referenceNumber}
          onChange={(event) => updateField('referenceNumber', event.target.value)}
          className={controlClassName}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#374151]">Notes</label>
        <textarea
          value={values.notes}
          onChange={(event) => updateField('notes', event.target.value)}
          className="ui-textarea min-h-[88px]"
          placeholder="Optional"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B71C1C] disabled:opacity-60"
        >
          {isSubmitting ? 'Recording...' : 'Record Payment'}
        </button>
      </div>
    </form>
  );
};
