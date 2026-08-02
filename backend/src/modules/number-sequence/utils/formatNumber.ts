import { DEFAULT_PADDING_LENGTH, DEFAULT_SEPARATOR } from './documentTypes';

export interface FormatNumberOptions {
  prefix: string;
  numericValue: number;
  paddingLength?: number;
  separator?: string;
}

/**
 * Zero-pads a positive integer to the requested width.
 * Values that already exceed the width are left as-is (no truncation).
 */
export const padNumber = (value: number, paddingLength: number): string => {
  const safeValue = Math.max(0, Math.floor(value));
  const width = Math.max(1, Math.floor(paddingLength));
  return String(safeValue).padStart(width, '0');
};

/**
 * Builds a formatted document number from prefix + separator + padded value.
 * Example: formatDocumentNumber({ prefix: 'INV', numericValue: 1 }) => 'INV-000001'
 */
export const formatDocumentNumber = ({
  prefix,
  numericValue,
  paddingLength = DEFAULT_PADDING_LENGTH,
  separator = DEFAULT_SEPARATOR,
}: FormatNumberOptions): string => {
  const normalizedPrefix = prefix.trim().toUpperCase();
  const padded = padNumber(numericValue, paddingLength);
  return `${normalizedPrefix}${separator}${padded}`;
};

/** Alias kept for invoice-specific call sites. */
export const generateInvoiceNumber = (options: FormatNumberOptions): string =>
  formatDocumentNumber(options);
