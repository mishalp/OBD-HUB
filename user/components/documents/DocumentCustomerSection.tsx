import type { InvoiceCustomerDetails } from '@/lib/types/invoice';
import { joinDocumentAddress } from '@/lib/documents/types';

interface DocumentCustomerSectionProps {
  customer: InvoiceCustomerDetails | null;
  label?: string;
}

export const DocumentCustomerSection = ({
  customer,
  label = 'Bill To',
}: DocumentCustomerSectionProps) => {
  if (!customer) {
    return (
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#b91c1c]">
          {label}
        </h2>
        <p className="mt-2 text-sm text-[#737373]">Customer information unavailable.</p>
      </section>
    );
  }

  const address = joinDocumentAddress([
    customer.addressLine1,
    customer.addressLine2,
    customer.city,
    customer.state,
    customer.postalCode,
    customer.country,
  ]);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#b91c1c]">
        {label}
      </h2>
      <div className="mt-2 space-y-0.5 text-sm text-black">
        <p className="font-semibold">
          {customer.name}{' '}
          <span className="text-xs font-normal text-[#737373]">
            ({customer.customerCode})
          </span>
        </p>
        {address ? <p>{address}</p> : null}
        <p>{customer.phone}</p>
        {customer.email ? <p>{customer.email}</p> : null}
        {customer.gstNumber ? <p>GST: {customer.gstNumber}</p> : null}
      </div>
    </section>
  );
};
