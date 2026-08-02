import { z } from 'zod';

export const listDuesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional().default(''),
  customer: z.string().trim().optional().default(''),
  status: z
    .enum(['all', 'Current', 'Outstanding', 'Overdue', 'Paid'])
    .default('all'),
  fromDate: z.string().trim().optional().default(''),
  toDate: z.string().trim().optional().default(''),
  ageingBucket: z
    .enum(['all', 'Current', '0-30', '31-60', '61-90', '91+'])
    .default('all'),
  sortBy: z
    .enum([
      'invoiceDate',
      'dueDate',
      'invoiceNumber',
      'grandTotal',
      'outstandingBalance',
      'daysOutstanding',
      'dueStatus',
    ])
    .default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const dueInvoiceIdParamSchema = z.object({
  invoiceId: z
    .string({ error: 'Invoice id is required' })
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid invoice id'),
});

export type ListDuesQuery = z.infer<typeof listDuesQuerySchema>;
