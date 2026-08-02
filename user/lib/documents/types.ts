import type { InvoiceDetails } from '@/lib/types/invoice';

/** Shared printable document model — reusable for quotations, POs, etc. */
export type DocumentType = 'invoice' | 'quotation' | 'purchase_order' | 'credit_note' | 'delivery_note';

export interface PrintDocumentPayload {
  document: InvoiceDetails;
  documentType: DocumentType;
  generatedAt: string;
}

export const formatDocumentMoney = (value: number, symbol = '₹'): string => {
  return `${symbol}${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDocumentDate = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const joinDocumentAddress = (
  parts: Array<string | null | undefined>,
): string => parts.filter(Boolean).join(', ');
