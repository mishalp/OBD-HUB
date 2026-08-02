import { resolveAssetUrl } from '@/lib/api/client';
import type { InvoiceBusinessSummary } from '@/lib/types/invoice';
import { joinDocumentAddress } from '@/lib/documents/types';

interface DocumentBusinessHeaderProps {
  business: InvoiceBusinessSummary;
  title?: string;
}

export const DocumentBusinessHeader = ({
  business,
  title = 'INVOICE',
}: DocumentBusinessHeaderProps) => {
  const logoUrl = resolveAssetUrl(business.businessLogo);
  const address = joinDocumentAddress([
    business.addressLine1,
    business.addressLine2,
    business.city,
    business.state,
    business.postalCode,
    business.country,
  ]);

  return (
    <header className="border-b-4 border-[#b91c1c] pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={business.businessName}
              className="h-14 w-auto max-w-[110px] object-contain"
            />
          ) : null}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-black">
              {business.businessName}
            </h1>
            <div className="mt-1 space-y-0.5 text-xs text-[#525252]">
              {address ? <p>{address}</p> : null}
              <p>Phone: {business.phone}</p>
              <p>Email: {business.email}</p>
              {business.gstEnabled && business.gstNumber ? (
                <p>GST: {business.gstNumber}</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-wide text-[#b91c1c]">{title}</p>
        </div>
      </div>
    </header>
  );
};
