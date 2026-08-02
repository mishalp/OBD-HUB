'use client';

import type { StockTransaction } from '@/lib/types/item';

interface StockHistoryTableProps {
  transactions: StockTransaction[];
  emptyMessage?: string;
}

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const StockHistoryTable = ({
  transactions,
  emptyMessage = 'No stock movements yet.',
}: StockHistoryTableProps) => {
  if (transactions.length === 0) {
    return <p className="px-4 py-6 text-sm text-[#6B7280]">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
        <thead className="bg-[#FAFAFA] text-xs uppercase tracking-wide text-[#6B7280]">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Previous</th>
            <th className="px-4 py-3">New</th>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">By</th>
            <th className="px-4 py-3">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-[#FAFAFA]">
              <td className="px-4 py-3 text-[#374151]">{formatDateTime(tx.createdAt)}</td>
              <td className="px-4 py-3 font-medium text-[#111827]">{tx.transactionType}</td>
              <td
                className={[
                  'px-4 py-3 font-medium',
                  tx.quantity < 0 ? 'text-[#DC2626]' : 'text-[#15803D]',
                ].join(' ')}
              >
                {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
              </td>
              <td className="px-4 py-3 text-[#374151]">{tx.previousStock}</td>
              <td className="px-4 py-3 font-medium text-[#111827]">{tx.newStock}</td>
              <td className="px-4 py-3 text-[#6B7280]">
                {tx.referenceType
                  ? `${tx.referenceType}${tx.referenceId ? ` · ${tx.referenceId.slice(-6)}` : ''}`
                  : '—'}
              </td>
              <td className="px-4 py-3 text-[#374151]">{tx.performedByName || '—'}</td>
              <td className="max-w-[220px] truncate px-4 py-3 text-[#6B7280]">
                {tx.notes || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
