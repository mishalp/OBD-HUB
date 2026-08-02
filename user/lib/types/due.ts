import type { InvoicePaymentStatus } from '@/lib/types/invoice';

export const DUE_STATUSES = ['Current', 'Outstanding', 'Overdue', 'Paid'] as const;
export type DueStatus = (typeof DUE_STATUSES)[number];

export const AGEING_BUCKETS = ['Current', '0-30', '31-60', '61-90', '91+'] as const;
export type AgeingBucket = (typeof AGEING_BUCKETS)[number];

export interface DueCustomerSummary {
  id: string;
  customerCode: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface DueListItem {
  invoiceId: string;
  invoiceNumber: string;
  customer: DueCustomerSummary | null;
  invoiceDate: string;
  dueDate: string | null;
  grandTotal: number;
  totalPaid: number;
  outstandingBalance: number;
  daysOutstanding: number;
  daysOverdue: number;
  dueStatus: DueStatus;
  paymentStatus: InvoicePaymentStatus;
  ageingBucket: AgeingBucket | null;
}

export interface DuePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DueListQuery {
  page: number;
  limit: number;
  search: string;
  customer: string;
  status: 'all' | DueStatus;
  fromDate: string;
  toDate: string;
  ageingBucket: 'all' | AgeingBucket;
  sortBy:
    | 'invoiceDate'
    | 'dueDate'
    | 'invoiceNumber'
    | 'grandTotal'
    | 'outstandingBalance'
    | 'daysOutstanding'
    | 'dueStatus';
  sortOrder: 'asc' | 'desc';
}

export interface DueListResponse {
  dues: DueListItem[];
  pagination: DuePagination;
  meta: {
    search: string | null;
    customer: string | null;
    status: string;
    fromDate: string | null;
    toDate: string | null;
    ageingBucket: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export interface AgeingBucketSummary {
  bucket: AgeingBucket;
  invoiceCount: number;
  outstandingAmount: number;
}

export interface TopOutstandingCustomer {
  customerId: string;
  customerCode: string;
  name: string;
  outstandingAmount: number;
  invoiceCount: number;
}

export interface DueSummary {
  totalOutstandingAmount: number;
  totalOverdueAmount: number;
  outstandingInvoiceCount: number;
  overdueInvoiceCount: number;
  averageCollectionPeriod: number | null;
  ageingBuckets: AgeingBucketSummary[];
  topOutstandingCustomers: TopOutstandingCustomer[];
}

export interface DuePaymentHistoryItem {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  recordedByName: string | null;
}

export interface DueDetails {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  status: string;
  paymentStatus: InvoicePaymentStatus;
  grandTotal: number;
  totalPaid: number;
  outstandingBalance: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  notes: string | null;
  terms: string | null;
  customer: DueCustomerSummary & {
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
    gstNumber: string | null;
  } | null;
  dueStatus: DueStatus;
  ageingBucket: AgeingBucket | null;
  daysOutstanding: number;
  daysOverdue: number;
  payments: DuePaymentHistoryItem[];
  quickActions: {
    viewInvoice: string;
    recordPayment: boolean;
  };
}
