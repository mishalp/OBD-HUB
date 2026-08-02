import type { Business } from '@/lib/types/business';

export const SETTINGS_SECTIONS = [
  'business',
  'invoice',
  'tax',
  'preferences',
  'profile',
  'about',
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number];

export const SETTINGS_SECTION_LABELS: Record<SettingsSectionId, string> = {
  business: 'Business Profile',
  invoice: 'Invoice Settings',
  tax: 'Tax Settings',
  preferences: 'Application Preferences',
  profile: 'Profile',
  about: 'About',
};

export const SETTINGS_SECTION_DESCRIPTIONS: Record<SettingsSectionId, string> = {
  business: 'Company identity, contact details, and regional formatting.',
  invoice: 'Numbering format and the default text printed on invoices.',
  tax: 'Default tax behaviour applied to new invoices.',
  preferences: 'How the application looks and behaves for you.',
  profile: 'Your personal account details and password.',
  about: 'Version and environment information.',
};

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'default' | 'en';
export type TaxMode = 'inclusive' | 'exclusive';
export type DashboardPeriod =
  | 'today'
  | 'last_7_days'
  | 'last_30_days'
  | 'current_month';

export const THEME_OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'en', label: 'English' },
];

export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

export const DASHBOARD_PERIOD_OPTIONS: Array<{
  value: DashboardPeriod;
  label: string;
}> = [
  { value: 'today', label: 'Today' },
  { value: 'last_7_days', label: '7 Days' },
  { value: 'last_30_days', label: '30 Days' },
  { value: 'current_month', label: 'Current Month' },
];

export const TAX_MODE_OPTIONS: Array<{ value: TaxMode; label: string }> = [
  { value: 'exclusive', label: 'Tax Exclusive' },
  { value: 'inclusive', label: 'Tax Inclusive' },
];

export const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const;
export type DateFormat = (typeof DATE_FORMAT_OPTIONS)[number];

export interface InvoiceSettings {
  prefix: string;
  startingNumber: number;
  paddingLength: number;
  separator: string;
  dateFormat: string;
  invoiceFooter: string | null;
  invoiceTerms: string | null;
  canEditNumbering: boolean;
  numberingLockReason: string | null;
  nextNumberPreview: string;
}

export interface TaxSettings {
  gstEnabled: boolean;
  gstNumber: string | null;
  defaultTaxRate: number;
  taxMode: TaxMode;
  defaultTaxLabel: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

export interface PreferenceSettings {
  theme: Theme;
  language: Language;
  itemsPerPage: number;
  defaultDashboardPeriod: DashboardPeriod;
}

export interface ProfileSettings {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
}

export interface AboutInfo {
  applicationVersion: string;
  databaseVersion: string;
  apiVersion: string;
  buildDate: string;
  environment: string;
  licence: string;
}

export interface SettingsResponse {
  business: Business;
  invoice: InvoiceSettings;
  tax: TaxSettings;
  preferences: PreferenceSettings;
  profile: ProfileSettings;
  about: AboutInfo;
}

export interface BusinessSettingsFormValues {
  businessName: string;
  businessType: string;
  ownerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstNumber: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
}

export interface InvoiceSettingsFormValues {
  prefix: string;
  startingNumber: number;
  paddingLength: number;
  separator: string;
  dateFormat: DateFormat;
  invoiceFooter: string;
  invoiceTerms: string;
}

export interface TaxSettingsFormValues {
  gstEnabled: boolean;
  defaultTaxRate: number;
  taxMode: TaxMode;
  defaultTaxLabel: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

export type PreferenceSettingsFormValues = PreferenceSettings;

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const toBusinessSettingsValues = (
  business: Business,
): BusinessSettingsFormValues => ({
  businessName: business.businessName,
  businessType: business.businessType,
  ownerName: business.ownerName,
  email: business.email,
  phone: business.phone,
  addressLine1: business.addressLine1,
  addressLine2: business.addressLine2 ?? '',
  city: business.city,
  state: business.state,
  country: business.country,
  postalCode: business.postalCode,
  gstNumber: business.gstNumber ?? '',
  timezone: business.timezone,
  currency: business.currency,
  currencySymbol: business.currencySymbol,
});

export const toInvoiceSettingsValues = (
  invoice: InvoiceSettings,
): InvoiceSettingsFormValues => ({
  prefix: invoice.prefix,
  startingNumber: invoice.startingNumber,
  paddingLength: invoice.paddingLength,
  separator: invoice.separator,
  dateFormat: (DATE_FORMAT_OPTIONS as readonly string[]).includes(invoice.dateFormat)
    ? (invoice.dateFormat as DateFormat)
    : 'DD/MM/YYYY',
  invoiceFooter: invoice.invoiceFooter ?? '',
  invoiceTerms: invoice.invoiceTerms ?? '',
});

export const toTaxSettingsValues = (tax: TaxSettings): TaxSettingsFormValues => ({
  gstEnabled: tax.gstEnabled,
  defaultTaxRate: tax.defaultTaxRate,
  taxMode: tax.taxMode,
  defaultTaxLabel: tax.defaultTaxLabel,
  cgstRate: tax.cgstRate,
  sgstRate: tax.sgstRate,
  igstRate: tax.igstRate,
});

export const toProfileValues = (profile: ProfileSettings): ProfileFormValues => ({
  firstName: profile.firstName,
  lastName: profile.lastName,
  phone: profile.phone ?? '',
});

/** Builds a preview of the next invoice number for the given format. */
export const previewInvoiceNumber = (
  values: Pick<
    InvoiceSettingsFormValues,
    'prefix' | 'separator' | 'paddingLength' | 'startingNumber'
  >,
): string => {
  const padded = String(Math.max(1, values.startingNumber)).padStart(
    Math.min(Math.max(values.paddingLength, 1), 10),
    '0',
  );

  return `${values.prefix}${values.separator}${padded}`;
};
