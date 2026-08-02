import { z } from 'zod';

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

const nonNegativeNumber = z.coerce
  .number({ error: 'Must be a valid number' })
  .min(0, 'Must be greater than or equal to zero');

const itemFields = {
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name must be at most 150 characters'),
  description: z
    .union([
      z.string().trim().max(2000, 'Description must be at most 2000 characters'),
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
  category: optionalText,
  unit: z
    .string({ error: 'Unit is required' })
    .trim()
    .min(1, 'Unit is required')
    .max(30, 'Unit must be at most 30 characters'),
  price: z.coerce
    .number({ error: 'Price is required' })
    .min(0, 'Price must be greater than or equal to zero'),
  costPrice: z
    .union([
      z.coerce.number().min(0, 'Cost price must be greater than or equal to zero'),
      z.literal(''),
    ])
    .optional()
    .nullable()
    .transform((value) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      return value;
    }),
  taxRate: z.coerce
    .number({ error: 'Tax rate is required' })
    .min(0, 'Tax rate must be at least 0')
    .max(100, 'Tax rate must be at most 100'),
  sku: optionalText.transform((value) => (value ? value.toUpperCase() : null)),
  barcode: optionalText,
  isActive: z.coerce.boolean().default(true),
  trackInventory: z.coerce.boolean().optional().default(true),
  openingStock: nonNegativeNumber.optional().default(0),
  minimumStock: nonNegativeNumber.optional().default(0),
  maximumStock: z
    .union([nonNegativeNumber, z.literal(''), z.null()])
    .optional()
    .nullable()
    .transform((value) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      return value;
    }),
  stockUnit: optionalText,
};

const createItemObjectSchema = z.object({
  ...itemFields,
  type: z.enum(['Product', 'Service'], {
    error: 'Type must be Product or Service',
  }),
});

const updateItemObjectSchema = z.object(itemFields);

const refineInventoryBounds = (
  value: {
    trackInventory?: boolean;
    maximumStock: number | null;
    minimumStock: number;
  },
  ctx: z.RefinementCtx,
): void => {
  if (!value.trackInventory) {
    return;
  }

  if (value.maximumStock !== null && value.maximumStock < value.minimumStock) {
    ctx.addIssue({
      code: 'custom',
      path: ['maximumStock'],
      message: 'Maximum stock cannot be less than minimum stock',
    });
  }
};

export const createItemSchema = createItemObjectSchema.superRefine((value, ctx) => {
  if (value.type === 'Service') {
    return;
  }
  refineInventoryBounds(value, ctx);
});

export const updateItemSchema = updateItemObjectSchema.superRefine((value, ctx) => {
  refineInventoryBounds(value, ctx);
});

export const listItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional().default(''),
  type: z.enum(['all', 'Product', 'Service']).default('all'),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  stockStatus: z
    .enum(['all', 'in_stock', 'out_of_stock', 'low_stock', 'overstock', 'tracked'])
    .default('all'),
  category: z.string().trim().optional().default(''),
  sortBy: z
    .enum([
      'createdAt',
      'name',
      'itemCode',
      'type',
      'category',
      'price',
      'taxRate',
      'currentStock',
    ])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const adjustStockSchema = z.object({
  adjustmentType: z.enum(['Increase', 'Decrease'], {
    error: 'Adjustment type must be Increase or Decrease',
  }),
  quantity: z.coerce
    .number({ error: 'Quantity is required' })
    .gt(0, 'Quantity must be greater than zero'),
  reason: z
    .string({ error: 'Reason is required' })
    .trim()
    .min(2, 'Reason must be at least 2 characters')
    .max(200, 'Reason must be at most 200 characters'),
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

export const stockHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type StockHistoryQuery = z.infer<typeof stockHistoryQuerySchema>;
