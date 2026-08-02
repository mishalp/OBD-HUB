'use client';

import { useEffect, useState } from 'react';
import { businessApi } from '@/lib/api/business';
import { ApiClientError } from '@/lib/api/client';
import type { Business } from '@/lib/types/business';
import { BusinessSummaryCard } from '@/components/dashboard/BusinessSummaryCard';

export default function BusinessProfilePage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await businessApi.get();
        setBusiness(response.business);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError('Unable to load business profile.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading business profile...</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
        {error ?? 'Business profile unavailable.'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-[#111827]">Business Profile</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          View your business details. Editing will be available in Settings later.
        </p>
      </div>
      <BusinessSummaryCard
        business={{
          id: business.id,
          businessName: business.businessName,
          businessLogo: business.businessLogo,
          phone: business.phone,
          email: business.email,
          addressLine1: business.addressLine1,
          addressLine2: business.addressLine2,
          city: business.city,
          state: business.state,
          country: business.country,
          postalCode: business.postalCode,
          gstEnabled: business.gstEnabled,
          gstNumber: business.gstNumber,
          invoicePrefix: business.invoicePrefix,
          currency: business.currency,
          currencySymbol: business.currencySymbol,
        }}
      />
    </div>
  );
}
