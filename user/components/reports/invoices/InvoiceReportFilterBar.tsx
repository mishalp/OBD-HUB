'use client';

import { useState } from 'react';
import type { Customer } from '@/lib/types/customer';
import type {
  InvoiceReportFilters,
  InvoiceReportPaymentStatus,
  InvoiceReportStatus,
} from '@/lib/types/invoiceReport';
import type { ReportPeriod } from '@/lib/types/report';
import { REPORT_PERIOD_LABELS } from '@/lib/types/report';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import { StringNumberInput } from '@/components/ui/NumberInput';

interface InvoiceReportFilterBarProps {
  filters: InvoiceReportFilters;
  onChange: (filters: InvoiceReportFilters) => void;
  onRefresh: () => void;
  customers: Customer[];
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

const INVOICE_STATUS_OPTIONS: InvoiceReportStatus[] = [
  'all',
  'Draft',
  'Unpaid',
  'Partially Paid',
  'Paid',
  'Cancelled',
];

const PAYMENT_STATUS_OPTIONS: InvoiceReportPaymentStatus[] = [
  'all',
  'Draft',
  'Unpaid',
  'Partially Paid',
  'Paid',
];

const controlClass = 'ui-input';

export const InvoiceReportFilterBar = ({
  filters,
  onChange,
  onRefresh,
  customers,
  isLoading = false,
}: InvoiceReportFilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const update = (patch: Partial<InvoiceReportFilters>): void => {
    onChange({ ...filters, ...patch, page: patch.page ?? 1 });
  };

  return (
    <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {QUICK_PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => update({ period })}
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
            onClick={() => update({ period: 'custom' })}
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

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-medium text-[#6B7280]">
          Search
          <input
            type="search"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Invoice number, customer name, or phone"
            className={controlClass}
          />
        </label>
        {filters.period === 'custom' ? (
          <DateRangePicker
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onChange={(range) => update(range)}
          />
        ) : null}
      </div>

      {showFilters ? (
        <div className="grid gap-3 border-t border-[#F3F4F6] pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Invoice Status
            <select
              value={filters.status}
              onChange={(event) =>
                update({ status: event.target.value as InvoiceReportStatus })
              }
              className={controlClass}
            >
              {INVOICE_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All statuses' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Payment Status
            <select
              value={filters.paymentStatus}
              onChange={(event) =>
                update({
                  paymentStatus: event.target.value as InvoiceReportPaymentStatus,
                })
              }
              className={controlClass}
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All statuses' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Customer
            <select
              value={filters.customer}
              onChange={(event) => update({ customer: event.target.value })}
              className={controlClass}
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
            Min Amount
            <StringNumberInput
              min={0}
              step="0.01"
              value={filters.minAmount}
              onValueChange={(minAmount) => update({ minAmount })}
              className={controlClass}
              placeholder="0"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Max Amount
            <StringNumberInput
              min={0}
              step="0.01"
              value={filters.maxAmount}
              onValueChange={(maxAmount) => update({ maxAmount })}
              className={controlClass}
              placeholder="Any"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4 pt-5">
            <label className="flex items-center gap-2 text-sm text-[#374151]">
              <input
                type="checkbox"
                checked={filters.outstandingOnly}
                onChange={(event) => update({ outstandingOnly: event.target.checked })}
                className="h-4 w-4 rounded border-[#cbd5e1] text-[#D32F2F] focus:ring-[#D32F2F]"
              />
              Outstanding only
            </label>
            <label className="flex items-center gap-2 text-sm text-[#374151]">
              <input
                type="checkbox"
                checked={filters.overdueOnly}
                onChange={(event) => update({ overdueOnly: event.target.checked })}
                className="h-4 w-4 rounded border-[#cbd5e1] text-[#D32F2F] focus:ring-[#D32F2F]"
              />
              Overdue only
            </label>
          </div>
        </div>
      ) : null}
    </section>
  );
};
