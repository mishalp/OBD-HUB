'use client';

import { UserRoundX } from 'lucide-react';
import { CreateCustomerButton } from '@/components/invoices/CreateCustomerButton';

interface CustomerSearchEmptyStateProps {
  searchTerm: string;
  onCreate: () => void;
  disabled?: boolean;
}

export const CustomerSearchEmptyState = ({
  searchTerm,
  onCreate,
  disabled = false,
}: CustomerSearchEmptyStateProps) => {
  const trimmed = searchTerm.trim();

  return (
    <div className="px-3 py-4 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAFA] text-[#9CA3AF] ring-1 ring-[#E5E7EB]">
        <UserRoundX className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-[#111827]">No customer found</p>
      <p className="mt-1 text-[13px] text-[#6B7280]">
        {trimmed
          ? `No matches for “${trimmed}”. Create a new customer to continue.`
          : 'Try a different search, or create a new customer.'}
      </p>
      <div className="mt-4">
        <CreateCustomerButton
          searchTerm={trimmed}
          onClick={onCreate}
          disabled={disabled || trimmed.length < 2}
        />
      </div>
      {trimmed.length > 0 && trimmed.length < 2 ? (
        <p className="mt-2 text-[12px] text-[#9CA3AF]">
          Enter at least 2 characters to create a customer.
        </p>
      ) : null}
    </div>
  );
};
