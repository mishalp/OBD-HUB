'use client';

import { useEffect } from 'react';

interface DeleteConfirmationDialogProps {
  open: boolean;
  customerName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationDialog = ({
  open,
  customerName,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmationDialogProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, isDeleting, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#111111]/40 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#111827]">Delete customer</h3>
        <p className="mt-2 text-sm text-[#6B7280]">
          Are you sure you want to delete this customer?
        </p>
        <p className="mt-2 text-sm font-medium text-[#111827]">{customerName}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-[#D32F2F] px-3 py-2 text-sm font-semibold text-white hover:bg-[#B71C1C] disabled:opacity-60"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
