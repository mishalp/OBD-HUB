import { IUserDocument, User } from '../models/user.model';
import { SafeUser } from '../types/auth.types';

interface BusinessSummary {
  businessName: string;
  logo: string | null;
}

export const toSafeUser = (
  user: IUserDocument,
  businessSummary: BusinessSummary | null = null,
): SafeUser => {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    role: user.role,
    isActive: user.isActive,
    businessId: user.businessId ? user.businessId.toString() : null,
    businessSetupCompleted: Boolean(user.businessSetupCompleted),
    businessName: businessSummary?.businessName ?? null,
    logo: businessSummary?.logo ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const findUserByEmail = async (
  email: string,
  withSecrets = false,
): Promise<IUserDocument | null> => {
  const query = User.findOne({ email: email.toLowerCase().trim() });

  if (withSecrets) {
    query.select('+passwordHash +refreshTokenHash');
  }

  return query.exec();
};

export const findUserById = async (
  id: string,
  withSecrets = false,
): Promise<IUserDocument | null> => {
  const query = User.findById(id);

  if (withSecrets) {
    query.select('+passwordHash +refreshTokenHash');
  }

  return query.exec();
};

export const createUser = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}): Promise<IUserDocument> => {
  return User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase().trim(),
    passwordHash: data.passwordHash,
    role: 'admin',
    isActive: true,
    businessId: null,
    businessSetupCompleted: false,
    refreshTokenHash: null,
  });
};

export const updateRefreshTokenHash = async (
  userId: string,
  refreshTokenHash: string | null,
): Promise<void> => {
  await User.findByIdAndUpdate(userId, { refreshTokenHash }).exec();
};
