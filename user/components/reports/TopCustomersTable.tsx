'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { TopCustomer, TopLimit } from '@/lib/types/report';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { EmptyReportState } from './EmptyReportState';

interface TopCustomersTableProps {
  customers: TopCustomer[];
  limit: TopLimit;
  onLimitChange: (limit: TopLimit) => void;
  isLoading?: boolean;
}

type SortKey = 'revenue' | 'outstandingAmount' | 'invoiceCount';

const LIMIT_OPTIONS: TopLimit[] = [5, 10, 20];
const PAGE_SIZE = 10;

export const TopCustomersTable = ({
  customers,
  limit,
  onLimitChange,
  isLoading = false,
}: TopCustomersTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    return [...customers].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [customers, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key: SortKey): void => {
    setSortKey(key);
    setPage(1);
  };

  const sortIndicator = (key: SortKey): string => (sortKey === key ? ' ↓' : '');

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">Top Customers</h3>
          <p className="mt-1 text-sm text-[#6B7280]">Ranked by revenue for the period.</p>
        </div>
        <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-0.5">
          {LIMIT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onLimitChange(option)}
              aria-pressed={limit === option}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                limit === option
                  ? 'bg-white text-[#D32F2F] shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Top {option}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 w-full animate-pulse rounded bg-[#F3F4F6]" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyReportState
          title="No customer sales"
          description="No customers had sales in the selected period."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#FAFAFA] shadow-[inset_0_-1px_0_#E5E7EB]">
                <tr className="text-left text-xs uppercase tracking-wide text-[#6B7280]">
                  <th className="px-4 py-3.5 font-semibold">Rank</th>
                  <th className="px-4 py-3.5 font-semibold">Customer</th>
                  <th className="px-4 py-3.5 text-right font-semibold">
                    <button type="button" onClick={() => handleSort('invoiceCount')}>
                      Invoices{sortIndicator('invoiceCount')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold">
                    <button type="button" onClick={() => handleSort('outstandingAmount')}>
                      Outstanding{sortIndicator('outstandingAmount')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold">
                    <button type="button" onClick={() => handleSort('revenue')}>
                      Revenue{sortIndicator('revenue')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((customer, index) => {
                  const rank = (currentPage - 1) * PAGE_SIZE + index + 1;
                  return (
                    <tr
                      key={customer.customerId}
                      className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#FAFAFA]"
                    >
                      <td className="px-4 py-3.5 text-[#6B7280]">{rank}</td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/customers/${customer.customerId}`}
                          className="font-medium text-[#D32F2F] hover:underline"
                        >
                          {customer.name}
                        </Link>
                        <p className="text-xs text-[#9CA3AF]">{customer.customerCode}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right text-[#374151]">
                        {customer.invoiceCount}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[#B45309]">
                        {formatMoney(customer.outstandingAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-[#111827]">
                        {formatMoney(customer.revenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-xs text-[#6B7280]">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-md border border-[#E5E7EB] px-3 py-1.5 font-medium text-[#374151] disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-md border border-[#E5E7EB] px-3 py-1.5 font-medium text-[#374151] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};
