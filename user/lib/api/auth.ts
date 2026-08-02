import { apiRequest } from '@/lib/api/client';
import type {
  AuthSessionData,
  LoginPayload,
  MeResponseData,
  RegisterPayload,
} from '@/lib/types/auth';

export const authApi = {
  register(payload: RegisterPayload): Promise<AuthSessionData> {
    return apiRequest<AuthSessionData>('/api/auth/register', {
      method: 'POST',
      body: payload,
      token: null,
    });
  },

  login(payload: LoginPayload): Promise<AuthSessionData> {
    return apiRequest<AuthSessionData>('/api/auth/login', {
      method: 'POST',
      body: payload,
      token: null,
    });
  },

  logout(): Promise<null> {
    return apiRequest<null>('/api/auth/logout', {
      method: 'POST',
    });
  },

  me(): Promise<MeResponseData> {
    return apiRequest<MeResponseData>('/api/auth/me');
  },
};
