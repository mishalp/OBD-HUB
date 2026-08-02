export interface ReportDateRangeMeta {
  period: string;
  granularity?: string;
  fromDate: string;
  toDate: string;
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

export interface InvoiceReportSummaryResult {
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

export interface InvoiceStatusResult {
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

export interface InvoiceTrendResult {
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

export interface InvoiceReportListResult {
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
