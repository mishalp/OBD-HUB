import { apiRequest } from '@/lib/api/client';
import type {
  Customer,
  CustomerDetails,
  CustomerFormValues,
  CustomerListQuery,
  CustomerListResponse,
} from '@/lib/types/customer';

const toQueryString = (query: CustomerListQuery): string => {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    search: query.search,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    status: query.status,
  });

  return params.toString();
};

const toPayload = (values: CustomerFormValues) => ({
  name: values.name.trim(),
  phone: values.phone.trim() || null,
  email: values.email.trim() || null,
  addressLine1: values.addressLine1.trim() || null,
  addressLine2: values.addressLine2.trim() || null,
  city: values.city.trim() || null,
  state: values.state.trim() || null,
  country: values.country.trim() || null,
  postalCode: values.postalCode.trim() || null,
  gstNumber: values.gstNumber.trim() || null,
  notes: values.notes.trim() || null,
  isActive: values.isActive,
});

export type QuickCreateCustomerPayload = {
  name: string;
  phone?: string | null;
  email?: string | null;
};

export const customersApi = {
  list(query: CustomerListQuery): Promise<CustomerListResponse> {
    return apiRequest<CustomerListResponse>(`/api/customers?${toQueryString(query)}`);
  },

  getById(id: string): Promise<{ customer: CustomerDetails }> {
    return apiRequest<{ customer: CustomerDetails }>(`/api/customers/${id}`);
  },

  create(values: CustomerFormValues): Promise<{ customer: Customer }> {
    return apiRequest<{ customer: Customer }>('/api/customers', {
      method: 'POST',
      body: toPayload(values),
    });
  },

  /** Name-only (or minimal) create used by Invoice Builder Quick Create. */
  quickCreate(payload: QuickCreateCustomerPayload): Promise<{ customer: Customer }> {
    return apiRequest<{ customer: Customer }>('/api/customers', {
      method: 'POST',
      body: {
        name: payload.name.trim(),
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || null,
        isActive: true,
      },
    });
  },

  update(id: string, values: CustomerFormValues): Promise<{ customer: Customer }> {
    return apiRequest<{ customer: Customer }>(`/api/customers/${id}`, {
      method: 'PUT',
      body: toPayload(values),
    });
  },

  remove(id: string): Promise<null> {
    return apiRequest<null>(`/api/customers/${id}`, {
      method: 'DELETE',
    });
  },
};
