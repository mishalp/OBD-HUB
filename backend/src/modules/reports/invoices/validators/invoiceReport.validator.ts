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

const invoiceStatusEnum = z
  .enum(['all', 'Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Cancelled'])
  .default('all');

const paymentStatusEnum = z
  .enum(['all', 'Draft', 'Unpaid', 'Partially Paid', 'Paid'])
  .default('all');

const booleanFlag = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .optional()
  .default(false)
  .transform((value) => value === true || value === 'true');

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

const validateAmountRange = (
  value: { minAmount?: number; maxAmount?: number },
  ctx: z.RefinementCtx,
): void => {
  if (
    value.minAmount !== undefined &&
    value.maxAmount !== undefined &&
    value.minAmount > value.maxAmount
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['minAmount'],
      message: 'Minimum amount cannot exceed maximum amount',
    });
  }
};

const baseFilters = {
  period: periodEnum,
  fromDate: z.string().trim().optional().default(''),
  toDate: z.string().trim().optional().default(''),
  status: invoiceStatusEnum,
  paymentStatus: paymentStatusEnum,
  customer: optionalObjectId,
  outstandingOnly: booleanFlag,
  overdueOnly: booleanFlag,
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  search: z.string().trim().optional().default(''),
};

export const invoiceSummaryQuerySchema = z
  .object({ ...baseFilters })
  .superRefine(validateDateRange)
  .superRefine(validateAmountRange);

export const invoiceStatusQuerySchema = z
  .object({ ...baseFilters })
  .superRefine(validateDateRange)
  .superRefine(validateAmountRange);

export const invoiceTrendQuerySchema = z
  .object({
    ...baseFilters,
    granularity: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('daily'),
  })
  .superRefine(validateDateRange)
  .superRefine(validateAmountRange);

export const invoiceListQuerySchema = z
  .object({
    ...baseFilters,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z
      .enum([
        'invoiceDate',
        'dueDate',
        'invoiceNumber',
        'grandTotal',
        'collectedAmount',
        'outstandingAmount',
        'createdAt',
      ])
      .default('invoiceDate'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .superRefine(validateDateRange)
  .superRefine(validateAmountRange);

export type InvoiceSummaryQuery = z.infer<typeof invoiceSummaryQuerySchema>;
export type InvoiceStatusQuery = z.infer<typeof invoiceStatusQuerySchema>;
export type InvoiceTrendQuery = z.infer<typeof invoiceTrendQuerySchema>;
export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;
