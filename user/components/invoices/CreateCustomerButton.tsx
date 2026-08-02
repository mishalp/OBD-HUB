'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CreateCustomerButtonProps {
  searchTerm: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const CreateCustomerButton = ({
  searchTerm,
  onClick,
  disabled = false,
  className,
}: CreateCustomerButtonProps) => {
  const label = searchTerm.trim()
    ? `Create Customer "${searchTerm.trim()}"`
    : 'Create Customer';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#D32F2F] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B71C1C] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
};
