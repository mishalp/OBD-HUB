import { ApiError } from '../../../utils/ApiError';
import { comparePassword, hashPassword } from '../utils/password';
import { generateTokenPair, hashToken } from '../utils/token';
import {
  createUser,
  findUserByEmail,
  findUserById,
  toSafeUser,
  updateRefreshTokenHash,
} from '../repositories/user.repository';
import { getBusinessSummaryById } from '../../business/services/business.service';
import { LoginInput, RegisterInput } from '../validators/auth.validator';
import { AuthSessionResult, SafeUser } from '../types/auth.types';
import { IUserDocument } from '../models/user.model';

const issueSession = async (user: {
  _id: { toString: () => string };
  email: string;
  role: 'admin';
}): Promise<{ accessToken: string; refreshToken: string }> => {
  const tokens = generateTokenPair({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  await updateRefreshTokenHash(user._id.toString(), hashToken(tokens.refreshToken));

  return tokens;
};

const toEnrichedSafeUser = async (user: IUserDocument): Promise<SafeUser> => {
  const summary = await getBusinessSummaryById(user.businessId);
  return toSafeUser(user, summary);
};

export const register = async (
  input: RegisterInput,
): Promise<AuthSessionResult & { refreshToken: string }> => {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new ApiError(409, 'Email already registered', [
      { path: 'email', message: 'Email already registered' },
    ]);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await createUser({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash,
  });

  const tokens = await issueSession(user);

  return {
    user: await toEnrichedSafeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const login = async (
  input: LoginInput,
): Promise<AuthSessionResult & { refreshToken: string }> => {
  const user = await findUserByEmail(input.email, true);

  if (!user) {
    throw new ApiError(401, 'Invalid email');
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Wrong password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is inactive');
  }

  const tokens = await issueSession(user);

  return {
    user: await toEnrichedSafeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const logout = async (userId: string): Promise<void> => {
  await updateRefreshTokenHash(userId, null);
};

export const getCurrentUser = async (userId: string): Promise<SafeUser> => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is inactive');
  }

  return toEnrichedSafeUser(user);
};
