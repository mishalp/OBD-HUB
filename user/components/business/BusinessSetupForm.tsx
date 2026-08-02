'use client';

import { FormEvent, useId, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { businessApi } from '@/lib/api/business';
import { ApiClientError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { NumberInput } from '@/components/ui/NumberInput';
import type { BusinessFormValues } from '@/lib/types/business';

type FieldErrors = Partial<Record<keyof BusinessFormValues | 'logo', string>>;

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

const phonePattern = /^\+?[0-9\s\-()]{7,20}$/;

const defaultValues = (ownerName: string, email: string): BusinessFormValues => ({
  businessName: '',
  businessType: 'Retail',
  ownerName,
  email,
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  gstEnabled: false,
  gstNumber: '',
  invoicePrefix: 'INV',
  invoiceStartingNumber: 1,
  currency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Kolkata',
});

const inputClassName =
  'h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:cursor-not-allowed disabled:bg-[#FAFAFA]';

export const BusinessSetupForm = () => {
  const router = useRouter();
  const { user, updateBusinessSession } = useAuth();
  const { showToast } = useToast();

  const formId = useId();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Partial<Record<keyof BusinessFormValues, HTMLElement | null>>>({});

  const [values, setValues] = useState<BusinessFormValues>(() =>
    defaultValues(
      user ? `${user.firstName} ${user.lastName}`.trim() : '',
      user?.email ?? '',
    ),
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sectionClassName = 'rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6';

  const setField = <K extends keyof BusinessFormValues>(
    key: K,
    value: BusinessFormValues[K],
  ): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (values.businessName.trim().length < 3 || values.businessName.trim().length > 100) {
      errors.businessName = 'Business name must be 3–100 characters';
    }
    if (!values.businessType.trim()) {
      errors.businessType = 'Business type is required';
    }
    if (values.ownerName.trim().length < 2) {
      errors.ownerName = 'Owner name is required';
    }
    if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
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
    if (values.gstEnabled && values.gstNumber.trim().length < 5) {
      errors.gstNumber = 'GST number is required when GST is enabled';
    }
    if (
      !values.invoicePrefix.trim() ||
      values.invoicePrefix.trim().length > 10 ||
      !/^[A-Za-z0-9]+$/.test(values.invoicePrefix.trim())
    ) {
      errors.invoicePrefix = 'Invoice prefix must be alphanumeric (max 10)';
    }
    if (!Number.isInteger(values.invoiceStartingNumber) || values.invoiceStartingNumber < 1) {
      errors.invoiceStartingNumber = 'Starting number must be at least 1';
    }
    if (!values.currency.trim()) {
      errors.currency = 'Currency is required';
    }
    if (!values.currencySymbol.trim()) {
      errors.currencySymbol = 'Currency symbol is required';
    }
    if (!values.timezone.trim()) {
      errors.timezone = 'Timezone is required';
    }

    return errors;
  };

  const focusFirstInvalid = (errors: FieldErrors): void => {
    const order: Array<keyof BusinessFormValues> = [
      'businessName',
      'businessType',
      'ownerName',
      'email',
      'phone',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'country',
      'postalCode',
      'gstNumber',
      'invoicePrefix',
      'invoiceStartingNumber',
      'currency',
      'currencySymbol',
      'dateFormat',
      'timezone',
    ];

    for (const key of order) {
      if (errors[key]) {
        fieldRefs.current[key]?.focus();
        return;
      }
    }
  };

  const handleLogoChange = (file: File | null): void => {
    setLogoFile(file);
    setFieldErrors((prev) => ({ ...prev, logo: undefined }));

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    if (file) {
      if (!file.type.startsWith('image/')) {
        setFieldErrors((prev) => ({ ...prev, logo: 'Please select an image file' }));
        setLogoFile(null);
        setLogoPreview(null);
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setFieldErrors((prev) => ({ ...prev, logo: 'Logo must be 2MB or smaller' }));
        setLogoFile(null);
        setLogoPreview(null);
        return;
      }

      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(null);
    }
  };

  const buildFormData = (): FormData => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === 'gstEnabled') {
        formData.append(key, value ? 'true' : 'false');
        return;
      }

      formData.append(key, String(value));
    });

    if (logoFile) {
      formData.append('logo', logoFile);
    }

    return formData;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setServerError(null);
    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await businessApi.create(buildFormData());
      updateBusinessSession(result.user);
      showToast('Business profile created successfully');
      router.replace('/dashboard');
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.errors?.length) {
          const nextErrors: FieldErrors = {};

          for (const item of error.errors) {
            nextErrors[item.path as keyof FieldErrors] = item.message;
          }

          setFieldErrors(nextErrors);
          focusFirstInvalid(nextErrors);
        }

        setServerError(error.message);
      } else {
        setServerError('Unable to save business profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (
    name: keyof BusinessFormValues,
    label: string,
    control: ReactNode,
  ): ReactNode => (
    <div className="flex flex-col gap-2">
      <label htmlFor={`${formId}-${name}`} className="text-sm font-medium text-[#111827]">
        {label}
      </label>
      {control}
      {fieldErrors[name] ? (
        <p className="text-sm text-[#DC2626]">{fieldErrors[name]}</p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-6" noValidate>
      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-[#111827]">Business Information</h2>
        <p className="mt-1 text-sm text-[#6B7280]">Tell us about your business.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {renderField(
            'businessName',
            'Business Name',
            <input
              id={`${formId}-businessName`}
              ref={(el) => {
                fieldRefs.current.businessName = el;
              }}
              className={inputClassName}
              value={values.businessName}
              onChange={(e) => setField('businessName', e.target.value)}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'businessType',
            'Business Type',
            <select
              id={`${formId}-businessType`}
              ref={(el) => {
                fieldRefs.current.businessType = el;
              }}
              className={inputClassName}
              value={values.businessType}
              onChange={(e) => setField('businessType', e.target.value)}
              disabled={isSubmitting}
            >
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>,
          )}
          {renderField(
            'ownerName',
            'Owner Name',
            <input
              id={`${formId}-ownerName`}
              ref={(el) => {
                fieldRefs.current.ownerName = el;
              }}
              className={inputClassName}
              value={values.ownerName}
              onChange={(e) => setField('ownerName', e.target.value)}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'email',
            'Email',
            <input
              id={`${formId}-email`}
              type="email"
              ref={(el) => {
                fieldRefs.current.email = el;
              }}
              className={inputClassName}
              value={values.email}
              onChange={(e) => setField('email', e.target.value)}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'phone',
            'Phone',
            <input
              id={`${formId}-phone`}
              ref={(el) => {
                fieldRefs.current.phone = el;
              }}
              className={inputClassName}
              value={values.phone}
              onChange={(e) => setField('phone', e.target.value)}
              disabled={isSubmitting}
              placeholder="+91 98765 43210"
            />,
          )}

          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-sm font-medium text-[#111827]">Business Logo (optional)</label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#FAFAFA]">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-[#9CA3AF]">Logo</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:opacity-60"
                >
                  Upload logo
                </button>
                {logoFile ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleLogoChange(null);
                      if (logoInputRef.current) {
                        logoInputRef.current.value = '';
                      }
                    }}
                    disabled={isSubmitting}
                    className="text-sm text-[#DC2626]"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
            {fieldErrors.logo ? <p className="text-sm text-[#DC2626]">{fieldErrors.logo}</p> : null}
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-[#111827]">Business Address</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {renderField(
            'addressLine1',
            'Address Line 1',
            <input
              id={`${formId}-addressLine1`}
              ref={(el) => {
                fieldRefs.current.addressLine1 = el;
              }}
              className={inputClassName}
              value={values.addressLine1}
              onChange={(e) => setField('addressLine1', e.target.value)}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'addressLine2',
            'Address Line 2',
            <input
              id={`${formId}-addressLine2`}
              ref={(el) => {
                fieldRefs.current.addressLine2 = el;
              }}
              className={inputClassName}
              value={values.addressLine2}
              onChange={(e) => setField('addressLine2', e.target.value)}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'city',
            'City',
            <input
              id={`${formId}-city`}
              ref={(el) => {
                fieldRefs.current.city = el;
              }}
              className={inputClassName}
              value={values.city}
              onChange={(e) => setField('city', e.target.value)}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'state',
            'State',
            <input
              id={`${formId}-state`}
              ref={(el) => {
                fieldRefs.current.state = el;
              }}
              className={inputClassName}
              value={values.state}
              onChange={(e) => setField('state', e.target.value)}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'country',
            'Country',
            <input
              id={`${formId}-country`}
              ref={(el) => {
                fieldRefs.current.country = el;
              }}
              className={inputClassName}
              value={values.country}
              onChange={(e) => setField('country', e.target.value)}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'postalCode',
            'Postal Code',
            <input
              id={`${formId}-postalCode`}
              ref={(el) => {
                fieldRefs.current.postalCode = el;
              }}
              className={inputClassName}
              value={values.postalCode}
              onChange={(e) => setField('postalCode', e.target.value)}
              disabled={isSubmitting}
            />,
          )}
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-[#111827]">Tax Information</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-[#6B7280] sm:col-span-2">
            <input
              type="checkbox"
              checked={values.gstEnabled}
              onChange={(e) => setField('gstEnabled', e.target.checked)}
              disabled={isSubmitting}
              className="size-4 rounded border-[#E5E7EB] text-[#D32F2F] focus:ring-[#D32F2F]"
            />
            GST Enabled
          </label>
          {values.gstEnabled
            ? renderField(
                'gstNumber',
                'GST Number',
                <input
                  id={`${formId}-gstNumber`}
                  ref={(el) => {
                    fieldRefs.current.gstNumber = el;
                  }}
                  className={inputClassName}
                  value={values.gstNumber}
                  onChange={(e) => setField('gstNumber', e.target.value.toUpperCase())}
                  disabled={isSubmitting}
                />,
              )
            : null}
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-[#111827]">Invoice Configuration</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {renderField(
            'invoicePrefix',
            'Invoice Prefix',
            <input
              id={`${formId}-invoicePrefix`}
              ref={(el) => {
                fieldRefs.current.invoicePrefix = el;
              }}
              className={inputClassName}
              value={values.invoicePrefix}
              onChange={(e) => setField('invoicePrefix', e.target.value.toUpperCase())}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'invoiceStartingNumber',
            'Starting Invoice Number',
            <NumberInput
              id={`${formId}-invoiceStartingNumber`}
              min={1}
              integer
              ref={(el) => {
                fieldRefs.current.invoiceStartingNumber = el;
              }}
              className={inputClassName}
              value={values.invoiceStartingNumber}
              emptyValue={1}
              onValueChange={(invoiceStartingNumber) =>
                setField('invoiceStartingNumber', invoiceStartingNumber)
              }
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'currency',
            'Currency',
            <input
              id={`${formId}-currency`}
              ref={(el) => {
                fieldRefs.current.currency = el;
              }}
              className={inputClassName}
              value={values.currency}
              onChange={(e) => setField('currency', e.target.value.toUpperCase())}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'currencySymbol',
            'Currency Symbol',
            <input
              id={`${formId}-currencySymbol`}
              ref={(el) => {
                fieldRefs.current.currencySymbol = el;
              }}
              className={inputClassName}
              value={values.currencySymbol}
              onChange={(e) => setField('currencySymbol', e.target.value)}
              disabled={isSubmitting}
            />,
          )}
          {renderField(
            'dateFormat',
            'Date Format',
            <select
              id={`${formId}-dateFormat`}
              ref={(el) => {
                fieldRefs.current.dateFormat = el;
              }}
              className={inputClassName}
              value={values.dateFormat}
              onChange={(e) =>
                setField(
                  'dateFormat',
                  e.target.value as BusinessFormValues['dateFormat'],
                )
              }
              disabled={isSubmitting}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>,
          )}
          {renderField(
            'timezone',
            'Timezone',
            <select
              id={`${formId}-timezone`}
              ref={(el) => {
                fieldRefs.current.timezone = el;
              }}
              className={inputClassName}
              value={values.timezone}
              onChange={(e) => setField('timezone', e.target.value)}
              disabled={isSubmitting}
            >
              {TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>,
          )}
        </div>
      </section>

      {serverError ? (
        <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">
          {serverError}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-md bg-[#D32F2F] px-4 text-sm font-semibold text-white transition hover:bg-[#B71C1C] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving...
            </span>
          ) : (
            'Complete Setup'
          )}
        </button>
      </div>
    </form>
  );
};
