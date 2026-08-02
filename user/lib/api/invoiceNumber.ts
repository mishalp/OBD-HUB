import { apiRequest } from '@/lib/api/client';
import type { NextInvoiceNumberResponse } from '@/lib/types/invoice';

export interface InvoiceNumberSettingsPayload {
  prefix: string;
  paddingLength: number;
  separator: string;
  startingNumber?: number;
}

export const invoiceNumberApi = {
  /**
   * Preview the upcoming invoice number without reserving it.
   * Display-only — never treat this as the final number on save.
   */
  peek(): Promise<NextInvoiceNumberResponse> {
    return apiRequest<NextInvoiceNumberResponse>('/api/invoice-number/peek');
  },

  /**
   * Atomically reserve the next invoice number.
   * Prefer letting invoice create handle reservation server-side.
   */
  next(): Promise<NextInvoiceNumberResponse> {
    return apiRequest<NextInvoiceNumberResponse>('/api/invoice-number/next');
  },

  updateSettings(payload: InvoiceNumberSettingsPayload): Promise<{ sequence: unknown }> {
    return apiRequest<{ sequence: unknown }>('/api/invoice-number/settings', {
      method: 'PUT',
      body: payload,
    });
  },
};
