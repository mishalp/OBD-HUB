/**
 * Document types that share the NumberSequence generator.
 * Add new values here to support future document numbering
 * without changing the service or formatting utilities.
 */
export const DOCUMENT_TYPES = [
  'invoice',
  'payment',
  'quotation',
  'purchase_order',
  'credit_note',
  'delivery_note',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DEFAULT_DOCUMENT_TYPE: DocumentType = 'invoice';

export const DEFAULT_PADDING_LENGTH = 6;
export const DEFAULT_SEPARATOR = '-';
export const MIN_PADDING_LENGTH = 3;
export const MAX_PADDING_LENGTH = 10;
export const MAX_PREFIX_LENGTH = 10;
