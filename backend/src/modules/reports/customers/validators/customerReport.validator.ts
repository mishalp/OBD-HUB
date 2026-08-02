import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

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

const periodFilters = {
  period: periodEnum,
  fromDate: z.string().trim().optional().default(''),
  toDate: z.string().trim().optional().default(''),
};

export const customerSummaryQuerySchema = z
  .object({ ...periodFilters })
  .superRefine(validateDateRange);

export const customerListQuerySchema = z
  .object({
    ...periodFilters,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional().default(''),
    status: z.enum(['all', 'active', 'inactive']).default('all'),
    customerType: z
      .enum(['all', 'new', 'active', 'inactive', 'repeat'])
      .default('all'),
    outstandingOnly: z
      .union([z.literal('true'), z.literal('false'), z.boolean()])
      .optional()
      .default(false)
      .transform((value) => value === true || value === 'true'),
    minRevenue: z.coerce.number().min(0).optional(),
    maxRevenue: z.coerce.number().min(0).optional(),
    sortBy: z
      .enum([
        'name',
        'revenue',
        'outstandingAmount',
        'invoiceCount',
        'lastPurchaseDate',
        'createdAt',
      ])
      .default('revenue'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .superRefine(validateDateRange)
  .superRefine((value, ctx) => {
    if (
      value.minRevenue !== undefined &&
      value.maxRevenue !== undefined &&
      value.minRevenue > value.maxRevenue
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['minRevenue'],
        message: 'Minimum revenue cannot exceed maximum revenue',
      });
    }
  });

export const customerTopQuerySchema = z
  .object({
    ...periodFilters,
    limit: z.coerce
      .number()
      .refine((value) => [5, 10, 20].includes(value), {
        message: 'Limit must be 5, 10, or 20',
      })
      .default(10),
  })
  .superRefine(validateDateRange);

export const customerIdParamSchema = z.object({
  customerId: z.string().trim().regex(objectIdRegex, 'Invalid customer id'),
});

export const customerDetailQuerySchema = z
  .object({ ...periodFilters })
  .superRefine(validateDateRange);

export type CustomerSummaryQuery = z.infer<typeof customerSummaryQuerySchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
export type CustomerTopQuery = z.infer<typeof customerTopQuerySchema>;
export type CustomerDetailQuery = z.infer<typeof customerDetailQuerySchema>;
