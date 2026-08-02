import { Types } from 'mongoose';
import { ApiError } from '../../../utils/ApiError';
import { Business } from '../../business/models/business.model';
import { Invoice } from '../../invoices/models/invoice.model';
import {
  INumberSequenceDocument,
  NumberSequence,
} from '../models/numberSequence.model';
import { UpdateInvoiceNumberSettingsInput } from '../validators/numberSequence.validator';
import {
  DEFAULT_DOCUMENT_TYPE,
  DEFAULT_PADDING_LENGTH,
  DEFAULT_SEPARATOR,
  DocumentType,
} from '../utils/documentTypes';
import { formatDocumentNumber } from '../utils/formatNumber';
import {
  GeneratedNumberResult,
  SafeNumberSequence,
} from '../types/numberSequence.types';

const toSafeSequence = (sequence: INumberSequenceDocument): SafeNumberSequence => ({
  id: sequence._id.toString(),
  businessId: sequence.businessId.toString(),
  documentType: sequence.documentType,
  prefix: sequence.prefix,
  currentNumber: sequence.currentNumber,
  startingNumber: sequence.startingNumber,
  paddingLength: sequence.paddingLength,
  separator: sequence.separator,
  isActive: sequence.isActive,
  createdAt: sequence.createdAt,
  updatedAt: sequence.updatedAt,
});

const toGeneratedResult = (
  sequence: Pick<
    INumberSequenceDocument,
    'prefix' | 'paddingLength' | 'separator' | 'documentType'
  >,
  numericValue: number,
): GeneratedNumberResult => ({
  documentNumber: formatDocumentNumber({
    prefix: sequence.prefix,
    numericValue,
    paddingLength: sequence.paddingLength,
    separator: sequence.separator,
  }),
  numericValue,
  prefix: sequence.prefix,
  paddingLength: sequence.paddingLength,
  separator: sequence.separator,
  documentType: sequence.documentType,
});

export const generateFormattedNumber = (
  prefix: string,
  numericValue: number,
  paddingLength: number = DEFAULT_PADDING_LENGTH,
  separator: string = DEFAULT_SEPARATOR,
): string =>
  formatDocumentNumber({
    prefix,
    numericValue,
    paddingLength,
    separator,
  });

/**
 * Creates a NumberSequence for a business + document type.
 * currentNumber is set to startingNumber - 1 so the first reserve yields startingNumber.
 */
export const initializeSequence = async (params: {
  businessId: string;
  documentType?: DocumentType;
  prefix: string;
  startingNumber: number;
  paddingLength?: number;
  separator?: string;
}): Promise<SafeNumberSequence> => {
  const documentType = params.documentType ?? DEFAULT_DOCUMENT_TYPE;
  const startingNumber = Math.max(1, Math.floor(params.startingNumber));
  const paddingLength = params.paddingLength ?? DEFAULT_PADDING_LENGTH;
  const separator = params.separator ?? DEFAULT_SEPARATOR;

  try {
    const sequence = await NumberSequence.create({
      businessId: new Types.ObjectId(params.businessId),
      documentType,
      prefix: params.prefix.trim().toUpperCase(),
      startingNumber,
      currentNumber: startingNumber - 1,
      paddingLength,
      separator,
      isActive: true,
    });

    return toSafeSequence(sequence);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      const existing = await NumberSequence.findOne({
        businessId: new Types.ObjectId(params.businessId),
        documentType,
      }).exec();

      if (existing) {
        return toSafeSequence(existing);
      }

      throw new ApiError(409, 'Number sequence already exists for this document type');
    }

    throw error;
  }
};

/**
 * Ensures a sequence exists. For existing businesses created before this module,
 * migrates from Business.invoicePrefix / nextInvoiceNumber / invoiceStartingNumber.
 */
