import { AuthUserRole } from '../modules/auth/types/auth.types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AuthUserRole;
  businessId: string | null;
  businessSetupCompleted: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
