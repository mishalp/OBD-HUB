'use client';

import { useState } from 'react';
import type { Customer } from '@/lib/types/customer';
import type { Item } from '@/lib/types/item';
import type {
  ReportFilters,
  ReportInvoiceStatus,
  ReportPaymentMethod,
  ReportPaymentStatus,
  ReportPeriod,
} from '@/lib/types/report';
import { REPORT_PERIOD_LABELS } from '@/lib/types/report';
import { DateRangePicker } from './DateRangePicker';

interface ReportFilterBarProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  onRefresh: () => void;
  customers: Customer[];
  items: Item[];
  isLoading?: boolean;
}

const QUICK_PERIODS: ReportPeriod[] = [
  'today',
  'yesterday',
  'last_7_days',
  'last_30_days',
  'current_month',
  'previous_month',
  'current_year',
];

const PAYMENT_STATUS_OPTIONS: ReportPaymentStatus[] = [
  'all',
  'Unpaid',
  'Partially Paid',
  'Paid',
];
const INVOICE_STATUS_OPTIONS: ReportInvoiceStatus[] = [
  'all',
  'Unpaid',
  'Partially Paid',
  'Paid',
  'Cancelled',
];
const PAYMENT_METHOD_OPTIONS: ReportPaymentMethod[] = [
  'all',
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Cheque',
  'Other',
];

const selectClass = 'ui-input';

export const ReportFilterBar = ({
  filters,
  onChange,
  onRefresh,
  customers,
  items,
  isLoading = false,
}: ReportFilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const update = (patch: Partial<ReportFilters>): void => {
    onChange({ ...filters, ...patch });
  };

  const selectPeriod = (period: ReportPeriod): void => {
    update({ period });
  };

  return (
    <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {QUICK_PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => selectPeriod(period)}
              aria-pressed={filters.period === period}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                filters.period === period
                  ? 'border-[#D32F2F] bg-[#FEF2F2] text-[#D32F2F]'
                  : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#cbd5e1] hover:text-[#111827]'
              }`}
            >
              {REPORT_PERIOD_LABELS[period]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => selectPeriod('custom')}
            aria-pressed={filters.period === 'custom'}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filters.period === 'custom'
                ? 'border-[#D32F2F] bg-[#FEF2F2] text-[#D32F2F]'
                : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#cbd5e1] hover:text-[#111827]'
            }`}
          >
            {REPORT_PERIOD_LABELS.custom}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
            className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#374151] hover:border-[#cbd5e1]"
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-lg bg-[#D32F2F] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#B71C1C] disabled:opacity-60"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {filters.period === 'custom' ? (
        <DateRangePicker
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onChange={(range) => update(range)}
        />
      ) : null}

      {showFilters ? (
        <div className="grid gap-3 border-t border-[#F3F4F6] pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Customer
            <select
              value={filters.customer}
              onChange={(event) => update({ customer: event.target.value })}
              className={selectClass}
            >
              <option value="">All customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Item
            <select
              value={filters.item}
              onChange={(event) => update({ item: event.target.value })}
              className={selectClass}
            >
              <option value="">All items</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Payment Status
            <select
              value={filters.paymentStatus}
              onChange={(event) =>
                update({ paymentStatus: event.target.value as ReportPaymentStatus })
              }
              className={selectClass}
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All statuses' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Invoice Status
            <select
              value={filters.invoiceStatus}
              onChange={(event) =>
                update({ invoiceStatus: event.target.value as ReportInvoiceStatus })
              }
              className={selectClass}
            >
              {INVOICE_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All statuses' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Payment Method
            <select
              value={filters.paymentMethod}
              onChange={(event) =>
                update({ paymentMethod: event.target.value as ReportPaymentMethod })
              }
              className={selectClass}
            >
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All methods' : option}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </section>
  );
};
