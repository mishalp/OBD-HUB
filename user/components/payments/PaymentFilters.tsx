'use client';

import type { PaymentMethod } from '@/lib/types/payment';
import { PAYMENT_METHODS } from '@/lib/types/payment';

interface PaymentFiltersProps {
  paymentMethod: 'all' | PaymentMethod;
  fromDate: string;
  toDate: string;
  customer: string;
  customers: Array<{ id: string; name: string }>;
  onPaymentMethodChange: (method: 'all' | PaymentMethod) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onCustomerChange: (value: string) => void;
}

const controlClassName =
  'h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20';

export const PaymentFilters = ({
  paymentMethod,
  fromDate,
  toDate,
  customer,
  customers,
  onPaymentMethodChange,
  onFromDateChange,
  onToDateChange,
  onCustomerChange,
}: PaymentFiltersProps) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <select
        value={paymentMethod}
        onChange={(event) =>
          onPaymentMethodChange(event.target.value as 'all' | PaymentMethod)
        }
        className={controlClassName}
        aria-label="Filter by payment method"
      >
        <option value="all">All methods</option>
        {PAYMENT_METHODS.map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </select>

      <select
        value={customer}
        onChange={(event) => onCustomerChange(event.target.value)}
        className={`${controlClassName} min-w-[180px]`}
        aria-label="Filter by customer"
      >
        <option value="">All customers</option>
        {customers.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm text-[#6B7280]">
        <span className="whitespace-nowrap">From</span>
        <input
          type="date"
          value={fromDate}
          onChange={(event) => onFromDateChange(event.target.value)}
          className={controlClassName}
          aria-label="From date"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-[#6B7280]">
        <span className="whitespace-nowrap">To</span>
        <input
          type="date"
          value={toDate}
          onChange={(event) => onToDateChange(event.target.value)}
          className={controlClassName}
          aria-label="To date"
        />
      </label>
    </div>
  );
};
