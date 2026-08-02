'use client';

import { FormEvent, useId, useRef, useState } from 'react';
import type { CustomerFormValues } from '@/lib/types/customer';

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
}

interface CustomerFormProps {
  initialValues: CustomerFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  serverError: string | null;
  fieldErrors?: FieldErrors;
  onSubmit: (values: CustomerFormValues) => Promise<void> | void;
  onCancel: () => void;
}

const phonePattern = /^\+?[0-9\s\-()]{7,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClassName = 'ui-input h-11';

export const CustomerForm = ({
  initialValues,
  submitLabel,
  isSubmitting,
  serverError,
  fieldErrors: externalErrors = {},
  onSubmit,
  onCancel,
}: CustomerFormProps) => {
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<CustomerFormValues>(initialValues);
  const [localErrors, setLocalErrors] = useState<FieldErrors>({});

  const fieldErrors: FieldErrors = {
    ...localErrors,
    ...externalErrors,
  };

  const setField = <K extends keyof CustomerFormValues>(
    key: K,
    value: CustomerFormValues[K],
  ): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === 'name' || key === 'phone' || key === 'email') {
      setLocalErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (values.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (values.phone.trim() && !phonePattern.test(values.phone.trim())) {
      errors.phone = 'Enter a valid phone number';
    }

    if (values.email.trim() && !emailPattern.test(values.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const errors = validate();
    setLocalErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.name) {
        nameRef.current?.focus();
      }
      return;
    }

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-name`} className="text-sm font-medium text-[#111827]">
            Name <span className="text-[#DC2626]">*</span>
          </label>
          <input
            ref={nameRef}
            id={`${formId}-name`}
            className={inputClassName}
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.name ? <p className="text-sm text-[#DC2626]">{fieldErrors.name}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-phone`} className="text-sm font-medium text-[#111827]">
            Phone <span className="text-[12px] font-normal text-[#9CA3AF]">(optional)</span>
          </label>
          <input
            id={`${formId}-phone`}
            className={inputClassName}
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.phone ? <p className="text-sm text-[#DC2626]">{fieldErrors.phone}</p> : null}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor={`${formId}-email`} className="text-sm font-medium text-[#111827]">
            Email
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            className={inputClassName}
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.email ? <p className="text-sm text-[#DC2626]">{fieldErrors.email}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-address1`} className="text-sm font-medium text-[#111827]">
            Address Line 1
          </label>
          <input
            id={`${formId}-address1`}
            className={inputClassName}
            value={values.addressLine1}
            onChange={(e) => setField('addressLine1', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-address2`} className="text-sm font-medium text-[#111827]">
            Address Line 2
          </label>
          <input
            id={`${formId}-address2`}
            className={inputClassName}
            value={values.addressLine2}
            onChange={(e) => setField('addressLine2', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-city`} className="text-sm font-medium text-[#111827]">
            City
          </label>
          <input
            id={`${formId}-city`}
            className={inputClassName}
            value={values.city}
            onChange={(e) => setField('city', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-state`} className="text-sm font-medium text-[#111827]">
            State
          </label>
          <input
            id={`${formId}-state`}
            className={inputClassName}
            value={values.state}
            onChange={(e) => setField('state', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-country`} className="text-sm font-medium text-[#111827]">
            Country
          </label>
          <input
            id={`${formId}-country`}
            className={inputClassName}
            value={values.country}
            onChange={(e) => setField('country', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-postal`} className="text-sm font-medium text-[#111827]">
            Postal Code
          </label>
          <input
            id={`${formId}-postal`}
            className={inputClassName}
            value={values.postalCode}
            onChange={(e) => setField('postalCode', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-gst`} className="text-sm font-medium text-[#111827]">
            GST Number
          </label>
          <input
            id={`${formId}-gst`}
            className={inputClassName}
            value={values.gstNumber}
            onChange={(e) => setField('gstNumber', e.target.value.toUpperCase())}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-status`} className="text-sm font-medium text-[#111827]">
            Status
          </label>
          <select
            id={`${formId}-status`}
            className={inputClassName}
            value={values.isActive ? 'active' : 'inactive'}
            onChange={(e) => setField('isActive', e.target.value === 'active')}
            disabled={isSubmitting}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor={`${formId}-notes`} className="text-sm font-medium text-[#111827]">
            Notes
          </label>
          <textarea
            id={`${formId}-notes`}
            rows={3}
            className="ui-textarea"
            value={values.notes}
            onChange={(e) => setField('notes', e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {serverError ? (
        <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">
          {serverError}
        </div>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#D32F2F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B71C1C] disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};
