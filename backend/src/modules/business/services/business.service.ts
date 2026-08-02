import { Types } from 'mongoose';
import { ApiError } from '../../../utils/ApiError';
import { Business, IBusiness } from '../models/business.model';
import { BusinessInput } from '../validators/business.validator';
import { BusinessSetupResponse, SafeBusiness } from '../types/business.types';
import { toSafeBusiness } from './business.mapper';
import { findUserById } from '../../auth/repositories/user.repository';
import { initializeSequence } from '../../number-sequence/services/numberSequence.service';
import { DEFAULT_DOCUMENT_TYPE } from '../../number-sequence/utils/documentTypes';

const buildUserBusinessSummary = (
  businessId: string,
  businessName: string,
  logo: string | null,
) => ({
  businessId,
  businessSetupCompleted: true,
  businessName,
  logo,
});

export const createBusiness = async (
  userId: string,
  input: BusinessInput,
  logoPath: string | null,
): Promise<BusinessSetupResponse> => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (user.businessSetupCompleted || user.businessId) {
    throw new ApiError(409, 'Business profile already completed');
  }

  const existing = await Business.findOne({ ownerId: user._id }).exec();

  if (existing) {
    throw new ApiError(409, 'Business profile already completed');
  }

  const business = await Business.create({
    ownerId: user._id,
    businessName: input.businessName,
    businessLogo: logoPath,
    businessType: input.businessType,
    ownerName: input.ownerName,
    email: input.email,
    phone: input.phone,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 ?? null,
    city: input.city,
    state: input.state,
    country: input.country,
    postalCode: input.postalCode,
    gstEnabled: input.gstEnabled,
    gstNumber: input.gstEnabled ? input.gstNumber : null,
    invoicePrefix: input.invoicePrefix,
    invoiceStartingNumber: input.invoiceStartingNumber,
    nextInvoiceNumber: input.invoiceStartingNumber,
    currency: input.currency,
    currencySymbol: input.currencySymbol,
    dateFormat: input.dateFormat,
    timezone: input.timezone,
  });

  user.businessId = business._id;
  user.businessSetupCompleted = true;
  await user.save();

  await initializeSequence({
    businessId: business._id.toString(),
    documentType: DEFAULT_DOCUMENT_TYPE,
    prefix: input.invoicePrefix,
    startingNumber: input.invoiceStartingNumber,
  });

  await initializeSequence({
    businessId: business._id.toString(),
    documentType: 'payment',
    prefix: 'PAY',
    startingNumber: 1,
  });

  const safeBusiness = toSafeBusiness(business);

  return {
    business: safeBusiness,
    user: buildUserBusinessSummary(
      safeBusiness.id,
      safeBusiness.businessName,
      safeBusiness.businessLogo,
    ),
  };
};

export const getBusinessForUser = async (userId: string): Promise<SafeBusiness> => {
  const user = await findUserById(userId);

  if (!user?.businessId) {
    throw new ApiError(404, 'Business profile not found');
  }

  const business = await Business.findById(user.businessId).exec();

  if (!business) {
    throw new ApiError(404, 'Business profile not found');
  }

  return toSafeBusiness(business);
};

export const updateBusiness = async (
  userId: string,
  input: BusinessInput,
  logoPath: string | null | undefined,
): Promise<SafeBusiness> => {
  const user = await findUserById(userId);

  if (!user?.businessId) {
    throw new ApiError(404, 'Business profile not found');
  }

  const business = await Business.findById(user.businessId).exec();

  if (!business) {
    throw new ApiError(404, 'Business profile not found');
  }

  business.businessName = input.businessName;
  business.businessType = input.businessType;
  business.ownerName = input.ownerName;
  business.email = input.email;
  business.phone = input.phone;
  business.addressLine1 = input.addressLine1;
  business.addressLine2 = input.addressLine2 ?? null;
  business.city = input.city;
  business.state = input.state;
  business.country = input.country;
  business.postalCode = input.postalCode;
  business.gstEnabled = input.gstEnabled;
  business.gstNumber = input.gstEnabled ? input.gstNumber : null;
  business.invoicePrefix = input.invoicePrefix;
  business.invoiceStartingNumber = input.invoiceStartingNumber;
  business.currency = input.currency;
  business.currencySymbol = input.currencySymbol;
  business.dateFormat = input.dateFormat;
  business.timezone = input.timezone;

  if (logoPath !== undefined) {
    business.businessLogo = logoPath;
  }

  await business.save();

  return toSafeBusiness(business);
};

/** Profile fields a settings-style partial update is allowed to touch. */
export type BusinessProfilePatch = Partial<
  Pick<
    IBusiness,
    | 'businessName'
    | 'businessType'
    | 'ownerName'
    | 'email'
    | 'phone'
    | 'addressLine1'
    | 'addressLine2'
    | 'city'
    | 'state'
    | 'country'
    | 'postalCode'
    | 'gstEnabled'
    | 'gstNumber'
    | 'currency'
    | 'currencySymbol'
    | 'dateFormat'
    | 'timezone'
    | 'businessLogo'
  >
>;

/**
 * Applies a partial update to the authenticated user's business. Only keys
 * explicitly present in the patch are written, so callers can update a single
 * settings section without clobbering unrelated fields.
 */
export const patchBusiness = async (
  userId: string,
  patch: BusinessProfilePatch,
): Promise<SafeBusiness> => {
  const user = await findUserById(userId);

  if (!user?.businessId) {
    throw new ApiError(404, 'Business profile not found');
  }

  const business = await Business.findById(user.businessId).exec();

  if (!business) {
    throw new ApiError(404, 'Business profile not found');
  }

  if (patch.email && patch.email.toLowerCase() !== business.email) {
    const duplicate = await Business.exists({
      _id: { $ne: business._id },
      email: patch.email.toLowerCase(),
    }).exec();

    if (duplicate) {
      throw new ApiError(409, 'This email is already used by another business', [
        { path: 'email', message: 'This email is already used by another business' },
      ]);
    }
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      business.set(key, value);
    }
  }

  // GST cannot be enabled without a number to print on invoices.
  if (business.gstEnabled && !business.gstNumber) {
    throw new ApiError(400, 'GST number is required when GST is enabled', [
      { path: 'gstNumber', message: 'GST number is required when GST is enabled' },
    ]);
  }

  if (!business.gstEnabled) {
    business.gstNumber = null;
  }

  await business.save();

  return toSafeBusiness(business);
};

export const getBusinessSummaryById = async (
  businessId: Types.ObjectId | string | null | undefined,
): Promise<{ businessName: string; logo: string | null } | null> => {
  if (!businessId) {
    return null;
  }

  const business = await Business.findById(businessId)
    .select('businessName businessLogo')
    .exec();

  if (!business) {
    return null;
  }

  return {
    businessName: business.businessName,
    logo: business.businessLogo,
  };
};
