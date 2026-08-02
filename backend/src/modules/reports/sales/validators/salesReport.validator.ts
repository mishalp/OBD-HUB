import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const optionalObjectId = z
  .union([z.string().trim().regex(objectIdRegex, 'Invalid id'), z.literal('')])
  .optional()
  .default('')
  .transform((value) => (value && value.length > 0 ? value : ''));

const periodEnum = z
  .enum([
    'today',
    'yesterday',
    'last_7_days',
    'last_30_days',
    'current_month',
    'previous_month',
    'current_year',
    'custom',
  ])
  .default('last_30_days');

const paymentStatusEnum = z
  .enum(['all', 'Unpaid', 'Partially Paid', 'Paid'])
  .default('all');

const invoiceStatusEnum = z
  .enum(['all', 'Unpaid', 'Partially Paid', 'Paid', 'Cancelled'])
  .default('all');

const paymentMethodEnum = z
  .enum(['all', 'Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'])
  .default('all');

const limitEnum = z.coerce
  .number()
  .refine((value) => [5, 10, 20].includes(value), {
    message: 'Limit must be 5, 10, or 20',
  })
  .default(10);

const baseFilters = {
  period: periodEnum,
  fromDate: z.string().trim().optional().default(''),
  toDate: z.string().trim().optional().default(''),
  customer: optionalObjectId,
  item: optionalObjectId,
  paymentStatus: paymentStatusEnum,
  invoiceStatus: invoiceStatusEnum,
  paymentMethod: paymentMethodEnum,
};

const validateDateRange = (
  value: { period: string; fromDate?: string; toDate?: string },
  ctx: z.RefinementCtx,
): void => {
  if (value.period === 'custom') {
    const from = value.fromDate ? new Date(value.fromDate) : null;
    const to = value.toDate ? new Date(value.toDate) : null;

    if (from && to && from.getTime() > to.getTime()) {
      ctx.addIssue({
        code: 'custom',
        path: ['fromDate'],
        message: 'From date cannot be after to date',
      });
    }
  }
};

export const salesSummaryQuerySchema = z
  .object({ ...baseFilters })
  .superRefine(validateDateRange);

export const salesTrendQuerySchema = z
  .object({
    ...baseFilters,
    granularity: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('daily'),
  })
  .superRefine(validateDateRange);

export const salesTopItemsQuerySchema = z
  .object({
    ...baseFilters,
    limit: limitEnum,
  })
  .superRefine(validateDateRange);

export const salesTopCustomersQuerySchema = z
  .object({
    ...baseFilters,
    limit: limitEnum,
  })
  .superRefine(validateDateRange);

export type SalesSummaryQuery = z.infer<typeof salesSummaryQuerySchema>;
export type SalesTrendQuery = z.infer<typeof salesTrendQuerySchema>;
export type SalesTopItemsQuery = z.infer<typeof salesTopItemsQuerySchema>;
export type SalesTopCustomersQuery = z.infer<typeof salesTopCustomersQuerySchema>;
