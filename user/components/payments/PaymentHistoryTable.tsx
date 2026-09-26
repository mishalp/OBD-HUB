'use client';

import Link from 'next/link';
import type { PaymentHistoryItem } from '@/lib/types/payment';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { PaymentMethodBadge } from '@/components/payments/PaymentMethodBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface PaymentHistoryTableProps {
  payments: PaymentHistoryItem[];
  isLoading?: boolean;
}

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const PaymentHistoryTable = ({ payments, isLoading }: PaymentHistoryTableProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded bg-[#F3F4F6]" />
          ))}
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Payment History</h3>
        <div className="mt-4">
          <EmptyState
            title="No payments recorded"
            description="Payments recorded against this invoice will appear here."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-base font-semibold text-[#111827]">Payment History</h3>
      </div>
      <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
        <thead className="bg-[#FAFAFA]">
          <tr>
            <th className="px-4 py-3 font-medium text-[#6B7280]">Payment #</th>
            <th className="px-4 py-3 font-medium text-[#6B7280]">Date</th>
            <th className="px-4 py-3 font-medium text-[#6B7280]">Amount</th>
            <th className="px-4 py-3 font-medium text-[#6B7280]">Method</th>
            <th className="px-4 py-3 font-medium text-[#6B7280]">Reference</th>
            <th className="px-4 py-3 font-medium text-[#6B7280]">Recorded By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-[#fafbfc]">
              <td className="px-4 py-3 font-medium text-[#111827]">
                <Link href={`/payments/view?id=${payment.id}`} className="hover:text-[#D32F2F]">
                  {payment.paymentNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-[#374151]">{formatDate(payment.paymentDate)}</td>
              <td className="px-4 py-3 font-medium text-[#111827]">
                {formatMoney(payment.amount)}
              </td>
              <td className="px-4 py-3">
                <PaymentMethodBadge method={payment.paymentMethod} />
              </td>
              <td className="px-4 py-3 text-[#374151]">{payment.referenceNumber || '—'}</td>
              <td className="px-4 py-3 text-[#374151]">{payment.recordedByName || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
