'use client';

import { useCallback, useMemo, useState } from 'react';
import { ApiClientError } from '@/lib/api/client';

export type FieldErrors<T> = Partial<Record<keyof T, string>> & { _form?: string };

/** Maps a standardised API validation error onto per-field messages. */
export const collectFieldErrors = <T,>(error: unknown): FieldErrors<T> => {
  const mapped: Record<string, string> = {};

  if (!(error instanceof ApiClientError)) {
    mapped._form = 'Something went wrong. Please try again.';
    return mapped as FieldErrors<T>;
  }

  for (const issue of error.errors ?? []) {
    const key = issue.path.split('.').pop();
    if (key) {
      mapped[key] = issue.message;
    }
  }

  if (Object.keys(mapped).length === 0) {
    mapped._form = error.message;
  }

  return mapped as FieldErrors<T>;
};

interface SettingsFormState<T extends object> {
  values: T;
  isDirty: boolean;
  /** Keys whose value differs from the last saved snapshot. */
  changedKeys: Array<keyof T>;
  errors: FieldErrors<T>;
  isSubmitting: boolean;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  setErrors: (errors: FieldErrors<T>) => void;
  reset: () => void;
  /** Adopts a new saved snapshot after a successful save. */
  commit: (next: T) => void;
  submit: (
    run: (changed: Partial<T>, values: T) => Promise<T | void>,
    validate?: (values: T) => FieldErrors<T>,
  ) => Promise<boolean>;
}

/**
 * Tracks a settings section's values against the last saved snapshot so only
 * modified fields are sent to the API.
 */
export const useSettingsForm = <T extends object>(
  initialValues: T,
): SettingsFormState<T> => {
  const [baseline, setBaseline] = useState<T>(initialValues);
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changedKeys = useMemo(() => {
    return (Object.keys(values) as Array<keyof T>).filter(
      (key) => !Object.is(values[key], baseline[key]),
    );
  }, [values, baseline]);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, _form: undefined }));
  }, []);

  const reset = useCallback((): void => {
    setValues(baseline);
    setErrors({});
  }, [baseline]);

  const commit = useCallback((next: T): void => {
    setBaseline(next);
    setValues(next);
    setErrors({});
  }, []);

  const submit = useCallback(
    async (
      run: (changed: Partial<T>, current: T) => Promise<T | void>,
      validate?: (current: T) => FieldErrors<T>,
    ): Promise<boolean> => {
      const validationErrors = validate ? validate(values) : {};

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return false;
      }

      const changed = changedKeys.reduce<Partial<T>>((accumulator, key) => {
        accumulator[key] = values[key];
        return accumulator;
      }, {});

      setIsSubmitting(true);
      setErrors({});

      try {
        const next = await run(changed, values);
        commit(next ?? values);
        return true;
      } catch (error) {
        setErrors(collectFieldErrors<T>(error));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [changedKeys, values, commit],
  );

  return {
    values,
    isDirty: changedKeys.length > 0,
    changedKeys,
    errors,
    isSubmitting,
    setField,
    setErrors,
    reset,
    commit,
    submit,
  };
};
