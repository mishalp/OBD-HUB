'use client';

import {
  forwardRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils/cn';

type NativeNumberProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'defaultValue'
>;

export interface NumberInputProps extends NativeNumberProps {
  /** Committed numeric value from form state. */
  value: number | null | undefined;
  /**
   * Called with a finite number whenever the draft parses to a complete number.
   * Not called while the field is intentionally empty during editing.
   */
  onValueChange: (value: number) => void;
  /**
   * Value written on blur when the field is empty or incomplete.
   * Defaults to 0. Pass the field's existing business default.
   */
  emptyValue?: number;
  /** Prefer integer commits (still allows typing decimals until blur if step allows). */
  integer?: boolean;
}

const isPartialNumeric = (raw: string, allowNegative: boolean): boolean => {
  if (raw === '') {
    return true;
  }
  if (allowNegative && (raw === '-' || raw === '-.')) {
    return true;
  }
  if (raw === '.') {
    return true;
  }
  // Allow intermediate forms like "0.", "12.", "-0.5"
  const pattern = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
  return pattern.test(raw);
};

const parseCommitted = (raw: string, integer: boolean): number | null => {
  if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
    return null;
  }
  const parsed = integer ? Number.parseInt(raw, 10) : Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

const clampValue = (
  value: number,
  min?: number | string,
  max?: number | string,
): number => {
  let next = value;
  if (min !== undefined && min !== '') {
    const minNum = typeof min === 'number' ? min : Number(min);
    if (Number.isFinite(minNum)) {
      next = Math.max(next, minNum);
    }
  }
  if (max !== undefined && max !== '') {
    const maxNum = typeof max === 'number' ? max : Number(max);
    if (Number.isFinite(maxNum)) {
      next = Math.min(next, maxNum);
    }
  }
  return next;
};

const formatDisplayValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (!Number.isFinite(value)) {
    return '';
  }
  return String(value);
};

/**
 * Numeric input that allows clearing default zeros while editing.
 * Keeps an internal draft string so empty is not forced back to 0 on every keystroke.
 * Commits empty → emptyValue on blur only.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onValueChange,
      emptyValue = 0,
      integer = false,
      min,
      max,
      step,
      className,
      onBlur,
      onFocus,
      onKeyDown,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [draft, setDraft] = useState<string | null>(null);
    const allowNegative =
      min === undefined || min === '' || Number(min) < 0;

    const displayValue = draft !== null ? draft : formatDisplayValue(value);

    const commit = (raw: string): void => {
      const parsed = parseCommitted(raw, integer);
      if (parsed === null) {
        const fallback = clampValue(emptyValue, min, max);
        onValueChange(fallback);
        return;
      }
      onValueChange(clampValue(parsed, min, max));
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
      const raw = event.target.value;

      if (!isPartialNumeric(raw, allowNegative)) {
        return;
      }

      setDraft(raw);

      const parsed = parseCommitted(raw, integer);
      if (parsed === null) {
        // Keep parent value unchanged while empty / partial (e.g. "", "0.", "-").
        return;
      }

      // Live-update without clamping so users can type through intermediate values
      // (e.g. "0" while entering "0.05" with min=0.01). Clamp on blur only.
      onValueChange(parsed);
    };

    const handleFocus = (event: FocusEvent<HTMLInputElement>): void => {
      setDraft(formatDisplayValue(value));
      onFocus?.(event);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>): void => {
      const raw = draft !== null ? draft : formatDisplayValue(value);
      commit(raw);
      setDraft(null);
      onBlur?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
      // Prevent scroll-wheel / arrow accidental changes only when unwanted —
      // keep native arrow key stepping for accessibility.
      onKeyDown?.(event);
    };

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        autoComplete="off"
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={cn(className)}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  },
);

NumberInput.displayName = 'NumberInput';

/**
 * String-backed numeric field (filters, payment amount stored as string).
 * Allows empty string freely; does not coerce to 0 while typing.
 */
export interface StringNumberInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange' | 'defaultValue'
  > {
  value: string;
  onValueChange: (value: string) => void;
  integer?: boolean;
}

export const StringNumberInput = forwardRef<HTMLInputElement, StringNumberInputProps>(
  (
    {
      value,
      onValueChange,
      integer = false,
      min,
      className,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const allowNegative =
      min === undefined || min === '' || Number(min) < 0;

    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
      const raw = event.target.value;
      if (!isPartialNumeric(raw, allowNegative)) {
        return;
      }
      if (integer && raw.includes('.')) {
        return;
      }
      onValueChange(raw);
    };

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        autoComplete="off"
        min={min}
        className={cn(className)}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
      />
    );
  },
);

StringNumberInput.displayName = 'StringNumberInput';
