'use client';

import { useEffect, useId } from 'react';
import { settingsApi } from '@/lib/api/settings';
import { useSettingsForm, type FieldErrors } from '@/lib/settings/useSettingsForm';
import {
  TAX_MODE_OPTIONS,
  toTaxSettingsValues,
  type TaxMode,
  type TaxSettings,
  type TaxSettingsFormValues,
} from '@/lib/types/settings';
import {
  SettingsField,
  SettingsSection,
  inputClassName,
} from '@/components/settings/SettingsSection';
import { NumberInput } from '@/components/ui/NumberInput';

interface TaxSettingsFormProps {
  tax: TaxSettings;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (tax: TaxSettings) => void;
}

const rateFields: Array<{ key: keyof TaxSettingsFormValues; label: string }> = [
  { key: 'cgstRate', label: 'CGST Rate (%)' },
  { key: 'sgstRate', label: 'SGST Rate (%)' },
  { key: 'igstRate', label: 'IGST Rate (%)' },
];

export const TaxSettingsForm = ({
  tax,
  onDirtyChange,
  onSaved,
}: TaxSettingsFormProps) => {
  const formId = useId();
  const form = useSettingsForm<TaxSettingsFormValues>(toTaxSettingsValues(tax));

  useEffect(() => {
    onDirtyChange(form.isDirty);
  }, [form.isDirty, onDirtyChange]);

  const validate = (
    values: TaxSettingsFormValues,
  ): FieldErrors<TaxSettingsFormValues> => {
    const errors: FieldErrors<TaxSettingsFormValues> = {};

    if (
      !Number.isFinite(values.defaultTaxRate) ||
      values.defaultTaxRate < 0 ||
      values.defaultTaxRate > 100
    ) {
      errors.defaultTaxRate = 'Tax rate must be between 0 and 100';
    }
    if (!values.defaultTaxLabel.trim()) {
      errors.defaultTaxLabel = 'Tax label is required';
    }
    if (values.gstEnabled && !tax.gstNumber) {
      errors.gstEnabled =
        'Add a GST number in Business Profile before enabling GST.';
    }

    for (const field of rateFields) {
      const value = values[field.key] as number;
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        errors[field.key] = 'Rate must be between 0 and 100';
      }
    }

    return errors;
  };

  const handleSubmit = (): void => {
    void form.submit(async (changed) => {
      const { tax: updated } = await settingsApi.updateTax(changed);
      onSaved(updated);
      return toTaxSettingsValues(updated);
    }, validate);
  };

  return (
    <SettingsSection
      id="settings-panel-tax"
      title="Tax Settings"
      description="Default tax behaviour applied to new invoices. Existing invoices are unaffected."
      isDirty={form.isDirty}
      isSubmitting={form.isSubmitting}
      formError={form.errors._form ?? null}
      footerNote="Split GST rates are stored for future use and are not applied to calculations yet."
      onSubmit={handleSubmit}
      onReset={form.reset}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[#E5E7EB] text-[#D32F2F] focus:ring-[#D32F2F]"
              checked={form.values.gstEnabled}
              onChange={(event) => form.setField('gstEnabled', event.target.checked)}
              disabled={form.isSubmitting}
            />
            <span>
              <span className="block text-sm font-medium text-[#111827]">GST Enabled</span>
              <span className="block text-xs text-[#6B7280]">
                {tax.gstNumber
                  ? `Registered under ${tax.gstNumber}.`
                  : 'Requires a GST number on the business profile.'}
              </span>
            </span>
          </label>
          {form.errors.gstEnabled ? (
            <p className="text-sm text-[#DC2626]">{form.errors.gstEnabled}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SettingsField
            id={`${formId}-defaultTaxRate`}
            label="Default Tax Rate (%)"
            error={form.errors.defaultTaxRate}
          >
            <NumberInput
              id={`${formId}-defaultTaxRate`}
              min={0}
              max={100}
              step={0.01}
              className={inputClassName}
              value={form.values.defaultTaxRate}
              emptyValue={0}
              onValueChange={(defaultTaxRate) =>
                form.setField('defaultTaxRate', defaultTaxRate)
              }
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-defaultTaxLabel`}
            label="Default Tax Label"
            error={form.errors.defaultTaxLabel}
          >
            <input
              id={`${formId}-defaultTaxLabel`}
              className={inputClassName}
              value={form.values.defaultTaxLabel}
              onChange={(event) => form.setField('defaultTaxLabel', event.target.value)}
              disabled={form.isSubmitting}
            />
          </SettingsField>

          <SettingsField
            id={`${formId}-taxMode`}
            label="Tax Mode"
            error={form.errors.taxMode}
            hint="Whether item prices already include tax."
          >
            <select
              id={`${formId}-taxMode`}
              className={inputClassName}
              value={form.values.taxMode}
              onChange={(event) =>
                form.setField('taxMode', event.target.value as TaxMode)
              }
              disabled={form.isSubmitting}
            >
              {TAX_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingsField>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#111827]">Split GST rates</h3>
          <p className="mt-1 text-xs text-[#6B7280]">
            Stored for upcoming GST reporting. No advanced calculations are applied.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {rateFields.map((field) => (
              <SettingsField
                key={field.key}
                id={`${formId}-${String(field.key)}`}
                label={field.label}
                error={form.errors[field.key]}
              >
                <NumberInput
                  id={`${formId}-${String(field.key)}`}
                  min={0}
                  max={100}
                  step={0.01}
                  className={inputClassName}
                  value={form.values[field.key] as number}
                  emptyValue={0}
                  onValueChange={(next) => form.setField(field.key, next as never)}
                  disabled={form.isSubmitting}
                />
              </SettingsField>
            ))}
          </div>
        </div>
      </div>
    </SettingsSection>
  );
};
