'use client';

import Link from 'next/link';
import type { CustomerReportTopItem, TopLimit } from '@/lib/types/customerReport';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { EmptyReportState } from '@/components/reports/EmptyReportState';

interface CustomerTopTableProps {
  customers: CustomerReportTopItem[];
  limit: TopLimit;
  onLimitChange: (limit: TopLimit) => void;
  isLoading?: boolean;
}

const LIMIT_OPTIONS: TopLimit[] = [5, 10, 20];

export const CustomerTopTable = ({
  customers,
  limit,
  onLimitChange,
  isLoading = false,
}: CustomerTopTableProps) => {
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
      ) : customers.length === 0 ? (
        <EmptyReportState
          title="No top customers"
          description="No revenue was recorded in the selected period."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#FAFAFA] shadow-[inset_0_-1px_0_#E5E7EB]">
              <tr className="border-b border-[#E5E7EB] text-left text-xs uppercase tracking-wide text-[#6B7280]">
                <th className="px-4 py-3.5 font-semibold">Rank</th>
                <th className="px-4 py-3.5 font-semibold">Customer</th>
                <th className="px-4 py-3.5 text-right font-semibold">Revenue</th>
                <th className="px-4 py-3.5 text-right font-semibold">Outstanding</th>
                <th className="px-4 py-3.5 text-right font-semibold">Invoices</th>
                <th className="px-4 py-3.5 text-right font-semibold">Avg Invoice</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr
                  key={customer.customerId}
                  className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#FAFAFA]"
                >
                  <td className="px-4 py-3.5 text-[#6B7280]">{index + 1}</td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/reports/customers/view?id=${customer.customerId}`}
                      className="font-medium text-[#D32F2F] hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <p className="text-xs text-[#9CA3AF]">{customer.customerCode}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-[#111827]">
                    {formatMoney(customer.revenue)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#B45309]">
                    {formatMoney(customer.outstandingAmount)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#374151]">
                    {customer.invoiceCount}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#374151]">
                    {formatMoney(customer.averageInvoiceValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
