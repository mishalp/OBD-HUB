import { z } from 'zod';
import {
  DEFAULT_DOCUMENT_TYPE,
  DOCUMENT_TYPES,
  MAX_PADDING_LENGTH,
  MAX_PREFIX_LENGTH,
  MIN_PADDING_LENGTH,
} from '../utils/documentTypes';

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);

export const updateInvoiceNumberSettingsSchema = z.object({
  prefix: z
    .string({ error: 'Prefix is required' })
    .trim()
    .min(1, 'Prefix is required')
    .max(MAX_PREFIX_LENGTH, `Prefix must be at most ${MAX_PREFIX_LENGTH} characters`)
    .regex(/^[A-Za-z0-9]+$/, 'Prefix must be alphanumeric')
    .transform((value) => value.toUpperCase()),
  paddingLength: z.coerce
    .number({ error: 'Padding length is required' })
    .int('Padding length must be an integer')
    .min(MIN_PADDING_LENGTH, `Padding length must be at least ${MIN_PADDING_LENGTH}`)
    .max(MAX_PADDING_LENGTH, `Padding length must be at most ${MAX_PADDING_LENGTH}`),
  separator: z
    .string({ error: 'Separator is required' })
    .length(1, 'Separator must be a single character'),
  startingNumber: z.coerce
    .number({ error: 'Starting number is required' })
    .int('Starting number must be an integer')
    .gt(0, 'Starting number must be greater than zero')
    .optional(),
});

export const invoiceNumberQuerySchema = z.object({
  documentType: documentTypeSchema.default(DEFAULT_DOCUMENT_TYPE),
});

export type UpdateInvoiceNumberSettingsInput = z.infer<
  typeof updateInvoiceNumberSettingsSchema
>;
