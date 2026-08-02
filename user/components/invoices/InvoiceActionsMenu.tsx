'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import type { InvoiceListItem } from '@/lib/types/invoice';
import {
  canRecordInvoicePayment,
  isEditableInvoiceStatus,
} from '@/lib/types/invoice';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils/cn';

interface InvoiceActionsMenuProps {
  invoice: InvoiceListItem;
  onDelete: (invoice: InvoiceListItem) => void;
  onRecordPayment: (invoice: InvoiceListItem) => void;
}

export const InvoiceActionsMenu = ({
  invoice,
  onDelete,
  onRecordPayment,
}: InvoiceActionsMenuProps) => {
  const router = useRouter();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const editable = isEditableInvoiceStatus(invoice.status);
  const showRecordPayment = canRecordInvoicePayment(invoice);

  const itemClassName =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#FAFAFA]';

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-md border border-[#E5E7EB] px-2 py-1 text-sm font-medium text-[#374151] hover:bg-[#FAFAFA]"
      >
        Actions
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-md border border-[#E5E7EB] bg-white shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
              router.push(`/invoices/${invoice.id}`);
            }}
          >
            View
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!editable}
            className={cn(
              itemClassName,
              'disabled:cursor-not-allowed disabled:text-[#cbd5e1]',
            )}
            onClick={() => {
              setOpen(false);
              router.push(`/invoices/${invoice.id}/edit`);
            }}
          >
            Edit
          </button>
          {showRecordPayment ? (
            <button
              type="button"
              role="menuitem"
              className={itemClassName}
              onClick={() => {
                setOpen(false);
                onRecordPayment(invoice);
              }}
            >
              <CreditCard className="h-4 w-4 shrink-0 text-[#D32F2F]" aria-hidden />
              Record Payment
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
              showToast('Duplicate is coming soon', 'error');
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#DC2626] hover:bg-[#FEF2F2]"
            onClick={() => {
              setOpen(false);
              onDelete(invoice);
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
};
