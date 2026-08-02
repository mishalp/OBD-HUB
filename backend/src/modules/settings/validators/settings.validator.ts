import { z } from 'zod';
import {
  DASHBOARD_PERIODS,
  ITEMS_PER_PAGE_OPTIONS,
  LANGUAGES,
  TAX_MODES,
  THEMES,
} from '../models/settings.model';

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
const gstRegex = /^[0-9A-Z]{15}$/;

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null));

const coercedBoolean = z
  .union([z.boolean(), z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
  .transform((value) => value === true || value === 'true' || value === '1');

/** Section 1 — Business Profile. Every field is optional (partial updates). */
export const businessSettingsSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must be at most 100 characters')
    .optional(),
  businessType: z.string().trim().min(2, 'Business type is required').optional(),
  ownerName: z.string().trim().min(2, 'Owner name is required').optional(),
  email: z.string().trim().email('Enter a valid email address').optional(),
  phone: z.string().trim().regex(phoneRegex, 'Enter a valid phone number').optional(),
  addressLine1: z.string().trim().min(3, 'Address line 1 is required').optional(),
  addressLine2: optionalText(200, 'Address line 2 is too long'),
  city: z.string().trim().min(2, 'City is required').optional(),
  state: z.string().trim().min(2, 'State is required').optional(),
  country: z.string().trim().min(2, 'Country is required').optional(),
  postalCode: z.string().trim().min(3, 'Postal code is required').optional(),
  gstNumber: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value.toUpperCase() : null))
    .refine((value) => value === null || gstRegex.test(value), {
      message: 'GST number must be 15 alphanumeric characters',
    }),
  timezone: z.string().trim().min(1, 'Timezone is required').optional(),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter code')
    .transform((value) => value.toUpperCase())
    .optional(),
  currencySymbol: z
    .string()
    .trim()
    .min(1, 'Currency symbol is required')
    .max(5, 'Currency symbol is too long')
    .optional(),
  /** Set to 'true' by the client to clear an existing logo. */
  removeLogo: coercedBoolean.optional(),
});

/** Section 2 — Invoice Settings. */
export const invoiceSettingsSchema = z.object({
  prefix: z
    .string()
    .trim()
    .min(1, 'Invoice prefix is required')
    .max(10, 'Invoice prefix must be at most 10 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Invoice prefix must be alphanumeric')
    .transform((value) => value.toUpperCase())
    .optional(),
  startingNumber: z.coerce
    .number()
    .int('Starting number must be a whole number')
    .min(1, 'Starting number must be at least 1')
    .optional(),
  paddingLength: z.coerce
    .number()
    .int('Padding length must be a whole number')
    .min(1, 'Padding length must be at least 1')
    .max(10, 'Padding length must be at most 10')
    .optional(),
  separator: z
    .string()
    .max(3, 'Separator must be at most 3 characters')
    .optional(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  invoiceFooter: optionalText(2000, 'Invoice footer is too long'),
  invoiceTerms: optionalText(5000, 'Invoice terms are too long'),
});

/** Section 3 — Tax Settings. */
const ratePercent = (label: string) =>
  z.coerce
    .number()
    .min(0, `${label} cannot be negative`)
    .max(100, `${label} cannot exceed 100`)
    .optional();

export const taxSettingsSchema = z.object({
  gstEnabled: coercedBoolean.optional(),
  defaultTaxRate: ratePercent('Default tax rate'),
  taxMode: z.enum(TAX_MODES).optional(),
  defaultTaxLabel: z
    .string()
    .trim()
    .min(1, 'Tax label is required')
    .max(30, 'Tax label must be at most 30 characters')
    .optional(),
  cgstRate: ratePercent('CGST rate'),
  sgstRate: ratePercent('SGST rate'),
  igstRate: ratePercent('IGST rate'),
});

/** Section 4 — Application Preferences. */
export const preferenceSettingsSchema = z.object({
  theme: z.enum(THEMES).optional(),
  language: z.enum(LANGUAGES).optional(),
  itemsPerPage: z.coerce
    .number()
    .int()
    .refine(
      (value) => (ITEMS_PER_PAGE_OPTIONS as readonly number[]).includes(value),
      { message: 'Items per page must be 10, 25, 50, or 100' },
    )
    .optional(),
  defaultDashboardPeriod: z.enum(DASHBOARD_PERIODS).optional(),
});

/** Section 5 — User Profile. */
export const profileSettingsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || phoneRegex.test(value), {
      message: 'Enter a valid phone number',
    }),
  removeAvatar: coercedBoolean.optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(72, 'New password must be at most 72 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }

    if (value.newPassword === value.currentPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'New password must be different from the current password',
      });
    }
  });

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
export type InvoiceSettingsInput = z.infer<typeof invoiceSettingsSchema>;
export type TaxSettingsInput = z.infer<typeof taxSettingsSchema>;
export type PreferenceSettingsInput = z.infer<typeof preferenceSettingsSchema>;
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
