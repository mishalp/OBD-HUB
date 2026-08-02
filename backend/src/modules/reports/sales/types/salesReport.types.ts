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

export interface SalesSummaryResult {
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

export interface SalesTrendResult {
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

export interface TopItemsResult {
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

export interface TopCustomersResult {
  customers: TopCustomer[];
  meta: ReportDateRangeMeta & { limit: number };
}
