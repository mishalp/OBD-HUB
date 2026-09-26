'use client';

import Link from 'next/link';
import type {
  CustomerReportListItem,
  CustomerReportPagination,
  CustomerReportSortBy,
} from '@/lib/types/customerReport';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { EmptyReportState } from '@/components/reports/EmptyReportState';
import { CustomerStatusBadge } from './CustomerStatusBadge';

interface CustomerReportTableProps {
  customers: CustomerReportListItem[];
  pagination: CustomerReportPagination | null;
  sortBy: CustomerReportSortBy;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: CustomerReportSortBy) => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const formatDate = (value: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const CustomerReportTable = ({
  customers,
  pagination,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  isLoading = false,
}: CustomerReportTableProps) => {
  const sortIndicator = (key: CustomerReportSortBy): string => {
    if (sortBy !== key) {
      return '';
    }
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const handleSort = (key: CustomerReportSortBy): void => {
    onSortChange(key);
  };

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#111827]">Customer Analytics</h3>
        <p className="mt-1 text-sm text-[#6B7280]">
          Revenue, outstanding balances, and purchase activity by customer.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-11 w-full animate-pulse rounded bg-[#F3F4F6]" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyReportState
          title="No customers found"
          description="Try adjusting the date range or filters."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#FAFAFA] shadow-[inset_0_-1px_0_#E5E7EB]">
                <tr className="border-b border-[#E5E7EB] text-left text-xs uppercase tracking-wide text-[#6B7280]">
                  <th className="px-4 py-3.5 font-semibold">
                    <button type="button" onClick={() => handleSort('name')}>
                      Customer{sortIndicator('name')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold">
                    <button type="button" onClick={() => handleSort('invoiceCount')}>
                      Invoices{sortIndicator('invoiceCount')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold">
                    <button type="button" onClick={() => handleSort('revenue')}>
                      Revenue{sortIndicator('revenue')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold">
                    <button type="button" onClick={() => handleSort('outstandingAmount')}>
                      Outstanding{sortIndicator('outstandingAmount')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold">Avg Invoice</th>
                  <th className="px-4 py-3.5 font-semibold">
                    <button type="button" onClick={() => handleSort('lastPurchaseDate')}>
                      Last Purchase{sortIndicator('lastPurchaseDate')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.customerId}
                    className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#FAFAFA]"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#111827]">{customer.name}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        {customer.customerCode} · {customer.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#374151]">
                      {customer.invoiceCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-[#111827]">
                      {formatMoney(customer.revenue)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#B45309]">
                      {formatMoney(customer.outstandingAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#374151]">
                      {formatMoney(customer.averageInvoiceValue)}
                    </td>
                    <td className="px-4 py-3.5 text-[#6B7280]">
                      {formatDate(customer.lastPurchaseDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <CustomerStatusBadge status={customer.customerStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/reports/customers/view?id=${customer.customerId}`}
                        className="text-xs font-semibold text-[#D32F2F] hover:underline"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-xs text-[#6B7280]">
              <span>
                Page {pagination.page} of {pagination.totalPages} · {pagination.total}{' '}
                customers
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="rounded-md border border-[#E5E7EB] px-3 py-1.5 font-medium text-[#374151] disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
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
