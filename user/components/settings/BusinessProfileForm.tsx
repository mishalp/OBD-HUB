'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { settingsApi } from '@/lib/api/settings';
import { resolveAssetUrl } from '@/lib/api/client';
import { useSettingsForm, type FieldErrors } from '@/lib/settings/useSettingsForm';
import type { Business } from '@/lib/types/business';
import {
  toBusinessSettingsValues,
  type BusinessSettingsFormValues,
} from '@/lib/types/settings';
import {
  SettingsField,
  SettingsSection,
  inputClassName,
} from '@/components/settings/SettingsSection';

const BUSINESS_TYPES = [
  'Retail',
  'Wholesale',
  'Service',
  'Manufacturing',
  'Consulting',
  'Other',
];

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'UTC',
];

const CURRENCIES: Array<{ code: string; symbol: string; label: string }> = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
];

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const phonePattern = /^\+?[0-9\s\-()]{7,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const gstPattern = /^[0-9A-Z]{15}$/;

interface BusinessProfileFormProps {
  business: Business;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (business: Business) => void;
}

export const BusinessProfileForm = ({
  business,
  onDirtyChange,
  onSaved,
}: BusinessProfileFormProps) => {
  const formId = useId();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useSettingsForm<BusinessSettingsFormValues>(
    toBusinessSettingsValues(business),
  );

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [storedLogo, setStoredLogo] = useState<string | null>(business.businessLogo);

  const previewUrlRef = useRef<string | null>(null);

  const logoChanged = logoFile !== null || removeLogo;
  const isDirty = form.isDirty || logoChanged;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // Release the last object URL when the form unmounts.
  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [],
  );

  const applyPreview = (file: File | null): void => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    previewUrlRef.current = file ? URL.createObjectURL(file) : null;
    setLogoPreview(previewUrlRef.current);
  };

  const validate = (
    values: BusinessSettingsFormValues,
  ): FieldErrors<BusinessSettingsFormValues> => {
    const errors: FieldErrors<BusinessSettingsFormValues> = {};

    if (values.businessName.trim().length < 3) {
      errors.businessName = 'Business name must be at least 3 characters';
    }
    if (values.ownerName.trim().length < 2) {
      errors.ownerName = 'Owner name is required';
    }
    if (!emailPattern.test(values.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!phonePattern.test(values.phone.trim())) {
      errors.phone = 'Enter a valid phone number';
    }
    if (values.addressLine1.trim().length < 3) {
      errors.addressLine1 = 'Address line 1 is required';
    }
    if (values.city.trim().length < 2) {
      errors.city = 'City is required';
    }
    if (values.state.trim().length < 2) {
      errors.state = 'State is required';
    }
    if (values.country.trim().length < 2) {
      errors.country = 'Country is required';
    }
    if (values.postalCode.trim().length < 3) {
      errors.postalCode = 'Postal code is required';
    }
    if (values.gstNumber.trim() && !gstPattern.test(values.gstNumber.trim().toUpperCase())) {
      errors.gstNumber = 'GST number must be 15 alphanumeric characters';
    }
    if (values.currency.trim().length !== 3) {
      errors.currency = 'Currency must be a 3-letter code';
    }
    if (!values.currencySymbol.trim()) {
      errors.currencySymbol = 'Currency symbol is required';
    }

    return errors;
  };

  const handleLogoChange = (file: File | null): void => {
    setLogoError(null);

    if (!file) {
      setLogoFile(null);
      applyPreview(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setLogoError('Logo must be a JPEG, PNG, WEBP, or GIF image');
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Logo must be smaller than 2 MB');
      return;
    }

    setRemoveLogo(false);
    setLogoFile(file);
    applyPreview(file);
  };

  const handleSubmit = (): void => {
    void form.submit(async (changed, values) => {
      const formData = new FormData();

      for (const key of Object.keys(changed) as Array<
        keyof BusinessSettingsFormValues
      >) {
        formData.append(key, String(values[key]).trim());
      }

      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (removeLogo) {
        formData.append('removeLogo', 'true');
      }

      const { business: updated } = await settingsApi.updateBusiness(formData);

      setLogoFile(null);
      applyPreview(null);
      setRemoveLogo(false);
      setStoredLogo(updated.businessLogo);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
      onSaved(updated);

      return toBusinessSettingsValues(updated);
    }, validate);
  };

  const handleReset = (): void => {
    form.reset();
    setLogoFile(null);
    applyPreview(null);
    setRemoveLogo(false);
    setLogoError(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const previewUrl = logoPreview ?? (removeLogo ? null : resolveAssetUrl(storedLogo));

  return (
    <SettingsSection
      id="settings-panel-business"
      title="Business Profile"
      description="Company identity, contact details, and regional formatting used across the app."
      isDirty={isDirty}
      isSubmitting={form.isSubmitting}
      formError={form.errors._form ?? null}
      footerNote="Changes apply to new documents only. Existing invoices keep the values stored at creation time."
      onSubmit={handleSubmit}
      onReset={handleReset}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Business logo preview"
              className="h-16 w-16 rounded-lg border border-[#E5E7EB] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[#E5E7EB] text-xs text-[#9CA3AF]">
              No logo
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={form.isSubmitting}
                className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload logo
              </button>
              {previewUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    applyPreview(null);
                    setRemoveLogo(true);
                    setLogoError(null);
                    if (logoInputRef.current) {
                      logoInputRef.current.value = '';
                    }
                  }}
                  disabled={form.isSubmitting}
                  className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <p className={logoError ? 'text-sm text-[#DC2626]' : 'text-xs text-[#6B7280]'}>
              {logoError ?? 'PNG, JPG, WEBP, or GIF up to 2 MB.'}
            </p>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => handleLogoChange(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            id={`${formId}-businessName`}
            label="Business Name"
            required
            error={form.errors.businessName}
          >
            <input
              id={`${formId}-businessName`}
              className={inputClassName}
              value={form.values.businessName}
              onChange={(event) => form.setField('businessName', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-businessType`}
            label="Business Type"
            error={form.errors.businessType}
          >
            <select
              id={`${formId}-businessType`}
              className={inputClassName}
              value={form.values.businessType}
              onChange={(event) => form.setField('businessType', event.target.value)}
              disabled={form.isSubmitting}
            >
              {(BUSINESS_TYPES.includes(form.values.businessType)
                ? BUSINESS_TYPES
                : [form.values.businessType, ...BUSINESS_TYPES]
              ).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField
            id={`${formId}-ownerName`}
            label="Owner Name"
            required
            error={form.errors.ownerName}
          >
            <input
              id={`${formId}-ownerName`}
              className={inputClassName}
              value={form.values.ownerName}
              onChange={(event) => form.setField('ownerName', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-phone`}
            label="Phone"
            required
            error={form.errors.phone}
          >
            <input
              id={`${formId}-phone`}
              type="tel"
              className={inputClassName}
              value={form.values.phone}
              onChange={(event) => form.setField('phone', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-email`}
            label="Email"
            required
            error={form.errors.email}
          >
            <input
              id={`${formId}-email`}
              type="email"
              className={inputClassName}
              value={form.values.email}
              onChange={(event) => form.setField('email', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-gstNumber`}
            label="GST Number"
            error={form.errors.gstNumber}
            hint="15 characters, for example 27AAAAA0000A1Z5."
          >
            <input
              id={`${formId}-gstNumber`}
              className={`${inputClassName} uppercase`}
              value={form.values.gstNumber}
              onChange={(event) =>
                form.setField('gstNumber', event.target.value.toUpperCase())
              }
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-addressLine1`}
            label="Address"
            required
            error={form.errors.addressLine1}
            className="sm:col-span-2"
          >
            <input
              id={`${formId}-addressLine1`}
              className={inputClassName}
              value={form.values.addressLine1}
              onChange={(event) => form.setField('addressLine1', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-addressLine2`}
            label="Address Line 2"
            error={form.errors.addressLine2}
            className="sm:col-span-2"
          >
            <input
              id={`${formId}-addressLine2`}
              className={inputClassName}
              value={form.values.addressLine2}
              onChange={(event) => form.setField('addressLine2', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-city`}
            label="City"
            required
            error={form.errors.city}
          >
            <input
              id={`${formId}-city`}
              className={inputClassName}
              value={form.values.city}
              onChange={(event) => form.setField('city', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-state`}
            label="State"
            required
            error={form.errors.state}
          >
            <input
              id={`${formId}-state`}
              className={inputClassName}
              value={form.values.state}
              onChange={(event) => form.setField('state', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-country`}
            label="Country"
            required
            error={form.errors.country}
          >
            <input
              id={`${formId}-country`}
              className={inputClassName}
              value={form.values.country}
              onChange={(event) => form.setField('country', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-postalCode`}
            label="Postal Code"
            required
            error={form.errors.postalCode}
          >
            <input
              id={`${formId}-postalCode`}
              className={inputClassName}
              value={form.values.postalCode}
              onChange={(event) => form.setField('postalCode', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-timezone`}
            label="Timezone"
            error={form.errors.timezone}
          >
            <select
              id={`${formId}-timezone`}
              className={inputClassName}
              value={form.values.timezone}
              onChange={(event) => form.setField('timezone', event.target.value)}
              disabled={form.isSubmitting}
            >
              {(TIMEZONES.includes(form.values.timezone)
                ? TIMEZONES
                : [form.values.timezone, ...TIMEZONES]
              ).map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField
            id={`${formId}-currency`}
            label="Currency"
            error={form.errors.currency}
          >
            <select
              id={`${formId}-currency`}
              className={inputClassName}
              value={form.values.currency}
              onChange={(event) => {
                const next = CURRENCIES.find((item) => item.code === event.target.value);
                form.setField('currency', event.target.value);
                if (next) {
                  form.setField('currencySymbol', next.symbol);
                }
              }}
              disabled={form.isSubmitting}
            >
              {(CURRENCIES.some((item) => item.code === form.values.currency)
                ? CURRENCIES
                : [
                    {
                      code: form.values.currency,
                      symbol: form.values.currencySymbol,
                      label: form.values.currency,
                    },
                    ...CURRENCIES,
                  ]
              ).map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currency.label}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField
            id={`${formId}-currencySymbol`}
            label="Currency Symbol"
            error={form.errors.currencySymbol}
          >
            <input
              id={`${formId}-currencySymbol`}
              className={inputClassName}
              value={form.values.currencySymbol}
              onChange={(event) => form.setField('currencySymbol', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>
        </div>
      </div>
    </SettingsSection>
  );
};
