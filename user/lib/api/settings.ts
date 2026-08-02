import { apiRequest } from '@/lib/api/client';
import type { AuthUser } from '@/lib/types/auth';
import type { Business } from '@/lib/types/business';
import type {
  ChangePasswordValues,
  InvoiceSettings,
  PreferenceSettings,
  ProfileSettings,
  SettingsResponse,
  TaxSettings,
} from '@/lib/types/settings';

export const settingsApi = {
  get(): Promise<SettingsResponse> {
    return apiRequest<SettingsResponse>('/api/settings');
  },

  /** Multipart so the business logo can ride along with the changed fields. */
  updateBusiness(formData: FormData): Promise<{ business: Business }> {
    return apiRequest<{ business: Business }>('/api/settings/business', {
      method: 'PUT',
      body: formData,
    });
  },

  updateInvoice(
    payload: Record<string, unknown>,
  ): Promise<{ business: Business; invoice: InvoiceSettings }> {
    return apiRequest<{ business: Business; invoice: InvoiceSettings }>(
      '/api/settings/invoice',
      { method: 'PUT', body: payload },
    );
  },

  updateTax(
    payload: Record<string, unknown>,
  ): Promise<{ business: Business; tax: TaxSettings }> {
    return apiRequest<{ business: Business; tax: TaxSettings }>('/api/settings/tax', {
      method: 'PUT',
      body: payload,
    });
  },

  updatePreferences(
    payload: Record<string, unknown>,
  ): Promise<{ preferences: PreferenceSettings }> {
    return apiRequest<{ preferences: PreferenceSettings }>('/api/settings/preferences', {
      method: 'PUT',
      body: payload,
    });
  },

  updateProfile(
    formData: FormData,
  ): Promise<{ profile: ProfileSettings; user: AuthUser }> {
    return apiRequest<{ profile: ProfileSettings; user: AuthUser }>(
      '/api/settings/profile',
      { method: 'PUT', body: formData },
    );
  },

  changePassword(payload: ChangePasswordValues): Promise<null> {
    return apiRequest<null>('/api/settings/password', {
      method: 'PUT',
      body: payload,
    });
  },
};
