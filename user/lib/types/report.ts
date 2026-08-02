export const REPORT_PERIODS = [
  'today',
  'yesterday',
  'last_7_days',
  'last_30_days',
  'current_month',
  'previous_month',
  'current_year',
  'custom',
] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 Days',
  last_30_days: 'Last 30 Days',
  current_month: 'Current Month',
  previous_month: 'Previous Month',
  current_year: 'Current Year',
  custom: 'Custom Range',
};

export const TREND_GRANULARITIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type TrendGranularity = (typeof TREND_GRANULARITIES)[number];

export const TREND_GRANULARITY_LABELS: Record<TrendGranularity, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export type ReportPaymentStatus = 'all' | 'Unpaid' | 'Partially Paid' | 'Paid';
export type ReportInvoiceStatus = 'all' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Cancelled';
export type ReportPaymentMethod =
  | 'all'
  | 'Cash'
  | 'UPI'
  | 'Card'
  | 'Bank Transfer'
  | 'Cheque'
  | 'Other';

export type TopLimit = 5 | 10 | 20;

export interface ReportFilters {
  period: ReportPeriod;
  fromDate: string;
  toDate: string;
  customer: string;
  item: string;
  paymentStatus: ReportPaymentStatus;
  invoiceStatus: ReportInvoiceStatus;
  paymentMethod: ReportPaymentMethod;
}

export interface ReportDateRangeMeta {
  period: string;
  granularity?: string;
  fromDate: string;
  toDate: string;
}

export interface SalesSummary {
  grossSales: number;
  discountTotal: number;
  taxTotal: number;
  netSales: number;
  invoiceCount: number;
  averageInvoiceValue: number;
  collectedAmount: number;
  outstandingAmount: number;
  collectionRate: number;
}

export interface SalesSummaryResponse {
  summary: SalesSummary;
  meta: ReportDateRangeMeta;
}

export interface SalesTrendPoint {
  date: string;
  grossSales: number;
  collectedAmount: number;
  outstandingAmount: number;
  invoiceCount: number;
}

export interface SalesTrendResponse {
  trend: SalesTrendPoint[];
  meta: ReportDateRangeMeta;
}

export interface TopItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantitySold: number;
  revenue: number;
  invoiceCount: number;
}

export interface TopItemsResponse {
  items: TopItem[];
  meta: ReportDateRangeMeta & { limit: number };
}

export interface TopCustomer {
  customerId: string;
  customerCode: string;
  name: string;
  phone: string | null;
  revenue: number;
  invoiceCount: number;
  outstandingAmount: number;
}

export interface TopCustomersResponse {
  customers: TopCustomer[];
  meta: ReportDateRangeMeta & { limit: number };
}

export const createDefaultReportFilters = (): ReportFilters => ({
  period: 'last_30_days',
  fromDate: '',
  toDate: '',
  customer: '',
  item: '',
  paymentStatus: 'all',
  invoiceStatus: 'all',
  paymentMethod: 'all',
});
