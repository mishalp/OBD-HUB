import { apiRequest } from '@/lib/api/client';
import type { Business, BusinessSetupResponse } from '@/lib/types/business';

export const businessApi = {
  create(formData: FormData): Promise<BusinessSetupResponse> {
    return apiRequest<BusinessSetupResponse>('/api/business', {
      method: 'POST',
      body: formData,
    });
  },

  get(): Promise<{ business: Business }> {
    return apiRequest<{ business: Business }>('/api/business');
  },

  update(formData: FormData): Promise<{ business: Business }> {
    return apiRequest<{ business: Business }>('/api/business', {
      method: 'PUT',
      body: formData,
    });
  },
};
