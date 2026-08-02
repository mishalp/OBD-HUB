import { apiRequest } from '@/lib/api/client';
import type {
  ReportFilters,
  SalesSummaryResponse,
  SalesTrendResponse,
  TopCustomersResponse,
  TopItemsResponse,
  TopLimit,
  TrendGranularity,
} from '@/lib/types/report';
import type {
  CustomerDetailReportResponse,
  CustomerReportFilters,
  CustomerReportListResponse,
  CustomerReportSummaryResponse,
  CustomerReportTopResponse,
} from '@/lib/types/customerReport';
import type {
  InvoiceReportFilters,
  InvoiceReportListResponse,
  InvoiceReportSummaryResponse,
  InvoiceStatusResponse,
  InvoiceTrendResponse,
} from '@/lib/types/invoiceReport';

const appendFilters = (params: URLSearchParams, filters: ReportFilters): void => {
  params.set('period', filters.period);
  params.set('fromDate', filters.fromDate);
  params.set('toDate', filters.toDate);
  params.set('customer', filters.customer);
  params.set('item', filters.item);
  params.set('paymentStatus', filters.paymentStatus);
  params.set('invoiceStatus', filters.invoiceStatus);
  params.set('paymentMethod', filters.paymentMethod);
};

const baseQuery = (filters: ReportFilters): URLSearchParams => {
  const params = new URLSearchParams();
  appendFilters(params, filters);
  return params;
};

const appendPeriod = (
  params: URLSearchParams,
  filters: Pick<CustomerReportFilters, 'period' | 'fromDate' | 'toDate'>,
): void => {
  params.set('period', filters.period);
  params.set('fromDate', filters.fromDate);
  params.set('toDate', filters.toDate);
};

/** Shared filter params accepted by every invoice report endpoint. */
const invoiceBaseQuery = (filters: InvoiceReportFilters): URLSearchParams => {
  const params = new URLSearchParams();
  params.set('period', filters.period);
  params.set('fromDate', filters.fromDate);
  params.set('toDate', filters.toDate);
  params.set('search', filters.search);
  params.set('status', filters.status);
  params.set('paymentStatus', filters.paymentStatus);
  params.set('customer', filters.customer);
  params.set('outstandingOnly', String(filters.outstandingOnly));
  params.set('overdueOnly', String(filters.overdueOnly));
  if (filters.minAmount.trim()) {
    params.set('minAmount', filters.minAmount.trim());
  }
  if (filters.maxAmount.trim()) {
    params.set('maxAmount', filters.maxAmount.trim());
  }
  return params;
};

export const reportsApi = {
  salesSummary(filters: ReportFilters): Promise<SalesSummaryResponse> {
    return apiRequest<SalesSummaryResponse>(
      `/api/reports/sales/summary?${baseQuery(filters).toString()}`,
    );
  },

  salesTrend(
    filters: ReportFilters,
    granularity: TrendGranularity,
  ): Promise<SalesTrendResponse> {
    const params = baseQuery(filters);
    params.set('granularity', granularity);
    return apiRequest<SalesTrendResponse>(
      `/api/reports/sales/trend?${params.toString()}`,
    );
  },

  topItems(filters: ReportFilters, limit: TopLimit): Promise<TopItemsResponse> {
    const params = baseQuery(filters);
    params.set('limit', String(limit));
    return apiRequest<TopItemsResponse>(
      `/api/reports/sales/top-items?${params.toString()}`,
    );
  },

  topCustomers(filters: ReportFilters, limit: TopLimit): Promise<TopCustomersResponse> {
    const params = baseQuery(filters);
    params.set('limit', String(limit));
    return apiRequest<TopCustomersResponse>(
      `/api/reports/sales/top-customers?${params.toString()}`,
    );
  },

  customerSummary(
    filters: Pick<CustomerReportFilters, 'period' | 'fromDate' | 'toDate'>,
  ): Promise<CustomerReportSummaryResponse> {
    const params = new URLSearchParams();
    appendPeriod(params, filters);
    return apiRequest<CustomerReportSummaryResponse>(
      `/api/reports/customers/summary?${params.toString()}`,
    );
  },

  customerList(filters: CustomerReportFilters): Promise<CustomerReportListResponse> {
    const params = new URLSearchParams();
    appendPeriod(params, filters);
    params.set('page', String(filters.page));
    params.set('limit', String(filters.limit));
    params.set('search', filters.search);
    params.set('status', filters.status);
    params.set('customerType', filters.customerType);
    params.set('outstandingOnly', String(filters.outstandingOnly));
    params.set('sortBy', filters.sortBy);
    params.set('sortOrder', filters.sortOrder);
    if (filters.minRevenue.trim()) {
      params.set('minRevenue', filters.minRevenue.trim());
    }
    if (filters.maxRevenue.trim()) {
      params.set('maxRevenue', filters.maxRevenue.trim());
    }
    return apiRequest<CustomerReportListResponse>(
      `/api/reports/customers/list?${params.toString()}`,
    );
  },

  customerTop(
    filters: Pick<CustomerReportFilters, 'period' | 'fromDate' | 'toDate'>,
    limit: TopLimit,
  ): Promise<CustomerReportTopResponse> {
    const params = new URLSearchParams();
    appendPeriod(params, filters);
    params.set('limit', String(limit));
    return apiRequest<CustomerReportTopResponse>(
      `/api/reports/customers/top?${params.toString()}`,
    );
  },

  customerDetail(
    customerId: string,
    filters: Pick<CustomerReportFilters, 'period' | 'fromDate' | 'toDate'>,
  ): Promise<CustomerDetailReportResponse> {
    const params = new URLSearchParams();
    appendPeriod(params, filters);
    return apiRequest<CustomerDetailReportResponse>(
      `/api/reports/customers/${customerId}?${params.toString()}`,
    );
  },

  invoiceSummary(filters: InvoiceReportFilters): Promise<InvoiceReportSummaryResponse> {
    return apiRequest<InvoiceReportSummaryResponse>(
      `/api/reports/invoices/summary?${invoiceBaseQuery(filters).toString()}`,
    );
  },

  invoiceStatus(filters: InvoiceReportFilters): Promise<InvoiceStatusResponse> {
    return apiRequest<InvoiceStatusResponse>(
      `/api/reports/invoices/status?${invoiceBaseQuery(filters).toString()}`,
    );
  },

  invoiceTrend(
    filters: InvoiceReportFilters,
    granularity: TrendGranularity,
  ): Promise<InvoiceTrendResponse> {
    const params = invoiceBaseQuery(filters);
    params.set('granularity', granularity);
    return apiRequest<InvoiceTrendResponse>(
      `/api/reports/invoices/trend?${params.toString()}`,
    );
  },

  invoiceList(filters: InvoiceReportFilters): Promise<InvoiceReportListResponse> {
    const params = invoiceBaseQuery(filters);
    params.set('page', String(filters.page));
    params.set('limit', String(filters.limit));
    params.set('sortBy', filters.sortBy);
    params.set('sortOrder', filters.sortOrder);
    return apiRequest<InvoiceReportListResponse>(
      `/api/reports/invoices/list?${params.toString()}`,
    );
  },
};
