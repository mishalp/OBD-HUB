'use client';

import Link from 'next/link';
import type { PaymentListItem, PaymentListQuery } from '@/lib/types/payment';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { PaymentMethodBadge } from '@/components/payments/PaymentMethodBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface PaymentTableProps {
  payments: PaymentListItem[];
  sortBy: PaymentListQuery['sortBy'];
  sortOrder: PaymentListQuery['sortOrder'];
  onSort: (sortBy: PaymentListQuery['sortBy']) => void;
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

export const PaymentTable = ({
  payments,
  sortBy,
  sortOrder,
  onSort,
  hasFilters,
}: PaymentTableProps) => {
  if (payments.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? 'No payments match your filters.' : 'No payments recorded yet.'}
        description={
          hasFilters
            ? 'Try adjusting your search, method, customer, or date range.'
            : 'Record a payment against an unpaid invoice to get started.'
        }
      />
    );
  }

  const renderSortLabel = (key: PaymentListQuery['sortBy'], label: string) => {
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
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('paymentNumber', 'Payment #')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Invoice #</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Customer</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('paymentDate', 'Payment Date')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('paymentMethod', 'Method')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('amount', 'Amount')}</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Reference</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Recorded By</th>
            <th className="px-4 py-3.5.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {payments.map((payment) => (
            <tr key={payment.id} className="transition-colors hover:bg-[#FAFAFA]">
              <td className="px-4 py-3.5 font-medium text-[#111827]">
                <Link href={`/payments/view?id=${payment.id}`} className="hover:text-[#D32F2F]">
                  {payment.paymentNumber}
                </Link>
              </td>
              <td className="px-4 py-3.5 text-[#111827]">
                {payment.invoice ? (
                  <Link
                    href={`/invoices/view?id=${payment.invoice.id}`}
                    className="hover:text-[#D32F2F]"
                  >
                    {payment.invoice.invoiceNumber}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3.5 text-[#111827]">
                {payment.customer ? (
                  <div>
                    <p className="font-medium">{payment.customer.name}</p>
                    <p className="text-xs text-[#6B7280]">{payment.customer.phone}</p>
                  </div>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3.5 text-[#374151]">{formatDate(payment.paymentDate)}</td>
              <td className="px-4 py-3.5">
                <PaymentMethodBadge method={payment.paymentMethod} />
              </td>
              <td className="px-4 py-3.5 font-medium text-[#111827]">
                {formatMoney(payment.amount)}
              </td>
              <td className="px-4 py-3.5 text-[#374151]">{payment.referenceNumber || '—'}</td>
              <td className="px-4 py-3.5 text-[#374151]">{payment.recordedByName || '—'}</td>
              <td className="px-4 py-3.5">
                <Link
                  href={`/payments/view?id=${payment.id}`}
                  className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
