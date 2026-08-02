'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { reportsApi } from '@/lib/api/reports';
import type {
  AcquisitionTrendPoint,
  CustomerReportFilters,
  CustomerReportListItem,
  CustomerReportPagination,
  CustomerReportSortBy,
  CustomerReportSummary,
  CustomerReportTopItem,
  PurchaseFrequencyBucket,
  RevenueByCustomerPoint,
  TopLimit,
} from '@/lib/types/customerReport';
import { createDefaultCustomerReportFilters } from '@/lib/types/customerReport';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { ReportSummaryCard } from '@/components/reports/ReportSummaryCard';
import { ReportNavTabs } from '@/components/reports/ReportNavTabs';
import { CustomerReportFilterBar } from '@/components/reports/customers/CustomerReportFilterBar';
import { CustomerReportTable } from '@/components/reports/customers/CustomerReportTable';
import { CustomerTopTable } from '@/components/reports/customers/CustomerTopTable';
import { CustomerTrendChart } from '@/components/reports/customers/CustomerTrendChart';

const EXPORT_MESSAGE = 'Export functionality will be implemented in a future module.';

const isFilterReady = (filters: CustomerReportFilters): boolean => {
  if (filters.period !== 'custom') {
    return true;
  }
  if (!filters.fromDate || !filters.toDate) {
    return false;
  }
  return new Date(filters.fromDate) <= new Date(filters.toDate);
};

const resolveError = (err: unknown, fallback: string): string => {
  if (err instanceof ApiClientError) {
    return err.message;
  }
  return fallback;
};

export default function CustomerReportsPage() {
  const [filters, setFilters] = useState<CustomerReportFilters>(
    createDefaultCustomerReportFilters,
  );
  const [topLimit, setTopLimit] = useState<TopLimit>(10);
  const [refreshToken, setRefreshToken] = useState(0);

  const [summary, setSummary] = useState<CustomerReportSummary | null>(null);
  const [acquisitionTrend, setAcquisitionTrend] = useState<AcquisitionTrendPoint[]>([]);
  const [revenueByCustomer, setRevenueByCustomer] = useState<RevenueByCustomerPoint[]>([]);
  const [purchaseFrequency, setPurchaseFrequency] = useState<PurchaseFrequencyBucket[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerReportListItem[]>([]);
  const [pagination, setPagination] = useState<CustomerReportPagination | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [topCustomers, setTopCustomers] = useState<CustomerReportTopItem[]>([]);
  const [topLoading, setTopLoading] = useState(true);

  const ready = isFilterReady(filters);
  const periodFilters = {
    period: filters.period,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;
    const load = async (): Promise<void> => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const response = await reportsApi.customerSummary(periodFilters);
        if (!cancelled) {
          setSummary(response.summary);
          setAcquisitionTrend(response.charts.acquisitionTrend);
          setRevenueByCustomer(response.charts.revenueByCustomer);
          setPurchaseFrequency(response.charts.purchaseFrequency);
        }
      } catch (err) {
        if (!cancelled) {
          setSummaryError(resolveError(err, 'Unable to load customer summary.'));
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- periodFilters derived from filters
  }, [filters.period, filters.fromDate, filters.toDate, ready, refreshToken]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;
    const load = async (): Promise<void> => {
      setListLoading(true);
      setListError(null);
      try {
        const response = await reportsApi.customerList(filters);
        if (!cancelled) {
          setCustomers(response.customers);
          setPagination(response.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setListError(resolveError(err, 'Unable to load customer list.'));
          setCustomers([]);
          setPagination(null);
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [filters, ready, refreshToken]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;
    const load = async (): Promise<void> => {
      setTopLoading(true);
      try {
        const response = await reportsApi.customerTop(periodFilters, topLimit);
        if (!cancelled) {
          setTopCustomers(response.customers);
        }
      } catch {
        if (!cancelled) {
          setTopCustomers([]);
        }
      } finally {
        if (!cancelled) {
          setTopLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- periodFilters derived from filters
  }, [filters.period, filters.fromDate, filters.toDate, topLimit, ready, refreshToken]);

  const handleRefresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  const handleSortChange = (sortBy: CustomerReportSortBy): void => {
    setFilters((current) => {
      if (current.sortBy === sortBy) {
        return {
          ...current,
          sortOrder: current.sortOrder === 'asc' ? 'desc' : 'asc',
          page: 1,
        };
      }
      return { ...current, sortBy, sortOrder: 'desc', page: 1 };
    });
  };

  const summaryBusy = ready && summaryLoading;
  const listBusy = ready && listLoading;
  const topBusy = ready && topLoading;
  const anyLoading = summaryBusy || listBusy || topBusy;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6">
        <div>
          <div className="mb-3">
            <ReportNavTabs active="customers" />
          </div>
          <h2 className="text-2xl font-semibold text-[#111827]">Customer Reports</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6B7280]">
            Analyse customer acquisition, revenue contribution, outstanding balances, and
            purchase behaviour. All metrics are calculated dynamically from invoices and
            payments.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              title={EXPORT_MESSAGE}
              className="cursor-not-allowed rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#9CA3AF]"
            >
              Export PDF
            </button>
            <button
              type="button"
              disabled
              title={EXPORT_MESSAGE}
              className="cursor-not-allowed rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#9CA3AF]"
            >
              Export Excel
            </button>
          </div>
          <p className="text-xs text-[#9CA3AF]">{EXPORT_MESSAGE}</p>
        </div>
      </section>

      <CustomerReportFilterBar
        filters={filters}
        onChange={setFilters}
        onRefresh={handleRefresh}
        isLoading={anyLoading}
      />

      {!ready ? (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
          Select a valid custom date range (from date must not be after to date) to view
          reports.
        </div>
      ) : null}

      {summaryError ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {summaryError}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ReportSummaryCard
          title="Total Customers"
          value={String(summary?.totalCustomers ?? 0)}
          description="Non-deleted customers"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="New Customers"
          value={String(summary?.newCustomers ?? 0)}
          description="Created in this period"
          accent="info"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Repeat Customers"
          value={String(summary?.repeatCustomers ?? 0)}
          description="2+ invoices in period"
          accent="success"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Total Revenue"
          value={formatMoney(summary?.totalRevenue ?? 0)}
          description="From completed invoices"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Outstanding Amount"
          value={formatMoney(summary?.outstandingAmount ?? 0)}
          description="Uncollected balance"
          accent="warning"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Avg Revenue / Customer"
          value={formatMoney(summary?.averageRevenuePerCustomer ?? 0)}
          description="Among active buyers"
          accent="info"
          isLoading={summaryBusy}
        />
      </section>

      <CustomerTrendChart
        acquisitionTrend={acquisitionTrend}
        revenueByCustomer={revenueByCustomer}
        purchaseFrequency={purchaseFrequency}
        isLoading={summaryBusy}
      />

      <CustomerTopTable
        customers={topCustomers}
        limit={topLimit}
        onLimitChange={setTopLimit}
        isLoading={topBusy}
      />

      {listError ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {listError}
        </div>
      ) : null}

      <CustomerReportTable
        customers={customers}
        pagination={pagination}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortChange={handleSortChange}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        isLoading={listBusy}
      />
    </div>
  );
}
