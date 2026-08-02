import { apiRequest } from '@/lib/api/client';
import type {
  DueDetails,
  DueListQuery,
  DueListResponse,
  DueSummary,
} from '@/lib/types/due';

const toQueryString = (query: DueListQuery): string => {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    search: query.search,
    customer: query.customer,
    status: query.status,
    fromDate: query.fromDate,
    toDate: query.toDate,
    ageingBucket: query.ageingBucket,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return params.toString();
};

export const duesApi = {
  list(query: DueListQuery): Promise<DueListResponse> {
    return apiRequest<DueListResponse>(`/api/dues?${toQueryString(query)}`);
  },

  getSummary(): Promise<{ summary: DueSummary }> {
    return apiRequest<{ summary: DueSummary }>('/api/dues/summary');
  },

  getByInvoiceId(invoiceId: string): Promise<{ due: DueDetails }> {
    return apiRequest<{ due: DueDetails }>(`/api/dues/${invoiceId}`);
  },
};
