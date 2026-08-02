import { Types } from 'mongoose';
import { ApiError } from '../../../utils/ApiError';
import { env } from '../../../config/env';
import { getDatabaseStatus } from '../../../database/connection';
import {
  getBusinessForUser,
  patchBusiness,
} from '../../business/services/business.service';
import { SafeBusiness } from '../../business/types/business.types';
import { findUserById, toSafeUser } from '../../auth/repositories/user.repository';
import { comparePassword, hashPassword } from '../../auth/utils/password';
import { User } from '../../auth/models/user.model';
import {
  ensureSequence,
  generateFormattedNumber,
  updateSequenceSettings,
} from '../../number-sequence/services/numberSequence.service';
import { DEFAULT_DOCUMENT_TYPE } from '../../number-sequence/utils/documentTypes';
import { Invoice } from '../../invoices/models/invoice.model';
import { ISettingsDocument, Settings } from '../models/settings.model';
import {
  BusinessSettingsInput,
  ChangePasswordInput,
  InvoiceSettingsInput,
  PreferenceSettingsInput,
  ProfileSettingsInput,
  TaxSettingsInput,
} from '../validators/settings.validator';
import {
  AboutInfo,
  InvoiceSettings,
  PreferenceSettings,
  ProfileSettings,
  SettingsResponse,
  TaxSettings,
} from '../types/settings.types';

const APPLICATION_VERSION = '1.0.0';
const API_VERSION = 'v1';
/** Server start time — a stable stand-in for a real CI build stamp. */
const BUILD_DATE = new Date().toISOString();

/** Loads (or lazily creates) the settings document for a business. */
const getOrCreateSettings = async (
  businessId: string,
): Promise<ISettingsDocument> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const existing = await Settings.findOne({ businessId: businessObjectId }).exec();

  if (existing) {
    return existing;
  }

  try {
    return await Settings.create({ businessId: businessObjectId });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      const raced = await Settings.findOne({ businessId: businessObjectId }).exec();
      if (raced) {
        return raced;
      }
    }

    throw error;
  }
};

const resolveBusinessId = (business: SafeBusiness): string => business.id;

/**
 * Invoice numbering may only change while the sequence is untouched, matching
 * the rules already enforced by the Number Sequence module.
 */
const resolveNumberingLock = async (
  businessId: string,
): Promise<{ canEdit: boolean; reason: string | null }> => {
  const sequence = await ensureSequence(businessId, DEFAULT_DOCUMENT_TYPE);

  const invoiceCount = await Invoice.countDocuments({
    businessId: new Types.ObjectId(businessId),
    isDeleted: { $ne: true },
  }).exec();

  if (invoiceCount > 0) {
    return {
      canEdit: false,
      reason: 'Invoice numbering cannot be changed after invoices have been created.',
    };
  }

  if (sequence.currentNumber >= sequence.startingNumber) {
    return {
      canEdit: false,
      reason: 'Invoice numbering cannot be changed after numbers have been issued.',
    };
  }

  return { canEdit: true, reason: null };
};

const buildInvoiceSettings = async (
  businessId: string,
  business: SafeBusiness,
  settings: ISettingsDocument,
): Promise<InvoiceSettings> => {
  const sequence = await ensureSequence(businessId, DEFAULT_DOCUMENT_TYPE);
  const lock = await resolveNumberingLock(businessId);

  return {
    prefix: sequence.prefix,
    startingNumber: sequence.startingNumber,
    paddingLength: sequence.paddingLength,
    separator: sequence.separator,
    dateFormat: business.dateFormat,
    invoiceFooter: settings.invoiceFooter,
    invoiceTerms: settings.invoiceTerms,
    canEditNumbering: lock.canEdit,
    numberingLockReason: lock.reason,
    nextNumberPreview: generateFormattedNumber(
      sequence.prefix,
      sequence.currentNumber + 1,
      sequence.paddingLength,
      sequence.separator,
    ),
  };
};

const buildTaxSettings = (
  business: SafeBusiness,
  settings: ISettingsDocument,
): TaxSettings => ({
  gstEnabled: business.gstEnabled,
  gstNumber: business.gstNumber,
  defaultTaxRate: settings.defaultTaxRate,
  taxMode: settings.taxMode,
  defaultTaxLabel: settings.defaultTaxLabel,
  cgstRate: settings.cgstRate,
  sgstRate: settings.sgstRate,
  igstRate: settings.igstRate,
});

const buildPreferences = (settings: ISettingsDocument): PreferenceSettings => ({
  theme: settings.theme,
  language: settings.language,
  itemsPerPage: settings.itemsPerPage,
  defaultDashboardPeriod: settings.defaultDashboardPeriod,
});

const buildProfile = async (userId: string): Promise<ProfileSettings> => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    role: user.role,
    createdAt: user.createdAt,
  };
};

const buildAbout = (): AboutInfo => ({
  applicationVersion: APPLICATION_VERSION,
  databaseVersion: getDatabaseStatus() === 'connected' ? 'MongoDB (connected)' : 'Unknown',
  apiVersion: API_VERSION,
  buildDate: BUILD_DATE,
  environment: env.NODE_ENV,
  licence: 'Proprietary — internal use licence',
});

