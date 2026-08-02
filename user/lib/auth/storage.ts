import type { AuthUser } from '@/lib/types/auth';

const ACCESS_TOKEN_KEY = 'obd_access_token';
const AUTH_USER_KEY = 'obd_auth_user';

export const authStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getUser(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(AUTH_USER_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setUser(user: AuthUser): void {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },
};
