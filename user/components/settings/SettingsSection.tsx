'use client';

import type { ReactNode } from 'react';

export const inputClassName = 'ui-input';

export const textareaClassName = 'ui-textarea';

interface SettingsFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export const SettingsField = ({
  id,
  label,
  error,
  hint,
  required = false,
  className,
  children,
}: SettingsFieldProps) => (
  <div className={['flex flex-col gap-2', className ?? ''].join(' ')}>
    <label htmlFor={id} className="text-sm font-medium text-[#111827]">
      {label}
      {required ? <span className="ml-1 text-[#DC2626]">*</span> : null}
    </label>
    {children}
    {error ? (
      <p id={`${id}-error`} className="text-sm text-[#DC2626]">
        {error}
      </p>
    ) : hint ? (
      <p className="text-xs text-[#6B7280]">{hint}</p>
    ) : null}
  </div>
);

interface SettingsSectionProps {
  id: string;
  title: string;
  description: string;
  /** Rendered in the sticky footer next to the Save button. */
  footerNote?: ReactNode;
  isDirty?: boolean;
  isSubmitting?: boolean;
  saveLabel?: string;
  formError?: string | null;
  onSubmit?: () => void;
  onReset?: () => void;
  children: ReactNode;
}

export const SettingsSection = ({
  id,
  title,
  description,
  footerNote,
  isDirty = false,
  isSubmitting = false,
  saveLabel = 'Save changes',
  formError,
  onSubmit,
  onReset,
  children,
}: SettingsSectionProps) => {
  const body = (
    <>
      <header className="border-b border-[#E5E7EB] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
          {isDirty ? (
            <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-medium text-[#92400E]">
              Unsaved changes
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
      </header>

      <div className="px-5 py-5 sm:px-6">{children}</div>

      {formError ? (
        <div
          role="alert"
          className="mx-5 mb-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C] sm:mx-6"
        >
          {formError}
        </div>
      ) : null}

      {onSubmit ? (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] bg-[#FAFAFA] px-5 py-3 sm:px-6">
          <div className="text-xs text-[#6B7280]">{footerNote}</div>
          <div className="flex items-center gap-2">
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                disabled={!isDirty || isSubmitting}
                className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#111827] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Discard
              </button>
            ) : null}
            <button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="rounded-md bg-[#D32F2F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#B71C1C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : saveLabel}
            </button>
          </div>
        </footer>
      ) : null}
    </>
  );

  const shell = 'overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm';

  if (!onSubmit) {
    return (
      <section id={id} aria-labelledby={`${id}-title`} className={shell}>
        {body}
      </section>
    );
  }

  return (
    <section id={id} className={shell}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {body}
      </form>
    </section>
  );
};
