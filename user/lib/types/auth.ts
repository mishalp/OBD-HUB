export type UserRole = 'admin';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
  businessId: string | null;
  businessSetupCompleted: boolean;
  businessName: string | null;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthSessionData {
  user: AuthUser;
  accessToken: string;
}

export interface MeResponseData {
  user: AuthUser;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  errors?: Array<{ path: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const getUserDisplayName = (user: AuthUser): string => {
  return `${user.firstName} ${user.lastName}`.trim();
};

export const isOnboardingComplete = (user: AuthUser | null): boolean => {
  return Boolean(user?.businessSetupCompleted);
};

export const getPostAuthPath = (user: AuthUser): string => {
  return isOnboardingComplete(user) ? '/dashboard' : '/business-setup';
};
