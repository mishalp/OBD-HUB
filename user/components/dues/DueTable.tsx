'use client';

import Link from 'next/link';
import type { DueListItem, DueListQuery } from '@/lib/types/due';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { DueStatusBadge } from '@/components/dues/DueStatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface DueTableProps {
  dues: DueListItem[];
  sortBy: DueListQuery['sortBy'];
  sortOrder: DueListQuery['sortOrder'];
  onSort: (sortBy: DueListQuery['sortBy']) => void;
  onRecordPayment: (due: DueListItem) => void;
  hasFilters: boolean;
}

const formatDate = (value: string | null): string => {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const DueTable = ({
  dues,
  sortBy,
  sortOrder,
  onSort,
  onRecordPayment,
  hasFilters,
}: DueTableProps) => {
  if (dues.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? 'No dues match your filters.' : 'No outstanding dues.'}
        description={
          hasFilters
            ? 'Try adjusting your search, status, ageing, or date range.'
            : 'Invoices with receivable balances will appear here.'
        }
      />
    );
  }

  const renderSortLabel = (key: DueListQuery['sortBy'], label: string) => {
    const active = sortBy === key;
    return (
      <button
        type="button"
        onClick={() => onSort(key)}
        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-inherit hover:text-[#111827]"
      >
        {label}
        {active ? <span>{sortOrder === 'asc' ? '↑' : '↓'}</span> : null}
      </button>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
      <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-[#FAFAFA] shadow-[inset_0_-1px_0_#E5E7EB]">
          <tr>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('invoiceNumber', 'Invoice #')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Customer</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('invoiceDate', 'Invoice Date')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('dueDate', 'Due Date')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('grandTotal', 'Grand Total')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Paid</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('outstandingBalance', 'Outstanding')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('daysOutstanding', 'Days')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('dueStatus', 'Status')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {dues.map((due) => (
            <tr key={due.invoiceId} className="transition-colors hover:bg-[#FAFAFA]">
              <td className="px-4 py-3.5 font-medium text-[#111827]">
                <Link href={`/dues/${due.invoiceId}`} className="hover:text-[#D32F2F]">
                  {due.invoiceNumber}
                </Link>
              </td>
              <td className="px-4 py-3.5 text-[#111827]">
                {due.customer ? (
                  <div>
                    <Link
                      href={`/customers/${due.customer.id}`}
                      className="font-medium hover:text-[#D32F2F]"
                    >
                      {due.customer.name}
                    </Link>
                    <p className="text-xs text-[#6B7280]">{due.customer.phone}</p>
                  </div>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3.5 text-[#374151]">{formatDate(due.invoiceDate)}</td>
              <td className="px-4 py-3.5 text-[#374151]">{formatDate(due.dueDate)}</td>
              <td className="px-4 py-3.5 text-[#111827]">{formatMoney(due.grandTotal)}</td>
              <td className="px-4 py-3.5 text-[#15803D]">{formatMoney(due.totalPaid)}</td>
              <td className="px-4 py-3.5 font-medium text-[#B45309]">
                {formatMoney(due.outstandingBalance)}
              </td>
              <td className="px-4 py-3.5 text-[#374151]">{due.daysOutstanding}</td>
              <td className="px-4 py-3.5">
                <DueStatusBadge status={due.dueStatus} />
              </td>
              <td className="px-4 py-3.5">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/invoices/${due.invoiceId}`}
                    className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
                  >
                    View Invoice
                  </Link>
                  {due.customer ? (
                    <Link
                      href={`/customers/${due.customer.id}`}
                      className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
                    >
                      Customer
                    </Link>
                  ) : null}
                  {due.dueStatus !== 'Paid' && due.outstandingBalance > 0 ? (
                    <button
                      type="button"
                      onClick={() => onRecordPayment(due)}
                      className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
                    >
                      Record Payment
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
