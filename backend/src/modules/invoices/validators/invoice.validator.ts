import { z } from 'zod';
import { PAYMENT_METHODS } from '../../payments/models/payment.model';

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

const objectIdSchema = z
  .string({ error: 'Invalid id' })
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const createInvoiceItemSchema = z.object({
  itemId: objectIdSchema,
  /**
   * Optional so service lines may omit quantity (server forces 1).
   * Products still require quantity > 0 after catalog lookup.
   */
  quantity: z.coerce
    .number({ error: 'Quantity is invalid' })
    .gt(0, 'Quantity must be greater than 0')
    .optional()
    .nullable()
    .transform((value) => (value == null ? undefined : value)),
  /**
   * Optional for services (catalog unit is used when omitted).
   * Products still require a non-empty unit after catalog lookup.
   */
  unit: z
    .string({ error: 'Unit is invalid' })
    .trim()
    .max(30, 'Unit must be at most 30 characters')
    .optional()
    .nullable()
    .transform((value) => {
      if (!value || value.trim().length === 0) {
        return undefined;
      }
      return value.trim();
    }),
  unitPrice: z.coerce
    .number({ error: 'Unit price is required' })
    .min(0, 'Unit price must be greater than or equal to zero'),
  discount: z.coerce
    .number({ error: 'Discount is required' })
    .min(0, 'Discount must be greater than or equal to zero')
    .default(0),
  taxRate: z.coerce
    .number({ error: 'Tax rate is required' })
    .min(0, 'Tax rate must be at least 0')
    .max(100, 'Tax rate must be at most 100'),
});

const invoicePaymentOnCreateSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHODS, {
    error: 'Payment method is required',
  }),
  paymentDate: z.coerce.date({ error: 'Payment date is required' }),
  referenceNumber: optionalText,
  notes: z
    .union([
      z.string().trim().max(1000, 'Notes must be at most 1000 characters'),
      z.literal(''),
    ])
    .optional()
    .nullable()
    .transform((value) => {
      if (!value || value.trim().length === 0) {
        return null;
      }
      return value.trim();
    }),
});

const refineInvoiceItems = (
  value: { items: Array<{ quantity?: number; unitPrice: number; discount: number }> },
  ctx: z.RefinementCtx,
): void => {
  value.items.forEach((item, index) => {
    const quantity = item.quantity ?? 1;
    const gross = quantity * item.unitPrice;
    if (item.discount > gross) {
      ctx.addIssue({
        code: 'custom',
        path: ['items', index, 'discount'],
        message: 'Discount cannot exceed line amount',
      });
    }
  });
};

/**
 * Create accepts Draft | Unpaid | Paid.
 * Paid requires payment details and creates a payment record via PaymentService.
 */
export const createInvoiceSchema = z
  .object({
    customerId: objectIdSchema,
    invoiceDate: z.coerce.date({ error: 'Invoice date is required' }),
    dueDate: z.coerce
      .date()
      .optional()
      .nullable()
      .transform((value) => value ?? null),
    status: z.enum(['Draft', 'Unpaid', 'Paid'], {
      error: 'Status must be Draft, Unpaid, or Paid',
    }),
    notes: optionalText,
    terms: optionalText,
    items: z
      .array(createInvoiceItemSchema)
      .min(1, 'Invoice must contain at least one item'),
    payment: invoicePaymentOnCreateSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.dueDate && value.dueDate < value.invoiceDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['dueDate'],
        message: 'Due date cannot be before invoice date',
      });
    }

    refineInvoiceItems(value, ctx);

    if (value.status === 'Paid') {
      if (!value.payment) {
        ctx.addIssue({
          code: 'custom',
          path: ['payment'],
          message: 'Payment information is required when status is Paid',
        });
        return;
      }
      if (!value.payment.paymentMethod) {
        ctx.addIssue({
          code: 'custom',
          path: ['payment', 'paymentMethod'],
          message: 'Payment method is required',
        });
      }
      if (!value.payment.paymentDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['payment', 'paymentDate'],
          message: 'Payment date is required',
        });
      }
    } else if (value.payment) {
      ctx.addIssue({
        code: 'custom',
        path: ['payment'],
        message: 'Payment information is only allowed when status is Paid',
      });
    }
  });

/**
 * Updates remain Draft | Unpaid only.
 * Partially Paid / Paid are payment-driven and cannot be set manually.
 */
export const updateInvoiceSchema = z
  .object({
    customerId: objectIdSchema,
    invoiceDate: z.coerce.date({ error: 'Invoice date is required' }),
    dueDate: z.coerce
      .date()
      .optional()
      .nullable()
      .transform((value) => value ?? null),
    status: z.enum(['Draft', 'Unpaid'], {
      error: 'Status must be Draft or Unpaid',
    }),
    notes: optionalText,
    terms: optionalText,
    items: z
      .array(createInvoiceItemSchema)
      .min(1, 'Invoice must contain at least one item'),
  })
  .superRefine((value, ctx) => {
    if (value.dueDate && value.dueDate < value.invoiceDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['dueDate'],
        message: 'Due date cannot be before invoice date',
      });
    }

    refineInvoiceItems(value, ctx);
  });

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional().default(''),
  status: z
    .enum(['all', 'Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Cancelled'])
    .default('all'),
  customer: z.string().trim().optional().default(''),
  fromDate: z.string().trim().optional().default(''),
  toDate: z.string().trim().optional().default(''),
  sortBy: z
    .enum(['createdAt', 'invoiceDate', 'dueDate', 'invoiceNumber', 'grandTotal', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type CreateInvoiceItemInput = z.infer<typeof createInvoiceItemSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
