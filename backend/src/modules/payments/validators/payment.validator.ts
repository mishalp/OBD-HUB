import { z } from 'zod';
import { PAYMENT_METHODS } from '../models/payment.model';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const optionalText = z
  .union([z.string().trim(), z.literal('')])
  .optional()
  .nullable()
  .transform((value) => {
    if (!value || value.trim().length === 0) {
      return null;
    }
    return value.trim();
  });

const paymentDateSchema = z.coerce.date({ error: 'Payment date is required' });

export const createPaymentSchema = z.object({
  invoiceId: z
    .string({ error: 'Invoice is required' })
    .trim()
    .regex(objectIdRegex, 'Invalid invoice id'),
  amount: z.coerce
    .number({ error: 'Amount is required' })
    .positive('Amount must be greater than zero'),
  paymentDate: paymentDateSchema,
  paymentMethod: z.enum(PAYMENT_METHODS, {
    error: 'Payment method is required',
  }),
  referenceNumber: optionalText,
  notes: z
    .union([z.string().trim().max(1000, 'Notes must be at most 1000 characters'), z.literal('')])
    .optional()
    .nullable()
    .transform((value) => {
      if (!value || value.trim().length === 0) {
        return null;
      }
      return value.trim();
    }),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional().default(''),
  paymentMethod: z
    .enum(['all', 'Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'])
    .default('all'),
  customer: z.string().trim().optional().default(''),
  invoice: z.string().trim().optional().default(''),
  fromDate: z.string().trim().optional().default(''),
  toDate: z.string().trim().optional().default(''),
  sortBy: z
    .enum([
      'createdAt',
      'paymentDate',
      'paymentNumber',
      'amount',
      'paymentMethod',
    ])
    .default('paymentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
