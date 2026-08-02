export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Cheque',
  'Other',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type InvoicePaymentStatus = 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid';

export interface Payment {
  id: string;
  businessId: string;
  invoiceId: string;
  customerId: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCustomerSummary {
  id: string;
  customerCode: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface PaymentInvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentStatus: InvoicePaymentStatus;
  grandTotal: number;
  totalPaid: number;
  outstandingBalance: number;
  invoiceDate: string;
  dueDate: string | null;
}

export interface PaymentListItem extends Payment {
  customer: PaymentCustomerSummary | null;
  invoice: PaymentInvoiceSummary | null;
  recordedByName: string | null;
}

export interface PaymentDetails extends Payment {
  customer: PaymentCustomerSummary | null;
  invoice: PaymentInvoiceSummary | null;
  recordedByName: string | null;
}

export interface PaymentHistoryItem {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  recordedBy: string;
  recordedByName: string | null;
  createdAt: string;
}

export interface PaymentStatistics {
  totalPayments: number;
  todaysCollections: number;
  totalCollected: number;
  pendingAmount: number;
}

export interface PaymentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaymentListQuery {
  page: number;
  limit: number;
  search: string;
  paymentMethod: 'all' | PaymentMethod;
  customer: string;
  invoice: string;
  fromDate: string;
  toDate: string;
  sortBy: 'createdAt' | 'paymentDate' | 'paymentNumber' | 'amount' | 'paymentMethod';
  sortOrder: 'asc' | 'desc';
}

export interface PaymentListResponse {
  payments: PaymentListItem[];
  pagination: PaymentPagination;
  statistics: PaymentStatistics;
  meta: {
    search: string | null;
    paymentMethod: string;
    customer: string | null;
    invoice: string | null;
    fromDate: string | null;
    toDate: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export interface CreatePaymentPayload {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
}

export interface CreatePaymentResponse {
  payment: Payment;
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    paymentStatus: InvoicePaymentStatus;
    grandTotal: number;
    totalPaid: number;
    outstandingBalance: number;
  };
}

export interface PaymentFormState {
  invoiceId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod | '';
  referenceNumber: string;
  notes: string;
}

export const createDefaultPaymentForm = (): PaymentFormState => {
  const today = new Date().toISOString().slice(0, 10);

  return {
    invoiceId: '',
    amount: '',
    paymentDate: today,
    paymentMethod: '',
    referenceNumber: '',
    notes: '',
  };
};
