import { resolveAssetUrl } from '@/lib/api/client';
import type { DashboardBusinessSummary } from '@/lib/types/dashboard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface BusinessSummaryCardProps {
  business: DashboardBusinessSummary;
}

export const BusinessSummaryCard = ({ business }: BusinessSummaryCardProps) => {
  const logoUrl = resolveAssetUrl(business.businessLogo);
  const address = [
    business.addressLine1,
    business.addressLine2,
    business.city,
    business.state,
    business.postalCode,
    business.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card padding="md" className="h-full">
      <div className="flex items-start gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={business.businessName}
            className="h-14 w-14 rounded-xl object-cover ring-1 ring-[#E5E7EB]"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#111111] text-lg font-semibold text-white">
            {business.businessName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-[#111827]">
            {business.businessName}
          </h3>
          <p className="mt-1 text-sm text-[#6B7280]">{business.email}</p>
          <p className="text-sm text-[#6B7280]">{business.phone}</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[12px] font-medium uppercase tracking-wide text-[#9CA3AF]">
            Address
          </dt>
          <dd className="mt-1 text-[#111827]">{address || '—'}</dd>
        </div>
        <div>
          <dt className="text-[12px] font-medium uppercase tracking-wide text-[#9CA3AF]">
            GST Status
          </dt>
          <dd className="mt-1">
            {business.gstEnabled ? (
              <Badge tone="success">
                Enabled{business.gstNumber ? ` · ${business.gstNumber}` : ''}
              </Badge>
            ) : (
              <Badge tone="neutral">Disabled</Badge>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] font-medium uppercase tracking-wide text-[#9CA3AF]">
            Invoice Prefix
          </dt>
          <dd className="mt-1 font-medium text-[#111827]">{business.invoicePrefix}</dd>
        </div>
        <div>
          <dt className="text-[12px] font-medium uppercase tracking-wide text-[#9CA3AF]">
            Currency
          </dt>
          <dd className="mt-1 font-medium text-[#111827]">
            {business.currency} ({business.currencySymbol})
          </dd>
        </div>
      </dl>
    </Card>
  );
};
