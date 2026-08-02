'use client';

import { useState } from 'react';
import type {
  CustomerAccountStatus,
  CustomerReportFilters,
  CustomerTypeFilter,
} from '@/lib/types/customerReport';
import type { ReportPeriod } from '@/lib/types/report';
import { REPORT_PERIOD_LABELS } from '@/lib/types/report';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import { StringNumberInput } from '@/components/ui/NumberInput';

interface CustomerReportFilterBarProps {
  filters: CustomerReportFilters;
  onChange: (filters: CustomerReportFilters) => void;
  onRefresh: () => void;
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

const selectClass = 'ui-input';

export const CustomerReportFilterBar = ({
  filters,
  onChange,
  onRefresh,
  isLoading = false,
}: CustomerReportFilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const update = (patch: Partial<CustomerReportFilters>): void => {
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
            placeholder="Name, phone, email, or code"
            className={selectClass}
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
        <div className="grid gap-3 border-t border-[#F3F4F6] pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Account Status
            <select
              value={filters.status}
              onChange={(event) =>
                update({ status: event.target.value as CustomerAccountStatus })
              }
              className={selectClass}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Customer Type
            <select
              value={filters.customerType}
              onChange={(event) =>
                update({ customerType: event.target.value as CustomerTypeFilter })
              }
              className={selectClass}
            >
              <option value="all">All types</option>
              <option value="new">New</option>
              <option value="active">Active buyers</option>
              <option value="repeat">Repeat</option>
              <option value="inactive">Inactive buyers</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Min Revenue
            <StringNumberInput
              min={0}
              step="0.01"
              value={filters.minRevenue}
              onValueChange={(minRevenue) => update({ minRevenue })}
              className={selectClass}
              placeholder="0"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
            Max Revenue
            <StringNumberInput
              min={0}
              step="0.01"
              value={filters.maxRevenue}
              onValueChange={(maxRevenue) => update({ maxRevenue })}
              className={selectClass}
              placeholder="Any"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-[#374151] sm:col-span-2">
            <input
              type="checkbox"
              checked={filters.outstandingOnly}
              onChange={(event) => update({ outstandingOnly: event.target.checked })}
              className="h-4 w-4 rounded border-[#cbd5e1] text-[#D32F2F] focus:ring-[#D32F2F]"
            />
            Outstanding only
          </label>
        </div>
      ) : null}
    </section>
  );
};
