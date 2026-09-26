'use client';

import Link from 'next/link';
import type {
  InvoiceReportListItem,
  InvoiceReportPagination,
  InvoiceReportSortBy,
} from '@/lib/types/invoiceReport';
import { INVOICE_REPORT_STATUS_COLORS } from '@/lib/types/invoiceReport';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { EmptyReportState } from '@/components/reports/EmptyReportState';

interface InvoiceReportTableProps {
  invoices: InvoiceReportListItem[];
  pagination: InvoiceReportPagination | null;
  sortBy: InvoiceReportSortBy;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: InvoiceReportSortBy) => void;
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

const StatusPill = ({ status }: { status: string }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full bg-[#FAFAFA] px-2.5 py-0.5 text-xs font-medium text-[#374151]"
  >
    <span
      className="h-2 w-2 rounded-full"
      style={{ backgroundColor: INVOICE_REPORT_STATUS_COLORS[status] ?? '#9CA3AF' }}
      aria-hidden="true"
    />
    {status}
  </span>
);

export const InvoiceReportTable = ({
  invoices,
  pagination,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  isLoading = false,
}: InvoiceReportTableProps) => {
  const sortIndicator = (key: InvoiceReportSortBy): string => {
    if (sortBy !== key) {
      return '';
    }
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#111827]">Invoice Report</h3>
        <p className="mt-1 text-sm text-[#6B7280]">
          Invoice level amounts, collections, and outstanding balances.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-11 w-full animate-pulse rounded bg-[#F3F4F6]" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyReportState
          title="No invoices found"
          description="Try adjusting the date range or filters."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#FAFAFA] shadow-[inset_0_-1px_0_#E5E7EB]">
                <tr className="border-b border-[#E5E7EB] text-left text-xs uppercase tracking-wide text-[#6B7280]">
                  <th className="px-4 py-3.5 font-semibold">
                    <button type="button" onClick={() => onSortChange('invoiceNumber')}>
                      Invoice{sortIndicator('invoiceNumber')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-semibold">Customer</th>
                  <th className="px-4 py-3.5 font-semibold">
                    <button type="button" onClick={() => onSortChange('invoiceDate')}>
                      Date{sortIndicator('invoiceDate')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-semibold">
                    <button type="button" onClick={() => onSortChange('dueDate')}>
                      Due Date{sortIndicator('dueDate')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold">
                    <button type="button" onClick={() => onSortChange('grandTotal')}>
                      Amount{sortIndicator('grandTotal')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold">
                    <button type="button" onClick={() => onSortChange('collectedAmount')}>
                      Collected{sortIndicator('collectedAmount')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold">
                    <button
                      type="button"
                      onClick={() => onSortChange('outstandingAmount')}
                    >
                      Outstanding{sortIndicator('outstandingAmount')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-semibold">Invoice Status</th>
                  <th className="px-4 py-3.5 font-semibold">Payment Status</th>
                  <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#FAFAFA]"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/invoices/view?id=${invoice.id}`}
                        className="font-medium text-[#D32F2F] hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#111827]">{invoice.customerName}</p>
                      {invoice.customerPhone ? (
                        <p className="text-xs text-[#9CA3AF]">{invoice.customerPhone}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-[#6B7280]">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={invoice.isOverdue ? 'text-[#b91c1c]' : 'text-[#6B7280]'}
                      >
                        {formatDate(invoice.dueDate)}
                      </span>
                      {invoice.isOverdue ? (
                        <span className="ml-2 rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[10px] font-medium text-[#b91c1c]">
                          Overdue
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-[#111827]">
                      {formatMoney(invoice.grandTotal)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#15803D]">
                      {formatMoney(invoice.collectedAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#B45309]">
                      {formatMoney(invoice.outstandingAmount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={invoice.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={invoice.paymentStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/invoices/view?id=${invoice.id}`}
                        className="text-xs font-semibold text-[#D32F2F] hover:underline"
                      >
                        View Invoice
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
                invoices
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
