import type { CustomerReportInfo, CustomerReportStatus } from '@/lib/types/customerReport';
import { CustomerStatusBadge } from './CustomerStatusBadge';

interface CustomerProfileHeaderProps {
  customer: CustomerReportInfo;
  customerStatus: CustomerReportStatus;
  lifetimeValueLabel: string;
}

export const CustomerProfileHeader = ({
  customer,
  customerStatus,
  lifetimeValueLabel,
}: CustomerProfileHeaderProps) => {
  const location = [customer.city, customer.state, customer.country]
    .filter(Boolean)
    .join(', ');

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-[#111827]">{customer.name}</h2>
            <CustomerStatusBadge status={customerStatus} />
            {!customer.isActive ? (
              <span className="rounded-full bg-[#FEF2F2] px-2.5 py-0.5 text-xs font-medium text-[#b91c1c]">
                Account inactive
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[#6B7280]">
            {customer.customerCode}
            {customer.phone ? ` · ${customer.phone}` : ''}
            {customer.email ? ` · ${customer.email}` : ''}
          </p>
          {location ? <p className="mt-1 text-sm text-[#9CA3AF]">{location}</p> : null}
          {customer.gstNumber ? (
            <p className="mt-1 text-sm text-[#9CA3AF]">GST: {customer.gstNumber}</p>
          ) : null}
        </div>
        <div className="rounded-lg bg-[#FEF2F2] px-4 py-3 text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-[#D32F2F]">
            Lifetime Value
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#111827]">{lifetimeValueLabel}</p>
        </div>
      </div>
    </section>
  );
};
