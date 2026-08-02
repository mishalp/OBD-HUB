import type { ReportDateRangeMeta, ReportPeriod, TrendGranularity } from '@/lib/types/report';

export type InvoiceReportStatus =
  | 'all'
  | 'Draft'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Paid'
  | 'Cancelled';

export type InvoiceReportPaymentStatus =
  | 'all'
  | 'Draft'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Paid';

export type InvoiceReportSortBy =
  | 'invoiceDate'
  | 'dueDate'
  | 'invoiceNumber'
  | 'grandTotal'
  | 'collectedAmount'
  | 'outstandingAmount'
  | 'createdAt';

export interface InvoiceReportFilters {
  period: ReportPeriod;
  fromDate: string;
  toDate: string;
  search: string;
  status: InvoiceReportStatus;
  paymentStatus: InvoiceReportPaymentStatus;
  customer: string;
  outstandingOnly: boolean;
  overdueOnly: boolean;
  minAmount: string;
  maxAmount: string;
  sortBy: InvoiceReportSortBy;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface InvoiceReportSummary {
  totalInvoices: number;
  draftCount: number;
  unpaidCount: number;
  partiallyPaidCount: number;
  paidCount: number;
  cancelledCount: number;
  grossInvoiceAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  averageInvoiceValue: number;
  collectionRate: number;
  averageOutstandingBalance: number;
  outstandingInvoiceCount: number;
  overdueInvoiceCount: number;
  overdueAmount: number;
  averageDaysToPayment: number | null;
}

export interface InvoiceReportSummaryResponse {
  summary: InvoiceReportSummary;
  meta: ReportDateRangeMeta;
}

export interface InvoiceStatusBreakdownItem {
  status: string;
  invoiceCount: number;
  totalAmount: number;
  percentage: number;
  amountPercentage: number;
}

export interface InvoiceStatusResponse {
  statuses: InvoiceStatusBreakdownItem[];
  totals: {
    invoiceCount: number;
    totalAmount: number;
  };
  meta: ReportDateRangeMeta;
}

export interface InvoiceTrendPoint {
  date: string;
  invoiceCount: number;
  invoiceValue: number;
  collectedAmount: number;
  outstandingAmount: number;
}

export interface InvoiceTrendResponse {
  trend: InvoiceTrendPoint[];
  meta: ReportDateRangeMeta;
}

export interface InvoiceReportListItem {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  invoiceDate: string;
  dueDate: string | null;
  grandTotal: number;
  collectedAmount: number;
  outstandingAmount: number;
  status: string;
  paymentStatus: string;
  isOverdue: boolean;
}

export interface InvoiceReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface InvoiceReportListResponse {
  invoices: InvoiceReportListItem[];
  pagination: InvoiceReportPagination;
  meta: ReportDateRangeMeta & {
    search: string | null;
    status: string;
    paymentStatus: string;
    sortBy: string;
    sortOrder: string;
    outstandingOnly: boolean;
    overdueOnly: boolean;
  };
}

export const INVOICE_REPORT_STATUS_COLORS: Record<string, string> = {
  Draft: '#9CA3AF',
  Unpaid: '#F59E0B',
  'Partially Paid': '#111111',
  Paid: '#16A34A',
  Cancelled: '#DC2626',
};

export const createDefaultInvoiceReportFilters = (): InvoiceReportFilters => ({
  period: 'last_30_days',
  fromDate: '',
  toDate: '',
  search: '',
  status: 'all',
  paymentStatus: 'all',
  customer: '',
  outstandingOnly: false,
  overdueOnly: false,
  minAmount: '',
  maxAmount: '',
  sortBy: 'invoiceDate',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
});

export type { TrendGranularity };
