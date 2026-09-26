'use client';

import Link from 'next/link';
import type { InvoiceListItem, InvoiceListQuery } from '@/lib/types/invoice';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { InvoiceActionsMenu } from '@/components/invoices/InvoiceActionsMenu';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
  sortBy: InvoiceListQuery['sortBy'];
  sortOrder: InvoiceListQuery['sortOrder'];
  onSort: (sortBy: InvoiceListQuery['sortBy']) => void;
  onDelete: (invoice: InvoiceListItem) => void;
  onRecordPayment: (invoice: InvoiceListItem) => void;
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

export const InvoiceTable = ({
  invoices,
  sortBy,
  sortOrder,
  onSort,
  onDelete,
  onRecordPayment,
  hasFilters,
}: InvoiceTableProps) => {
  if (invoices.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? 'No invoices match your filters.' : 'No invoices yet.'}
        description={
          hasFilters
            ? 'Try adjusting your search, status, or date range.'
            : 'Create your first invoice to get started.'
        }
      />
    );
  }

  const renderSortLabel = (key: InvoiceListQuery['sortBy'], label: string) => {
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
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('grandTotal', 'Amount')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Outstanding</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('status', 'Status')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Created By</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="transition-colors hover:bg-[#FAFAFA]">
              <td className="px-4 py-3.5.5 font-medium text-[#111827]">
                <Link href={`/invoices/view?id=${invoice.id}`} className="hover:text-[#D32F2F]">
                  {invoice.invoiceNumber}
                </Link>
              </td>
              <td className="px-4 py-3.5 text-[#111827]">
                {invoice.customer ? (
                  <div>
                    <p className="font-medium">{invoice.customer.name}</p>
                    <p className="text-xs text-[#6B7280]">{invoice.customer.phone}</p>
                  </div>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3.5 text-[#374151]">{formatDate(invoice.invoiceDate)}</td>
              <td className="px-4 py-3.5 text-[#374151]">{formatDate(invoice.dueDate)}</td>
              <td className="px-4 py-3.5 font-medium text-[#111827]">
                {formatMoney(invoice.grandTotal)}
              </td>
              <td className="px-4 py-3.5 font-medium text-[#B45309]">
                {formatMoney(invoice.outstandingBalance)}
              </td>
              <td className="px-4 py-3.5">
                <InvoiceStatusBadge status={invoice.status} />
              </td>
              <td className="px-4 py-3.5 text-[#374151]">{invoice.createdByName || '—'}</td>
              <td className="px-4 py-3.5">
                <InvoiceActionsMenu
                  invoice={invoice}
                  onDelete={onDelete}
                  onRecordPayment={onRecordPayment}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
