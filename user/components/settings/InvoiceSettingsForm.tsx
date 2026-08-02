'use client';

import { useEffect, useId } from 'react';
import { settingsApi } from '@/lib/api/settings';
import { useSettingsForm, type FieldErrors } from '@/lib/settings/useSettingsForm';
import {
  DATE_FORMAT_OPTIONS,
  previewInvoiceNumber,
  toInvoiceSettingsValues,
  type DateFormat,
  type InvoiceSettings,
  type InvoiceSettingsFormValues,
} from '@/lib/types/settings';
import {
  SettingsField,
  SettingsSection,
  inputClassName,
  textareaClassName,
} from '@/components/settings/SettingsSection';
import { NumberInput } from '@/components/ui/NumberInput';

interface InvoiceSettingsFormProps {
  invoice: InvoiceSettings;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (invoice: InvoiceSettings) => void;
}

export const InvoiceSettingsForm = ({
  invoice,
  onDirtyChange,
  onSaved,
}: InvoiceSettingsFormProps) => {
  const formId = useId();
  const form = useSettingsForm<InvoiceSettingsFormValues>(
    toInvoiceSettingsValues(invoice),
  );

  const numberingLocked = !invoice.canEditNumbering;

  useEffect(() => {
    onDirtyChange(form.isDirty);
  }, [form.isDirty, onDirtyChange]);

  const validate = (
    values: InvoiceSettingsFormValues,
  ): FieldErrors<InvoiceSettingsFormValues> => {
    const errors: FieldErrors<InvoiceSettingsFormValues> = {};

    if (!/^[A-Za-z0-9]{1,10}$/.test(values.prefix.trim())) {
      errors.prefix = 'Prefix must be 1–10 alphanumeric characters';
    }
    if (!Number.isInteger(values.startingNumber) || values.startingNumber < 1) {
      errors.startingNumber = 'Starting number must be a whole number of at least 1';
    }
    if (
      !Number.isInteger(values.paddingLength) ||
      values.paddingLength < 1 ||
      values.paddingLength > 10
    ) {
      errors.paddingLength = 'Padding length must be between 1 and 10';
    }
    if (values.separator.length > 3) {
      errors.separator = 'Separator must be at most 3 characters';
    }

    return errors;
  };

  const handleSubmit = (): void => {
    void form.submit(async (changed) => {
      const { invoice: updated } = await settingsApi.updateInvoice(changed);
      onSaved(updated);
      return toInvoiceSettingsValues(updated);
    }, validate);
  };

  const preview = previewInvoiceNumber(form.values);

  return (
    <SettingsSection
      id="settings-panel-invoice"
      title="Invoice Settings"
      description="Numbering format and the default text printed on every invoice."
      isDirty={form.isDirty}
      isSubmitting={form.isSubmitting}
      formError={form.errors._form ?? null}
      footerNote={`Next invoice number: ${invoice.nextNumberPreview}`}
      onSubmit={handleSubmit}
      onReset={form.reset}
    >
      <div className="space-y-6">
        {numberingLocked ? (
          <div
            role="status"
            className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-sm text-[#92400E]"
          >
            {invoice.numberingLockReason ??
              'Invoice numbering is locked.'}{' '}
            Numbering is never reset automatically, so historical invoices keep their
            original numbers.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SettingsField
            id={`${formId}-prefix`}
            label="Invoice Prefix"
            error={form.errors.prefix}
          >
            <input
              id={`${formId}-prefix`}
              className={`${inputClassName} uppercase`}
              value={form.values.prefix}
              onChange={(event) =>
                form.setField('prefix', event.target.value.toUpperCase())
              }
              disabled={form.isSubmitting || numberingLocked}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-startingNumber`}
            label="Starting Number"
            error={form.errors.startingNumber}
          >
            <NumberInput
              id={`${formId}-startingNumber`}
              min={1}
              step={1}
              integer
              className={inputClassName}
              value={form.values.startingNumber}
              emptyValue={1}
              onValueChange={(startingNumber) =>
                form.setField('startingNumber', startingNumber)
              }
              disabled={form.isSubmitting || numberingLocked}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-paddingLength`}
            label="Padding Length"
            error={form.errors.paddingLength}
          >
            <NumberInput
              id={`${formId}-paddingLength`}
              min={1}
              max={10}
              step={1}
              integer
              className={inputClassName}
              value={form.values.paddingLength}
              emptyValue={1}
              onValueChange={(paddingLength) =>
                form.setField('paddingLength', paddingLength)
              }
              disabled={form.isSubmitting || numberingLocked}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-separator`}
            label="Separator"
            error={form.errors.separator}
          >
            <input
              id={`${formId}-separator`}
              className={inputClassName}
              maxLength={3}
              value={form.values.separator}
              onChange={(event) => form.setField('separator', event.target.value)}
              disabled={form.isSubmitting || numberingLocked}
            />
          </SettingsField>
        </div>

        <div className="rounded-md border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Format preview
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-[#111827]">{preview}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            id={`${formId}-dateFormat`}
            label="Date Format"
            error={form.errors.dateFormat}
          >
            <select
              id={`${formId}-dateFormat`}
              className={inputClassName}
              value={form.values.dateFormat}
              onChange={(event) =>
                form.setField('dateFormat', event.target.value as DateFormat)
              }
              disabled={form.isSubmitting}
            >
              {DATE_FORMAT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </SettingsField>
        </div>

        <SettingsField
          id={`${formId}-invoiceFooter`}
          label="Invoice Footer"
          error={form.errors.invoiceFooter}
          hint="Shown at the bottom of printed and PDF invoices."
        >
          <textarea
            id={`${formId}-invoiceFooter`}
            className={textareaClassName}
            value={form.values.invoiceFooter}
            onChange={(event) => form.setField('invoiceFooter', event.target.value)}
            disabled={form.isSubmitting}
          />
        </SettingsField>

        <SettingsField
          id={`${formId}-invoiceTerms`}
          label="Invoice Terms"
          error={form.errors.invoiceTerms}
          hint="Default terms and conditions applied to new invoices."
        >
          <textarea
            id={`${formId}-invoiceTerms`}
            className={textareaClassName}
            value={form.values.invoiceTerms}
            onChange={(event) => form.setField('invoiceTerms', event.target.value)}
            disabled={form.isSubmitting}
          />
        </SettingsField>
      </div>
    </SettingsSection>
  );
};
