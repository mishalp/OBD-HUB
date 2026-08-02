'use client';

import { useEffect, type ReactNode } from 'react';
import type { ItemFormValues } from '@/lib/types/item';
import { ItemForm } from '@/components/items/ItemForm';

interface ItemModalProps {
  open: boolean;
  title: string;
  initialValues: ItemFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  serverError: string | null;
  fieldErrors?: {
    name?: string;
    type?: string;
    unit?: string;
    price?: string;
    costPrice?: string;
    taxRate?: string;
  };
  lockType?: boolean;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void> | void;
}

export const ItemModal = ({
  open,
  title,
  initialValues,
  submitLabel,
  isSubmitting,
  serverError,
  fieldErrors,
  lockType = false,
  onClose,
  onSubmit,
}: ItemModalProps): ReactNode => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-[#111111]/40 backdrop-blur-[2px]"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              Products and services are scoped to your business.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#E5E7EB] px-2 py-1 text-sm text-[#6B7280] hover:bg-[#FAFAFA]"
          >
            Close
          </button>
        </div>

        <ItemForm
          key={`${title}-${initialValues.name}-${initialValues.type}`}
          initialValues={initialValues}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
          serverError={serverError}
          fieldErrors={fieldErrors}
          lockType={lockType}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
};