export const getSettings = async (userId: string): Promise<SettingsResponse> => {
  const business = await getBusinessForUser(userId);
  const businessId = resolveBusinessId(business);
  const settings = await getOrCreateSettings(businessId);

  return {
    business,
    invoice: await buildInvoiceSettings(businessId, business, settings),
    tax: buildTaxSettings(business, settings),
    preferences: buildPreferences(settings),
    profile: await buildProfile(userId),
    about: buildAbout(),
  };
};

export const updateBusinessSettings = async (
  userId: string,
  input: BusinessSettingsInput,
  logoPath: string | null | undefined,
): Promise<{ business: SafeBusiness }> => {
  const { removeLogo, ...fields } = input;

  const business = await patchBusiness(userId, {
    ...fields,
    businessLogo: logoPath !== undefined ? logoPath : removeLogo ? null : undefined,
  });

  return { business };
};

export const updateInvoiceSettings = async (
  userId: string,
  input: InvoiceSettingsInput,
): Promise<{ business: SafeBusiness; invoice: InvoiceSettings }> => {
  const currentBusiness = await getBusinessForUser(userId);
  const businessId = resolveBusinessId(currentBusiness);

  const wantsNumberingChange =
    input.prefix !== undefined ||
    input.startingNumber !== undefined ||
    input.paddingLength !== undefined ||
    input.separator !== undefined;

  if (wantsNumberingChange) {
    // Delegates to the Number Sequence module, which owns the locking rules
    // and raises a 409 when numbering is no longer editable.
    await updateSequenceSettings(
      businessId,
      {
        prefix: input.prefix,
        startingNumber: input.startingNumber,
        paddingLength: input.paddingLength,
        separator: input.separator,
      },
      DEFAULT_DOCUMENT_TYPE,
    );
  }

  const business =
    input.dateFormat !== undefined
      ? await patchBusiness(userId, { dateFormat: input.dateFormat })
      : currentBusiness;

  const settings = await getOrCreateSettings(businessId);

  if (input.invoiceFooter !== undefined) {
    settings.invoiceFooter = input.invoiceFooter;
  }

  if (input.invoiceTerms !== undefined) {
    settings.invoiceTerms = input.invoiceTerms;
  }

  if (settings.isModified()) {
    await settings.save();
  }

  return {
    business,
    invoice: await buildInvoiceSettings(businessId, business, settings),
  };
};

export const updateTaxSettings = async (
  userId: string,
  input: TaxSettingsInput,
): Promise<{ business: SafeBusiness; tax: TaxSettings }> => {
  const business =
    input.gstEnabled !== undefined
      ? await patchBusiness(userId, { gstEnabled: input.gstEnabled })
      : await getBusinessForUser(userId);

  const settings = await getOrCreateSettings(resolveBusinessId(business));

  const assignable: Array<keyof TaxSettingsInput & keyof ISettingsDocument> = [
    'defaultTaxRate',
    'taxMode',
    'defaultTaxLabel',
    'cgstRate',
    'sgstRate',
    'igstRate',
  ];

  for (const key of assignable) {
    const value = input[key];
    if (value !== undefined) {
      settings.set(key, value);
    }
  }

  if (settings.isModified()) {
    await settings.save();
  }

  return { business, tax: buildTaxSettings(business, settings) };
};

export const updatePreferenceSettings = async (
  userId: string,
  input: PreferenceSettingsInput,
): Promise<{ preferences: PreferenceSettings }> => {
  const business = await getBusinessForUser(userId);
  const settings = await getOrCreateSettings(resolveBusinessId(business));

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      settings.set(key, value);
    }
  }

  if (settings.isModified()) {
    await settings.save();
  }

  return { preferences: buildPreferences(settings) };
};

export const updateProfileSettings = async (
  userId: string,
  input: ProfileSettingsInput,
  avatarPath: string | null | undefined,
): Promise<{ profile: ProfileSettings; user: ReturnType<typeof toSafeUser> }> => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (input.firstName !== undefined) {
    user.firstName = input.firstName;
  }

  if (input.lastName !== undefined) {
    user.lastName = input.lastName;
  }

  if (input.phone !== undefined) {
    user.phone = input.phone;
  }

  if (avatarPath !== undefined) {
    user.avatar = avatarPath;
  } else if (input.removeAvatar) {
    user.avatar = null;
  }

  await user.save();

  const business = user.businessId
    ? await getBusinessForUser(userId).catch(() => null)
    : null;

  return {
    profile: await buildProfile(userId),
    user: toSafeUser(
      user,
      business
        ? { businessName: business.businessName, logo: business.businessLogo }
        : null,
    ),
  };
};

export const changePassword = async (
  userId: string,
  input: ChangePasswordInput,
): Promise<void> => {
  const user = await User.findById(userId).select('+passwordHash').exec();

  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const isCurrentValid = await comparePassword(input.currentPassword, user.passwordHash);

  if (!isCurrentValid) {
    throw new ApiError(400, 'Current password is incorrect', [
      { path: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }

  user.passwordHash = await hashPassword(input.newPassword);
  await user.save();
};
