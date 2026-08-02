import { InvoiceStatus, InvoiceItemType, InvoicePaymentStatus } from '../models/invoice.model';
import { SafeBusiness } from '../../business/types/business.types';

import { SafeTimelineEvent } from '../../timeline/types/timeline.types';

export interface SafeInvoiceItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  type: InvoiceItemType;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface SafeInvoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: Date;
  dueDate: Date | null;
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
  items: SafeInvoiceItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NextInvoiceNumberResult {
  invoiceNumber: string;
  prefix: string;
  nextNumber: number;
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

export interface InvoiceListItem extends SafeInvoice {
  customer: InvoiceCustomerSummary | null;
  createdByName: string | null;
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

export interface InvoiceListResult {
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

export interface InvoiceDetails extends SafeInvoice {
  customer: InvoiceCustomerDetails | null;
  business: SafeBusiness;
  createdByName: string | null;
  timeline: SafeTimelineEvent[];
}
