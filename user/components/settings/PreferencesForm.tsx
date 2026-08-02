'use client';

import { useEffect, useId } from 'react';
import { settingsApi } from '@/lib/api/settings';
import { useSettingsForm } from '@/lib/settings/useSettingsForm';
import {
  DASHBOARD_PERIOD_OPTIONS,
  ITEMS_PER_PAGE_OPTIONS,
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  type DashboardPeriod,
  type Language,
  type PreferenceSettings,
  type PreferenceSettingsFormValues,
  type Theme,
} from '@/lib/types/settings';
import {
  SettingsField,
  SettingsSection,
  inputClassName,
} from '@/components/settings/SettingsSection';

interface PreferencesFormProps {
  preferences: PreferenceSettings;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (preferences: PreferenceSettings) => void;
}

export const PreferencesForm = ({
  preferences,
  onDirtyChange,
  onSaved,
}: PreferencesFormProps) => {
  const formId = useId();
  const form = useSettingsForm<PreferenceSettingsFormValues>(preferences);

  useEffect(() => {
    onDirtyChange(form.isDirty);
  }, [form.isDirty, onDirtyChange]);

  const handleSubmit = (): void => {
    void form.submit(async (changed) => {
      const { preferences: updated } = await settingsApi.updatePreferences(changed);
      onSaved(updated);
      return updated;
    });
  };

  return (
    <SettingsSection
      id="settings-panel-preferences"
      title="Application Preferences"
      description="How the application looks and behaves for this business."
      isDirty={form.isDirty}
      isSubmitting={form.isSubmitting}
      formError={form.errors._form ?? null}
      footerNote="Preferences apply the next time each screen loads."
      onSubmit={handleSubmit}
      onReset={form.reset}
    >
      <div className="space-y-6">
        <fieldset>
          <legend className="text-sm font-medium text-[#111827]">Theme</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const isActive = form.values.theme === option.value;

              return (
                <label
                  key={option.value}
                  className={[
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                    isActive
                      ? 'border-[#D32F2F] bg-[#FEF2F2] text-[#D32F2F]'
                      : 'border-[#E5E7EB] text-[#374151] hover:bg-[#FAFAFA]',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={`${formId}-theme`}
                    value={option.value}
                    checked={isActive}
                    onChange={() => form.setField('theme', option.value as Theme)}
                    disabled={form.isSubmitting}
                    className="h-4 w-4 text-[#D32F2F] focus:ring-[#D32F2F]"
                  />
                  <span className="font-medium">{option.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <SettingsField
            id={`${formId}-language`}
            label="Language"
            error={form.errors.language}
            hint="Additional languages arrive with localisation support."
          >
            <select
              id={`${formId}-language`}
              className={inputClassName}
              value={form.values.language}
              onChange={(event) =>
                form.setField('language', event.target.value as Language)
              }
              disabled={form.isSubmitting}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField
            id={`${formId}-itemsPerPage`}
            label="Items Per Page"
            error={form.errors.itemsPerPage}
          >
            <select
              id={`${formId}-itemsPerPage`}
              className={inputClassName}
              value={form.values.itemsPerPage}
              onChange={(event) =>
                form.setField('itemsPerPage', Number(event.target.value))
              }
              disabled={form.isSubmitting}
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField
            id={`${formId}-defaultDashboardPeriod`}
            label="Default Dashboard Period"
            error={form.errors.defaultDashboardPeriod}
          >
            <select
              id={`${formId}-defaultDashboardPeriod`}
              className={inputClassName}
              value={form.values.defaultDashboardPeriod}
              onChange={(event) =>
                form.setField(
                  'defaultDashboardPeriod',
                  event.target.value as DashboardPeriod,
                )
              }
              disabled={form.isSubmitting}
            >
              {DASHBOARD_PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingsField>
        </div>
      </div>
    </SettingsSection>
  );
};
