'use client';

import { useEffect } from 'react';

interface UnsavedChangesDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export const UnsavedChangesDialog = ({
  open,
  onStay,
  onLeave,
}: UnsavedChangesDialogProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onStay();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onStay]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#111111]/40 backdrop-blur-[2px]"
        aria-label="Stay on page"
        onClick={onStay}
      />
      <div className="relative w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#111827]">Unsaved changes</h3>
        <p className="mt-2 text-sm text-[#6B7280]">
          You have unsaved invoice changes. Leave this page anyway?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onStay}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-lg bg-[#D32F2F] px-3 py-2 text-sm font-semibold text-white hover:bg-[#B71C1C]"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
