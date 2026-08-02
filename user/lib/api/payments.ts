import { apiRequest } from '@/lib/api/client';
import type {
  CreatePaymentPayload,
  CreatePaymentResponse,
  PaymentDetails,
  PaymentHistoryItem,
  PaymentListQuery,
  PaymentListResponse,
} from '@/lib/types/payment';

const toQueryString = (query: PaymentListQuery): string => {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    search: query.search,
    paymentMethod: query.paymentMethod,
    customer: query.customer,
    invoice: query.invoice,
    fromDate: query.fromDate,
    toDate: query.toDate,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return params.toString();
};

export const paymentsApi = {
  list(query: PaymentListQuery): Promise<PaymentListResponse> {
    return apiRequest<PaymentListResponse>(`/api/payments?${toQueryString(query)}`);
  },

  getById(id: string): Promise<{ payment: PaymentDetails }> {
    return apiRequest<{ payment: PaymentDetails }>(`/api/payments/${id}`);
  },

  create(payload: CreatePaymentPayload): Promise<CreatePaymentResponse> {
    return apiRequest<CreatePaymentResponse>('/api/payments', {
      method: 'POST',
      body: payload,
    });
  },

  listForInvoice(invoiceId: string): Promise<{ invoiceId: string; payments: PaymentHistoryItem[] }> {
    return apiRequest<{ invoiceId: string; payments: PaymentHistoryItem[] }>(
      `/api/invoices/${invoiceId}/payments`,
    );
  },
};
