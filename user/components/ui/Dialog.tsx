'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const Dialog = ({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: DialogProps) => {
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
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ui-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#111111]/40 backdrop-blur-[2px] transition-opacity duration-200"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-md animate-[fadeIn_150ms_ease-out] rounded-xl border border-[#E5E7EB] bg-white shadow-xl',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <h3 id="ui-dialog-title" className="text-lg font-semibold text-[#111827]">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children ? <div className="px-5 py-4">{children}</div> : null}
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-[#E5E7EB] bg-[#FAFAFA] px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
