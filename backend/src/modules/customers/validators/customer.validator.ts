import { z } from 'zod';

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

const optionalEmail = z
  .union([z.string().trim().email('Invalid email'), z.literal('')])
  .optional()
  .nullable()
  .transform((value) => {
    if (!value || value.trim().length === 0) {
      return null;
    }
    return value.trim().toLowerCase();
  });

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

const optionalPhone = z
  .union([z.string().trim(), z.literal('')])
  .optional()
  .nullable()
  .transform((value) => {
    if (!value || value.trim().length === 0) {
      return null;
    }
    return value.trim();
  })
  .refine((value) => value === null || phoneRegex.test(value), {
    message: 'Enter a valid phone number',
  });

export const createCustomerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  phone: optionalPhone,
  email: optionalEmail,
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  state: optionalText,
  country: optionalText,
  postalCode: optionalText,
  gstNumber: optionalText.transform((value) => (value ? value.toUpperCase() : null)),
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
  avatar: optionalText,
  isActive: z.coerce.boolean().default(true),
});

export const updateCustomerSchema = createCustomerSchema;

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional().default(''),
  sortBy: z
    .enum(['createdAt', 'name', 'phone', 'email', 'customerCode', 'city'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