export const ensureSequence = async (
  businessId: string,
  documentType: DocumentType = DEFAULT_DOCUMENT_TYPE,
): Promise<INumberSequenceDocument> => {
  const businessObjectId = new Types.ObjectId(businessId);

  const existing = await NumberSequence.findOne({
    businessId: businessObjectId,
    documentType,
  }).exec();

  if (existing) {
    if (!existing.isActive) {
      throw new ApiError(409, 'Number sequence is inactive');
    }
    return existing;
  }

  const business = await Business.findById(businessId).exec();

  if (!business) {
    throw new ApiError(404, 'Business not found');
  }

  if (documentType !== DEFAULT_DOCUMENT_TYPE && documentType !== 'payment') {
    throw new ApiError(404, 'Number sequence not found');
  }

  // Auto-create payment sequences for existing businesses.
  if (documentType === 'payment') {
    try {
      return await NumberSequence.create({
        businessId: businessObjectId,
        documentType: 'payment',
        prefix: 'PAY',
        startingNumber: 1,
        currentNumber: 0,
        paddingLength: DEFAULT_PADDING_LENGTH,
        separator: DEFAULT_SEPARATOR,
        isActive: true,
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        const raced = await NumberSequence.findOne({
          businessId: businessObjectId,
          documentType,
        }).exec();

        if (raced) {
          return raced;
        }
      }

      throw error;
    }
  }

  // Migrate from legacy Business.nextInvoiceNumber when present.
  const nextNumber = business.nextInvoiceNumber ?? business.invoiceStartingNumber;
  const startingNumber = business.invoiceStartingNumber;
  const currentNumber = Math.max(nextNumber - 1, startingNumber - 1);

  try {
    return await NumberSequence.create({
      businessId: businessObjectId,
      documentType,
      prefix: business.invoicePrefix,
      startingNumber,
      currentNumber,
      paddingLength: DEFAULT_PADDING_LENGTH,
      separator: DEFAULT_SEPARATOR,
      isActive: true,
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      const raced = await NumberSequence.findOne({
        businessId: businessObjectId,
        documentType,
      }).exec();

      if (raced) {
        return raced;
      }
    }

    throw error;
  }
};

/** Peek at the next number without incrementing the sequence. */
export const peekNextNumber = async (
  businessId: string,
  documentType: DocumentType = DEFAULT_DOCUMENT_TYPE,
): Promise<GeneratedNumberResult> => {
  const sequence = await ensureSequence(businessId, documentType);
  const numericValue = sequence.currentNumber + 1;
  return toGeneratedResult(sequence, numericValue);
};

/**
 * Atomically reserves the next number using a single $inc update.
 * Two concurrent callers can never receive the same numericValue.
 */
export const reserveNextNumber = async (
  businessId: string,
  documentType: DocumentType = DEFAULT_DOCUMENT_TYPE,
): Promise<GeneratedNumberResult> => {
  await ensureSequence(businessId, documentType);

  const updated = await NumberSequence.findOneAndUpdate(
    {
      businessId: new Types.ObjectId(businessId),
      documentType,
      isActive: true,
    },
    { $inc: { currentNumber: 1 } },
    { new: true },
  ).exec();

  if (!updated) {
    throw new ApiError(404, 'Number sequence not found');
  }

  // Keep Business.nextInvoiceNumber in sync for legacy readers during transition.
  if (documentType === DEFAULT_DOCUMENT_TYPE) {
    await Business.findByIdAndUpdate(businessId, {
      nextInvoiceNumber: updated.currentNumber + 1,
      invoicePrefix: updated.prefix,
    }).exec();
  }

  return toGeneratedResult(updated, updated.currentNumber);
};

/** Alias used by invoice creation. */
export const getNextNumber = reserveNextNumber;

export const updatePrefix = async (
  businessId: string,
  prefix: string,
  documentType: DocumentType = DEFAULT_DOCUMENT_TYPE,
): Promise<SafeNumberSequence> => {
  return updateSequenceSettings(businessId, { prefix }, documentType);
};

export const updatePadding = async (
  businessId: string,
  paddingLength: number,
  documentType: DocumentType = DEFAULT_DOCUMENT_TYPE,
): Promise<SafeNumberSequence> => {
  return updateSequenceSettings(businessId, { paddingLength }, documentType);
};

/**
 * Updates formatting settings. Blocked once any invoices exist for the business
 * so historical numbers remain consistent with the configured format.
 */
export const updateSequenceSettings = async (
  businessId: string,
  input: Partial<UpdateInvoiceNumberSettingsInput> & {
    prefix?: string;
    paddingLength?: number;
    separator?: string;
    startingNumber?: number;
  },
  documentType: DocumentType = DEFAULT_DOCUMENT_TYPE,
): Promise<SafeNumberSequence> => {
  const sequence = await ensureSequence(businessId, documentType);

  if (documentType === DEFAULT_DOCUMENT_TYPE) {
    const invoiceCount = await Invoice.countDocuments({
      businessId: new Types.ObjectId(businessId),
      isDeleted: { $ne: true },
    }).exec();

    if (invoiceCount > 0) {
      throw new ApiError(
        409,
        'Invoice number settings cannot be changed after invoices have been created',
      );
    }
  }

  if (sequence.currentNumber >= sequence.startingNumber) {
    throw new ApiError(
      409,
      'Sequence settings cannot be changed after numbers have been issued',
    );
  }

  if (input.prefix !== undefined) {
    sequence.prefix = input.prefix.trim().toUpperCase();
  }

  if (input.paddingLength !== undefined) {
    sequence.paddingLength = input.paddingLength;
  }

  if (input.separator !== undefined) {
    sequence.separator = input.separator;
  }

  if (input.startingNumber !== undefined) {
    sequence.startingNumber = input.startingNumber;
    sequence.currentNumber = input.startingNumber - 1;
  }

  await sequence.save();

  if (documentType === DEFAULT_DOCUMENT_TYPE) {
    await Business.findByIdAndUpdate(businessId, {
      invoicePrefix: sequence.prefix,
      invoiceStartingNumber: sequence.startingNumber,
      nextInvoiceNumber: sequence.currentNumber + 1,
    }).exec();
  }

  return toSafeSequence(sequence);
};

/**
 * Future-ready reset. Only allowed when no documents of this type exist.
 * Resets currentNumber to startingNumber - 1.
 */
export const resetSequence = async (
  businessId: string,
  documentType: DocumentType = DEFAULT_DOCUMENT_TYPE,
): Promise<SafeNumberSequence> => {
  const sequence = await ensureSequence(businessId, documentType);

  if (documentType === DEFAULT_DOCUMENT_TYPE) {
    const invoiceCount = await Invoice.countDocuments({
      businessId: new Types.ObjectId(businessId),
      isDeleted: { $ne: true },
    }).exec();

    if (invoiceCount > 0) {
      throw new ApiError(409, 'Cannot reset sequence after invoices have been created');
    }
  }

  sequence.currentNumber = sequence.startingNumber - 1;
  await sequence.save();

  return toSafeSequence(sequence);
};
