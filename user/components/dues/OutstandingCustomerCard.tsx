import Link from 'next/link';
import type { TopOutstandingCustomer } from '@/lib/types/due';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface OutstandingCustomerCardProps {
  customers: TopOutstandingCustomer[];
  isLoading: boolean;
}

export const OutstandingCustomerCard = ({
  customers,
  isLoading,
}: OutstandingCustomerCardProps) => {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="text-base font-semibold text-[#111827]">Top Outstanding Customers</h3>
      <p className="mt-1 text-sm text-[#6B7280]">
        Customers with the highest outstanding receivable balances.
      </p>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-[#F3F4F6]" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No outstanding balances"
            description="Customers with open invoices will appear here."
          />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
            <thead className="bg-[#FAFAFA]">
              <tr>
                <th className="px-3 py-2 font-medium text-[#6B7280]">Customer</th>
                <th className="px-3 py-2 font-medium text-[#6B7280]">Outstanding</th>
                <th className="px-3 py-2 font-medium text-[#6B7280]">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {customers.map((customer) => (
                <tr key={customer.customerId} className="hover:bg-[#fafbfc]">
                  <td className="px-3 py-3">
                    <Link
                      href={`/customers/view?id=${customer.customerId}`}
                      className="font-medium text-[#111827] hover:text-[#D32F2F]"
                    >
                      {customer.name}
                    </Link>
                    <p className="text-xs text-[#6B7280]">{customer.customerCode}</p>
                  </td>
                  <td className="px-3 py-3 font-medium text-[#B45309]">
                    {formatMoney(customer.outstandingAmount)}
                  </td>
                  <td className="px-3 py-3 text-[#374151]">{customer.invoiceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
