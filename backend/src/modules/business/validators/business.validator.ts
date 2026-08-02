import { z } from 'zod';

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

const baseBusinessSchema = z.object({
  businessName: z
    .string({ error: 'Business name is required' })
    .trim()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must be at most 100 characters'),
  businessType: z
    .string({ error: 'Business type is required' })
    .trim()
    .min(2, 'Business type is required'),
  ownerName: z
    .string({ error: 'Owner name is required' })
    .trim()
    .min(2, 'Owner name is required'),
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .email('Invalid email'),
  phone: z
    .string({ error: 'Phone is required' })
    .trim()
    .regex(phoneRegex, 'Enter a valid phone number'),
  addressLine1: z
    .string({ error: 'Address line 1 is required' })
    .trim()
    .min(3, 'Address line 1 is required'),
  addressLine2: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),
  city: z
    .string({ error: 'City is required' })
    .trim()
    .min(2, 'City is required'),
  state: z
    .string({ error: 'State is required' })
    .trim()
    .min(2, 'State is required'),
  country: z
    .string({ error: 'Country is required' })
    .trim()
    .min(2, 'Country is required'),
  postalCode: z
    .string({ error: 'Postal code is required' })
    .trim()
    .min(3, 'Postal code is required'),
  gstEnabled: z.coerce.boolean(),
  gstNumber: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value.toUpperCase() : null)),
  invoicePrefix: z
    .string({ error: 'Invoice prefix is required' })
    .trim()
    .min(1, 'Invoice prefix is required')
    .max(10, 'Invoice prefix must be at most 10 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Invoice prefix must be alphanumeric')
    .transform((value) => value.toUpperCase()),
  invoiceStartingNumber: z.coerce
    .number({ error: 'Invoice starting number is required' })
    .int('Invoice starting number must be an integer')
    .min(1, 'Invoice starting number must be at least 1'),
  currency: z
    .string()
    .trim()
    .min(3, 'Currency is required')
    .max(3, 'Currency must be a 3-letter code')
    .transform((value) => value.toUpperCase())
    .default('INR'),
  currencySymbol: z
    .string()
    .trim()
    .min(1, 'Currency symbol is required')
    .default('₹'),
  dateFormat: z
    .enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
    .default('DD/MM/YYYY'),
  timezone: z
    .string({ error: 'Timezone is required' })
    .trim()
    .min(1, 'Timezone is required'),
  businessLogo: z.string().trim().optional().nullable(),
});

export const businessSchema = baseBusinessSchema.superRefine((data, ctx) => {
  if (data.gstEnabled && (!data.gstNumber || data.gstNumber.length < 5)) {
    ctx.addIssue({
      code: 'custom',
      path: ['gstNumber'],
      message: 'GST number is required when GST is enabled',
    });
  }
});

export type BusinessInput = z.infer<typeof businessSchema>;

export const parseBusinessPayload = (body: unknown): BusinessInput => {
  if (typeof body !== 'object' || body === null) {
    return businessSchema.parse(body);
  }

  const raw = body as Record<string, unknown>;

  return businessSchema.parse({
    ...raw,
    gstEnabled:
      raw.gstEnabled === true ||
      raw.gstEnabled === 'true' ||
      raw.gstEnabled === '1' ||
      raw.gstEnabled === 1,
  });
};
