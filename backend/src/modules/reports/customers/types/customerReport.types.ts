export interface ReportDateRangeMeta {
  period: string;
  fromDate: string;
  toDate: string;
}

export type CustomerReportStatus = 'new' | 'active' | 'inactive' | 'repeat';

export interface CustomerReportSummary {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  repeatCustomers: number;
  totalRevenue: number;
  averageRevenuePerCustomer: number;
  outstandingAmount: number;
  averageInvoiceValue: number;
  averagePaymentTime: number | null;
  invoiceCount: number;
}

export interface AcquisitionTrendPoint {
  date: string;
  count: number;
}

export interface RevenueByCustomerPoint {
  customerId: string;
  name: string;
  revenue: number;
}

export interface PurchaseFrequencyBucket {
  label: string;
  count: number;
}

export interface CustomerReportSummaryResult {
  summary: CustomerReportSummary;
  charts: {
    acquisitionTrend: AcquisitionTrendPoint[];
    revenueByCustomer: RevenueByCustomerPoint[];
    purchaseFrequency: PurchaseFrequencyBucket[];
  };
  meta: ReportDateRangeMeta;
}

export interface CustomerReportListItem {
  customerId: string;
  customerCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  customerStatus: CustomerReportStatus;
  invoiceCount: number;
  revenue: number;
  outstandingAmount: number;
  averageInvoiceValue: number;
  lastPurchaseDate: string | null;
  createdAt: string;
}

export interface CustomerReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CustomerReportListResult {
  customers: CustomerReportListItem[];
  pagination: CustomerReportPagination;
  meta: ReportDateRangeMeta & {
    search: string | null;
    status: string;
    customerType: string;
    sortBy: string;
    sortOrder: string;
    outstandingOnly: boolean;
  };
}

export interface CustomerReportTopItem {
  customerId: string;
  customerCode: string;
  name: string;
  phone: string | null;
  revenue: number;
  invoiceCount: number;
  outstandingAmount: number;
  averageInvoiceValue: number;
  lastPurchaseDate: string | null;
}

export interface CustomerReportTopResult {
  customers: CustomerReportTopItem[];
  meta: ReportDateRangeMeta & { limit: number };
}

export interface CustomerReportInfo {
  id: string;
  customerCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  gstNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerReportInvoiceSummary {
  invoiceCount: number;
  revenue: number;
  averageInvoiceValue: number;
  draftCount: number;
  paidCount: number;
  unpaidCount: number;
  partiallyPaidCount: number;
}

export interface CustomerReportPaymentSummary {
  paymentCount: number;
  totalCollected: number;
  averagePayment: number;
  averagePaymentTime: number | null;
}

export interface CustomerReportOutstandingSummary {
  outstandingAmount: number;
  outstandingInvoiceCount: number;
}

export interface PurchaseTimelineItem {
  date: string;
  type: 'invoice' | 'payment';
  label: string;
  amount: number;
  referenceId: string;
  status?: string;
}

export interface RecentInvoiceItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
  grandTotal: number;
  outstandingBalance: number;
}

export interface RecentPaymentItem {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  invoiceNumber: string | null;
}

export interface CustomerRevenueTrendPoint {
  date: string;
  grossSales: number;
  collectedAmount: number;
  outstandingAmount: number;
  invoiceCount: number;
}

export interface CustomerDetailReportResult {
  customer: CustomerReportInfo;
  customerStatus: CustomerReportStatus;
  lifetimeValue: number;
  invoiceSummary: CustomerReportInvoiceSummary;
  paymentSummary: CustomerReportPaymentSummary;
  outstandingSummary: CustomerReportOutstandingSummary;
  purchaseTimeline: PurchaseTimelineItem[];
  recentInvoices: RecentInvoiceItem[];
  recentPayments: RecentPaymentItem[];
  revenueTrend: CustomerRevenueTrendPoint[];
  meta: ReportDateRangeMeta;
}
