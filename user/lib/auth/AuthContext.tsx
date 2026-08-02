'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/lib/api/auth';
import { ApiClientError } from '@/lib/api/client';
import { authStorage } from '@/lib/auth/storage';
import type { AuthUser, LoginPayload, RegisterPayload } from '@/lib/types/auth';
import { isOnboardingComplete } from '@/lib/types/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  businessSetupCompleted: boolean;
  businessId: string | null;
  businessName: string | null;
  logo: string | null;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateBusinessSession: (data: {
    businessId: string;
    businessSetupCompleted: boolean;
    businessName: string;
    logo: string | null;
  }) => void;
  /** Merges updated account fields into the session so the header stays current. */
  updateUserSession: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const persistSession = (accessToken: string, user: AuthUser): void => {
  authStorage.setAccessToken(accessToken);
  authStorage.setUser(user);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      const storedToken = authStorage.getAccessToken();
      const storedUser = authStorage.getUser();

      if (!storedToken || !storedUser) {
        authStorage.clear();
        setUser(null);
        setAccessToken(null);
        setStatus('unauthenticated');
        return;
      }

      setAccessToken(storedToken);
      setUser(storedUser);

      try {
        const { user: currentUser } = await authApi.me();
        persistSession(storedToken, currentUser);
        setUser(currentUser);
        setStatus('authenticated');
      } catch (error) {
        if (error instanceof ApiClientError && (error.statusCode === 401 || error.statusCode === 403)) {
          authStorage.clear();
          setUser(null);
          setAccessToken(null);
          setStatus('unauthenticated');
          return;
        }

        setStatus('authenticated');
      }
    };

    void bootstrap();
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthUser> => {
    const data = await authApi.login(payload);

    persistSession(data.accessToken, data.user);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');

    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthUser> => {
    const data = await authApi.register(payload);

    persistSession(data.accessToken, data.user);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');

    return data.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Clear local session even if the API call fails
    } finally {
      authStorage.clear();
      setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const updateBusinessSession = useCallback(
    (data: {
      businessId: string;
      businessSetupCompleted: boolean;
      businessName: string;
      logo: string | null;
    }): void => {
      setUser((current) => {
        if (!current) {
          return current;
        }

        const nextUser: AuthUser = {
          ...current,
          businessId: data.businessId,
          businessSetupCompleted: data.businessSetupCompleted,
          businessName: data.businessName,
          logo: data.logo,
        };

        const token = authStorage.getAccessToken();
        if (token) {
          persistSession(token, nextUser);
        } else {
          authStorage.setUser(nextUser);
        }

        return nextUser;
      });
    },
    [],
  );

  const updateUserSession = useCallback((patch: Partial<AuthUser>): void => {
    setUser((current) => {
      if (!current) {
        return current;
      }

      const nextUser: AuthUser = { ...current, ...patch };
      const token = authStorage.getAccessToken();

      if (token) {
        persistSession(token, nextUser);
      } else {
        authStorage.setUser(nextUser);
      }

      return nextUser;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      status,
      isAuthenticated: status === 'authenticated',
      businessSetupCompleted: isOnboardingComplete(user),
      businessId: user?.businessId ?? null,
      businessName: user?.businessName ?? null,
      logo: user?.logo ?? null,
      login,
      register,
      logout,
      updateBusinessSession,
      updateUserSession,
    }),
    [
      user,
      accessToken,
      status,
      login,
      register,
      logout,
      updateBusinessSession,
      updateUserSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
