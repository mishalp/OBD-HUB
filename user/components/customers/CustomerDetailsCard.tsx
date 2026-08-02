import type { CustomerDetails } from '@/lib/types/customer';
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge';

interface CustomerDetailsCardProps {
  customer: CustomerDetails;
}

const formatDate = (value: string): string => {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const CustomerDetailsCard = ({ customer }: CustomerDetailsCardProps) => {
  const address = [
    customer.addressLine1,
    customer.addressLine2,
    customer.city,
    customer.state,
    customer.postalCode,
    customer.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              {customer.customerCode}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#111827]">{customer.name}</h2>
          </div>
          <CustomerStatusBadge isActive={customer.isActive} />
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Phone</dt>
            <dd className="mt-1 text-sm text-[#111827]">{customer.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Email</dt>
            <dd className="mt-1 text-sm text-[#111827]">{customer.email || '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Address</dt>
            <dd className="mt-1 text-sm text-[#111827]">{address || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">GST Number</dt>
            <dd className="mt-1 text-sm text-[#111827]">{customer.gstNumber || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Created Date</dt>
            <dd className="mt-1 text-sm text-[#111827]">{formatDate(customer.createdAt)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Notes</dt>
            <dd className="mt-1 text-sm text-[#111827]">{customer.notes || '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Future Statistics</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Invoices', value: customer.invoiceCount },
            { label: 'Total Sales', value: customer.totalSales },
            { label: 'Total Paid', value: customer.totalPaid },
            { label: 'Outstanding', value: customer.outstandingAmount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[#E5E7EB] p-4">
              <p className="text-xs uppercase tracking-wide text-[#6B7280]">{stat.label}</p>
              <p className="mt-2 text-xl font-semibold text-[#111827]">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
