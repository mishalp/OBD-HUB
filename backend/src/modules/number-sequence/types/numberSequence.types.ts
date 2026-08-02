import {
  DEFAULT_DOCUMENT_TYPE,
  DEFAULT_PADDING_LENGTH,
  DEFAULT_SEPARATOR,
  DocumentType,
  MAX_PADDING_LENGTH,
  MAX_PREFIX_LENGTH,
  MIN_PADDING_LENGTH,
} from '../utils/documentTypes';

export interface GeneratedNumberResult {
  documentNumber: string;
  numericValue: number;
  prefix: string;
  paddingLength: number;
  separator: string;
  documentType: DocumentType;
}

/** Invoice-specific shape returned by /api/invoice-number endpoints. */
export interface InvoiceNumberResult {
  invoiceNumber: string;
  numericValue: number;
  prefix: string;
  padding: number;
  separator: string;
  documentType: DocumentType;
}

export interface SafeNumberSequence {
  id: string;
  businessId: string;
  documentType: DocumentType;
  prefix: string;
  currentNumber: number;
  startingNumber: number;
  paddingLength: number;
  separator: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const toInvoiceNumberResult = (
  result: GeneratedNumberResult,
): InvoiceNumberResult => ({
  invoiceNumber: result.documentNumber,
  numericValue: result.numericValue,
  prefix: result.prefix,
  padding: result.paddingLength,
  separator: result.separator,
  documentType: result.documentType,
});

export {
  DEFAULT_DOCUMENT_TYPE,
  DEFAULT_PADDING_LENGTH,
  DEFAULT_SEPARATOR,
  MAX_PADDING_LENGTH,
  MAX_PREFIX_LENGTH,
  MIN_PADDING_LENGTH,
};
