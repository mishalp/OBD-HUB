import type { ReportDateRangeMeta, ReportPeriod, TopLimit } from '@/lib/types/report';

export type CustomerReportStatus = 'new' | 'active' | 'inactive' | 'repeat';

export type CustomerAccountStatus = 'all' | 'active' | 'inactive';

export type CustomerTypeFilter = 'all' | CustomerReportStatus;

export type CustomerReportSortBy =
  | 'name'
  | 'revenue'
  | 'outstandingAmount'
  | 'invoiceCount'
  | 'lastPurchaseDate'
  | 'createdAt';

export interface CustomerReportFilters {
  period: ReportPeriod;
  fromDate: string;
  toDate: string;
  search: string;
  status: CustomerAccountStatus;
  customerType: CustomerTypeFilter;
  outstandingOnly: boolean;
  minRevenue: string;
  maxRevenue: string;
  sortBy: CustomerReportSortBy;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

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

export interface CustomerReportSummaryResponse {
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

export interface CustomerReportListResponse {
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

export interface CustomerReportTopResponse {
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

export interface CustomerDetailReportResponse {
  customer: CustomerReportInfo;
  customerStatus: CustomerReportStatus;
  lifetimeValue: number;
  invoiceSummary: {
    invoiceCount: number;
    revenue: number;
    averageInvoiceValue: number;
    draftCount: number;
    paidCount: number;
    unpaidCount: number;
    partiallyPaidCount: number;
  };
  paymentSummary: {
    paymentCount: number;
    totalCollected: number;
    averagePayment: number;
    averagePaymentTime: number | null;
  };
  outstandingSummary: {
    outstandingAmount: number;
    outstandingInvoiceCount: number;
  };
  purchaseTimeline: Array<{
    date: string;
    type: 'invoice' | 'payment';
    label: string;
    amount: number;
    referenceId: string;
    status?: string;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    status: string;
    grandTotal: number;
    outstandingBalance: number;
  }>;
  recentPayments: Array<{
    id: string;
    paymentNumber: string;
    paymentDate: string;
    amount: number;
    paymentMethod: string;
    invoiceNumber: string | null;
  }>;
  revenueTrend: Array<{
    date: string;
    grossSales: number;
    collectedAmount: number;
    outstandingAmount: number;
    invoiceCount: number;
  }>;
  meta: ReportDateRangeMeta;
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerReportStatus, string> = {
  new: 'New',
  active: 'Active',
  inactive: 'Inactive',
  repeat: 'Repeat',
};

export const createDefaultCustomerReportFilters = (): CustomerReportFilters => ({
  period: 'last_30_days',
  fromDate: '',
  toDate: '',
  search: '',
  status: 'all',
  customerType: 'all',
  outstandingOnly: false,
  minRevenue: '',
  maxRevenue: '',
  sortBy: 'revenue',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
});

export type { TopLimit };
