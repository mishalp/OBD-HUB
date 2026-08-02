import type { ItemType } from '@/lib/types/item';
import type { PaymentMethod } from '@/lib/types/payment';

export type InvoiceStatus =
  | 'Draft'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Paid'
  | 'Cancelled';

export type InvoicePaymentStatus = 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid';

/** Statuses the Invoice Builder may set on create. */
export type CreatableInvoiceStatus = 'Draft' | 'Unpaid' | 'Paid';

/** Statuses the Invoice Builder / Management may set on edit. */
export type EditableInvoiceStatus = 'Draft' | 'Unpaid';

export const CREATABLE_INVOICE_STATUSES: CreatableInvoiceStatus[] = [
  'Draft',
  'Unpaid',
  'Paid',
];

export const EDITABLE_INVOICE_STATUSES: EditableInvoiceStatus[] = ['Draft', 'Unpaid'];

export const isEditableInvoiceStatus = (status: InvoiceStatus): boolean =>
  status === 'Draft' || status === 'Unpaid';

export const isCreatableInvoiceStatus = (status: InvoiceStatus): status is CreatableInvoiceStatus =>
  status === 'Draft' || status === 'Unpaid' || status === 'Paid';

/** Invoices that can receive a payment from list/details quick actions. */
export const canRecordInvoicePayment = (invoice: {
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  outstandingBalance?: number;
}): boolean => {
  if (
    invoice.status === 'Draft' ||
    invoice.status === 'Paid' ||
    invoice.status === 'Cancelled'
  ) {
    return false;
  }

  if (invoice.paymentStatus === 'Paid') {
    return false;
  }

  if (
    typeof invoice.outstandingBalance === 'number' &&
    invoice.outstandingBalance <= 0
  ) {
    return false;
  }

  return invoice.status === 'Unpaid' || invoice.status === 'Partially Paid';
};

export interface InvoiceInitialPaymentForm {
  paymentMethod: PaymentMethod | '';
  paymentDate: string;
  referenceNumber: string;
  notes: string;
}

export interface InvoiceItemSnapshot {
  itemId: string;
  itemCode: string;
  itemName: string;
  type: ItemType;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  totalPaid: number;
  outstandingBalance: number;
  notes: string | null;
  terms: string | null;
  items: InvoiceItemSnapshot[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineForm {
  key: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  description: string;
  type: ItemType | '';
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface InvoiceFormState {
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  notes: string;
  terms: string;
  items: InvoiceLineForm[];
  payment: InvoiceInitialPaymentForm;
}

export interface NextInvoiceNumberResponse {
  invoiceNumber: string;
  numericValue: number;
  prefix: string;
  padding: number;
  separator: string;
  documentType: string;
}

export interface CreateInvoicePayload {
  customerId: string;
  invoiceDate: string;
  dueDate: string | null;
  status: CreatableInvoiceStatus;
  notes: string | null;
  terms: string | null;
  items: Array<{
    itemId: string;
    quantity?: number;
    unit?: string;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }>;
  payment?: {
    paymentMethod: PaymentMethod;
    paymentDate: string;
    referenceNumber: string | null;
    notes: string | null;
  } | null;
}

export interface UpdateInvoicePayload {
  customerId: string;
  invoiceDate: string;
  dueDate: string | null;
  status: EditableInvoiceStatus;
  notes: string | null;
  terms: string | null;
  items: Array<{
    itemId: string;
    quantity?: number;
    unit?: string;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }>;
}

export interface InvoiceCustomerSummary {
  id: string;
  customerCode: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface InvoiceCustomerDetails extends InvoiceCustomerSummary {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  gstNumber: string | null;
}

export interface InvoiceBusinessSummary {
  id: string;
  businessName: string;
  businessLogo: string | null;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstEnabled: boolean;
  gstNumber: string | null;
  currency: string;
  currencySymbol: string;
}

export interface InvoiceListItem extends Invoice {
  customer: InvoiceCustomerSummary | null;
  createdByName: string | null;
}

export interface InvoiceTimelineEvent {
  id: string;
  businessId: string;
  invoiceId: string;
  eventType:
    | 'INVOICE_CREATED'
    | 'INVOICE_UPDATED'
    | 'PAYMENT_RECORDED'
    | 'PARTIAL_PAYMENT'
    | 'INVOICE_PAID'
    | 'STATUS_CHANGED'
    | 'INVOICE_SENT'
    | 'PAYMENT_REVERSED'
    | 'INVOICE_CANCELLED';
  title: string;
  description: string;
  userId: string | null;
  userName: string | null;
  referenceId: string | null;
  referenceType: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDetails extends Invoice {
  customer: InvoiceCustomerDetails | null;
  business: InvoiceBusinessSummary;
  createdByName: string | null;
  timeline: InvoiceTimelineEvent[];
}

export interface InvoiceStatistics {
  totalInvoices: number;
  draft: number;
  unpaid: number;
  partiallyPaid: number;
  paid: number;
}

export interface InvoicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface InvoiceListQuery {
  page: number;
  limit: number;
  search: string;
  status: 'all' | InvoiceStatus;
  customer: string;
  fromDate: string;
  toDate: string;
  sortBy: 'createdAt' | 'invoiceDate' | 'dueDate' | 'invoiceNumber' | 'grandTotal' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface InvoiceListResponse {
  invoices: InvoiceListItem[];
  pagination: InvoicePagination;
  statistics: InvoiceStatistics;
  meta: {
    search: string | null;
    status: 'all' | InvoiceStatus;
    customer: string | null;
    fromDate: string | null;
    toDate: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export const createEmptyInitialPayment = (
  invoiceDate?: string,
): InvoiceInitialPaymentForm => ({
  paymentMethod: '',
  paymentDate: invoiceDate ?? new Date().toISOString().slice(0, 10),
  referenceNumber: '',
  notes: '',
});

export const invoiceToFormState = (invoice: InvoiceDetails): InvoiceFormState => ({
  customerId: invoice.customerId,
  invoiceDate: invoice.invoiceDate.slice(0, 10),
  dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : '',
  status: invoice.status,
  notes: invoice.notes ?? '',
  terms: invoice.terms ?? '',
  items: invoice.items.map((item, index) => ({
    key: `${invoice.id}-${index}-${item.itemId}`,
    itemId: item.itemId,
    itemCode: item.itemCode,
    itemName: item.itemName,
    description: '',
    type: item.type,
    quantity: item.type === 'Service' ? 1 : item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    discount: item.discount,
    taxRate: item.taxRate,
  })),
  payment: createEmptyInitialPayment(invoice.invoiceDate.slice(0, 10)),
});

export const createEmptyInvoiceLine = (): InvoiceLineForm => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  itemId: '',
  itemCode: '',
  itemName: '',
  description: '',
  type: '',
  quantity: 1,
  unit: '',
  unitPrice: 0,
  discount: 0,
  taxRate: 0,
});

export const createDefaultInvoiceForm = (): InvoiceFormState => {
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);

  return {
    customerId: '',
    invoiceDate: isoDate,
    dueDate: '',
    status: 'Unpaid',
    notes: '',
    terms: '',
    items: [createEmptyInvoiceLine()],
    payment: createEmptyInitialPayment(isoDate),
  };
};
