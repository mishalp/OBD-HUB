'use client';

import type { AgeingBucket, DueStatus } from '@/lib/types/due';
import { AGEING_BUCKETS, DUE_STATUSES } from '@/lib/types/due';

interface DueFiltersProps {
  status: 'all' | DueStatus;
  ageingBucket: 'all' | AgeingBucket;
  fromDate: string;
  toDate: string;
  customer: string;
  customers: Array<{ id: string; name: string }>;
  onStatusChange: (status: 'all' | DueStatus) => void;
  onAgeingBucketChange: (bucket: 'all' | AgeingBucket) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onCustomerChange: (value: string) => void;
}

const controlClassName =
  'h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20';

const BUCKET_LABELS: Record<string, string> = {
  Current: 'Current',
  '0-30': '0–30 Days',
  '31-60': '31–60 Days',
  '61-90': '61–90 Days',
  '91+': '91+ Days',
};

export const DueFilters = ({
  status,
  ageingBucket,
  fromDate,
  toDate,
  customer,
  customers,
  onStatusChange,
  onAgeingBucketChange,
  onFromDateChange,
  onToDateChange,
  onCustomerChange,
}: DueFiltersProps) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as 'all' | DueStatus)}
        className={controlClassName}
        aria-label="Filter by due status"
      >
        <option value="all">All statuses</option>
        {DUE_STATUSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        value={ageingBucket}
        onChange={(event) =>
          onAgeingBucketChange(event.target.value as 'all' | AgeingBucket)
        }
        className={controlClassName}
        aria-label="Filter by ageing bucket"
      >
        <option value="all">All ageing buckets</option>
        {AGEING_BUCKETS.map((bucket) => (
          <option key={bucket} value={bucket}>
            {BUCKET_LABELS[bucket]}
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
          aria-label="From due date"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-[#6B7280]">
        <span className="whitespace-nowrap">To</span>
        <input
          type="date"
          value={toDate}
          onChange={(event) => onToDateChange(event.target.value)}
          className={controlClassName}
          aria-label="To due date"
        />
      </label>
    </div>
  );
};
