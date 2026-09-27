import { apiRequest, getApiBaseUrl, ApiClientError } from '@/lib/api/client';
import { authStorage } from '@/lib/auth/storage';
import type {
  CreateInvoicePayload,
  Invoice,
  InvoiceDetails,
  InvoiceListQuery,
  InvoiceListResponse,
  UpdateInvoicePayload,
} from '@/lib/types/invoice';
import type { PrintDocumentPayload } from '@/lib/documents/types';
import { invoiceNumberApi } from '@/lib/api/invoiceNumber';

const toQueryString = (query: InvoiceListQuery): string => {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    search: query.search,
    status: query.status,
    customer: query.customer,
    fromDate: query.fromDate,
    toDate: query.toDate,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return params.toString();
};

export const invoicesApi = {
  /**
   * @deprecated Prefer invoiceNumberApi.peek()
   * Kept so existing Invoice Builder call sites keep working.
   */
  getNextNumber() {
    return invoiceNumberApi.peek();
  },

  list(query: InvoiceListQuery): Promise<InvoiceListResponse> {
    return apiRequest<InvoiceListResponse>(`/api/invoices?${toQueryString(query)}`);
  },

  getById(id: string): Promise<{ invoice: InvoiceDetails }> {
    return apiRequest<{ invoice: InvoiceDetails }>(`/api/invoices/${id}`);
  },

  getPrintDocument(id: string): Promise<PrintDocumentPayload> {
    return apiRequest<PrintDocumentPayload>(`/api/invoices/${id}/print`);
  },

  async downloadPdf(id: string): Promise<{ blob: Blob; fileName: string }> {
    const token = authStorage.getAccessToken();
    const headers: HeadersInit = {
      Accept: 'application/pdf',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;

    try {
      response = await fetch(`${getApiBaseUrl()}/api/invoices/${id}/pdf`, {
        method: 'GET',
        headers,
        // credentials: 'include',
      });
    } catch {
      throw new ApiClientError(0, 'Network error. Please check your connection.');
    }

    if (!response.ok) {
      let message = 'Unable to download PDF.';
      try {
        const payload = (await response.json()) as { message?: string };
        if (payload.message) {
          message = payload.message;
        }
      } catch {
        // Binary error bodies are ignored.
      }

      if (response.status === 401) {
        authStorage.clear();
      }

      throw new ApiClientError(response.status, message);
    }

    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename="?([^"]+)"?/i.exec(disposition);
    const fileName = match?.[1] ?? `invoice-${id}.pdf`;
    const blob = await response.blob();

    return { blob, fileName };
  },

  create(payload: CreateInvoicePayload): Promise<{ invoice: Invoice }> {
    return apiRequest<{ invoice: Invoice }>('/api/invoices', {
      method: 'POST',
      body: payload,
    });
  },

  update(id: string, payload: UpdateInvoicePayload): Promise<{ invoice: Invoice }> {
    return apiRequest<{ invoice: Invoice }>(`/api/invoices/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  remove(id: string): Promise<null> {
    return apiRequest<null>(`/api/invoices/${id}`, {
      method: 'DELETE',
    });
  },
};
