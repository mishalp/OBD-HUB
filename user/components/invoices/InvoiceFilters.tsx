'use client';

import type { InvoiceStatus } from '@/lib/types/invoice';

interface InvoiceFiltersProps {
  status: 'all' | InvoiceStatus;
  fromDate: string;
  toDate: string;
  onStatusChange: (status: 'all' | InvoiceStatus) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}

const controlClassName =
  'h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20';

const STATUS_OPTIONS: Array<'all' | InvoiceStatus> = [
  'all',
  'Draft',
  'Unpaid',
  'Partially Paid',
  'Paid',
  'Cancelled',
];

export const InvoiceFilters = ({
  status,
  fromDate,
  toDate,
  onStatusChange,
  onFromDateChange,
  onToDateChange,
}: InvoiceFiltersProps) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as 'all' | InvoiceStatus)}
        className={controlClassName}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'all' ? 'All statuses' : option}
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
