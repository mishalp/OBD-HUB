export type AuthUserRole = 'admin';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: AuthUserRole;
}

export interface SafeUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: AuthUserRole;
  isActive: boolean;
  businessId: string | null;
  businessSetupCompleted: boolean;
  businessName: string | null;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSessionResult {
  user: SafeUser;
  accessToken: string;
}
