'use client';

import type { InvoiceInitialPaymentForm } from '@/lib/types/invoice';
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/types/payment';
import { cn } from '@/lib/utils/cn';

interface InvoicePaymentSectionProps {
  open: boolean;
  payment: InvoiceInitialPaymentForm;
  disabled?: boolean;
  errors?: Partial<Record<keyof InvoiceInitialPaymentForm, string>>;
  onChange: (patch: Partial<InvoiceInitialPaymentForm>) => void;
}

const inputClassName =
  'h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:bg-[#FAFAFA]';

export const InvoicePaymentSection = ({
  open,
  payment,
  disabled = false,
  errors = {},
  onChange,
}: InvoicePaymentSectionProps) => {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-300 ease-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">
        <section
          className={cn(
            'rounded-xl border border-[#E5E7EB] bg-white p-5 transition-opacity duration-300',
            open ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <div>
            <h3 className="text-base font-semibold text-[#111827]">Payment Information</h3>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              This invoice will be marked as Paid and a payment record will be created
              automatically.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-[#111827]"
                htmlFor="invoice-payment-method"
              >
                Payment Method <span className="text-[#D32F2F]">*</span>
              </label>
              <select
                id="invoice-payment-method"
                className={inputClassName}
                value={payment.paymentMethod}
                disabled={disabled || !open}
                onChange={(event) =>
                  onChange({
                    paymentMethod: event.target.value as PaymentMethod | '',
                  })
                }
              >
                <option value="">Select method</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {errors.paymentMethod ? (
                <p className="text-xs text-[#DC2626]">{errors.paymentMethod}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-[#111827]"
                htmlFor="invoice-payment-date"
              >
                Payment Date <span className="text-[#D32F2F]">*</span>
              </label>
              <input
                id="invoice-payment-date"
                type="date"
                className={inputClassName}
                value={payment.paymentDate}
                disabled={disabled || !open}
                onChange={(event) => onChange({ paymentDate: event.target.value })}
              />
              {errors.paymentDate ? (
                <p className="text-xs text-[#DC2626]">{errors.paymentDate}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-[#111827]"
                htmlFor="invoice-payment-reference"
              >
                Reference Number
              </label>
              <input
                id="invoice-payment-reference"
                type="text"
                className={inputClassName}
                value={payment.referenceNumber}
                disabled={disabled || !open}
                placeholder="Optional"
                onChange={(event) => onChange({ referenceNumber: event.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label
                className="text-sm font-medium text-[#111827]"
                htmlFor="invoice-payment-notes"
              >
                Payment Notes
              </label>
              <textarea
                id="invoice-payment-notes"
                rows={3}
                className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:bg-[#FAFAFA]"
                value={payment.notes}
                disabled={disabled || !open}
                placeholder="Optional"
                onChange={(event) => onChange({ notes: event.target.value })}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
