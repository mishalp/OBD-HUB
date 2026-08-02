import { PaymentMethod } from '../models/payment.model';
import { InvoicePaymentStatus, InvoiceStatus } from '../../invoices/models/invoice.model';

export interface SafePayment {
  id: string;
  businessId: string;
  invoiceId: string;
  customerId: string;
  paymentNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
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
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  grandTotal: number;
  totalPaid: number;
  outstandingBalance: number;
  invoiceDate: Date;
  dueDate: Date | null;
}

export interface PaymentListItem extends SafePayment {
  customer: PaymentCustomerSummary | null;
  invoice: PaymentInvoiceSummary | null;
  recordedByName: string | null;
}

export interface PaymentDetails extends SafePayment {
  customer: PaymentCustomerSummary | null;
  invoice: PaymentInvoiceSummary | null;
  recordedByName: string | null;
}

export interface PaymentHistoryItem {
  id: string;
  paymentNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  recordedBy: string;
  recordedByName: string | null;
  createdAt: Date;
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

export interface PaymentListResult {
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

export interface CreatePaymentResult {
  payment: SafePayment;
  invoice: {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    paymentStatus: InvoicePaymentStatus;
    grandTotal: number;
    totalPaid: number;
    outstandingBalance: number;
  };
}
