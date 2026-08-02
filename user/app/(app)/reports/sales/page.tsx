'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { reportsApi } from '@/lib/api/reports';
import { customersApi } from '@/lib/api/customers';
import { itemsApi } from '@/lib/api/items';
import type { Customer } from '@/lib/types/customer';
import type { Item } from '@/lib/types/item';
import type {
  ReportFilters,
  SalesSummary,
  SalesTrendPoint,
  TopCustomer,
  TopItem,
  TopLimit,
  TrendGranularity,
} from '@/lib/types/report';
import { createDefaultReportFilters } from '@/lib/types/report';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { ReportSummaryCard } from '@/components/reports/ReportSummaryCard';
import { ReportFilterBar } from '@/components/reports/ReportFilterBar';
import { ReportNavTabs } from '@/components/reports/ReportNavTabs';
import { TrendChart } from '@/components/reports/TrendChart';
import { TopItemsTable } from '@/components/reports/TopItemsTable';
import { TopCustomersTable } from '@/components/reports/TopCustomersTable';

const EXPORT_MESSAGE = 'Export will be implemented in a future module.';

const isFilterReady = (filters: ReportFilters): boolean => {
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

export default function SalesReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>(createDefaultReportFilters);
  const [granularity, setGranularity] = useState<TrendGranularity>('daily');
  const [itemsLimit, setItemsLimit] = useState<TopLimit>(10);
  const [customersLimit, setCustomersLimit] = useState<TopLimit>(10);
  const [refreshToken, setRefreshToken] = useState(0);

  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [topItemsLoading, setTopItemsLoading] = useState(true);

  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topCustomersLoading, setTopCustomersLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const ready = isFilterReady(filters);

  // Filter option lists (fetched once).
  useEffect(() => {
    const loadOptions = async (): Promise<void> => {
      try {
        const [customerResponse, itemResponse] = await Promise.all([
          customersApi.list({
            page: 1,
            limit: 100,
            search: '',
            sortBy: 'name',
            sortOrder: 'asc',
            status: 'active',
          }),
          itemsApi.list({
            page: 1,
            limit: 100,
            search: '',
            type: 'all',
            status: 'active',
            stockStatus: 'all',
            category: '',
            sortBy: 'name',
            sortOrder: 'asc',
          }),
        ]);
        setCustomers(customerResponse.customers);
        setItems(itemResponse.items);
      } catch {
        // Filter options are non-critical; ignore load failures.
      }
    };

    void loadOptions();
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;
    const load = async (): Promise<void> => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const response = await reportsApi.salesSummary(filters);
        if (!cancelled) {
          setSummary(response.summary);
        }
      } catch (err) {
        if (!cancelled) {
          setSummaryError(resolveError(err, 'Unable to load sales summary.'));
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
  }, [filters, ready, refreshToken]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;
    const load = async (): Promise<void> => {
      setTrendLoading(true);
      try {
        const response = await reportsApi.salesTrend(filters, granularity);
        if (!cancelled) {
          setTrend(response.trend);
        }
      } catch {
        if (!cancelled) {
          setTrend([]);
        }
      } finally {
        if (!cancelled) {
          setTrendLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [filters, granularity, ready, refreshToken]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;
    const load = async (): Promise<void> => {
      setTopItemsLoading(true);
      try {
        const response = await reportsApi.topItems(filters, itemsLimit);
        if (!cancelled) {
          setTopItems(response.items);
        }
      } catch {
        if (!cancelled) {
          setTopItems([]);
        }
      } finally {
        if (!cancelled) {
          setTopItemsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [filters, itemsLimit, ready, refreshToken]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;
    const load = async (): Promise<void> => {
      setTopCustomersLoading(true);
      try {
        const response = await reportsApi.topCustomers(filters, customersLimit);
        if (!cancelled) {
          setTopCustomers(response.customers);
        }
      } catch {
        if (!cancelled) {
          setTopCustomers([]);
        }
      } finally {
        if (!cancelled) {
          setTopCustomersLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [filters, customersLimit, ready, refreshToken]);

  const handleRefresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  const summaryBusy = ready && summaryLoading;
  const trendBusy = ready && trendLoading;
  const topItemsBusy = ready && topItemsLoading;
  const topCustomersBusy = ready && topCustomersLoading;
  const anyLoading = summaryBusy || trendBusy || topItemsBusy || topCustomersBusy;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6">
        <div>
          <div className="mb-3">
            <ReportNavTabs active="sales" />
          </div>
          <h2 className="text-2xl font-semibold text-[#111827]">Sales Reports</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6B7280]">
            Analyse sales performance, collections, and top performers across any date range.
            Reports are generated dynamically from your invoices and payments.
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

      <ReportFilterBar
        filters={filters}
        onChange={setFilters}
        onRefresh={handleRefresh}
        customers={customers}
        items={items}
        isLoading={anyLoading}
      />

      {!ready ? (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
          Select a valid custom date range (from date must not be after to date) to view reports.
        </div>
      ) : null}

      {summaryError ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {summaryError}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportSummaryCard
          title="Gross Sales"
          value={formatMoney(summary?.grossSales ?? 0)}
          description="Total invoiced value"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Net Sales"
          value={formatMoney(summary?.netSales ?? 0)}
          description="Sales excluding tax"
          accent="info"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Collected Amount"
          value={formatMoney(summary?.collectedAmount ?? 0)}
          description="Payments received"
          accent="success"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Outstanding Amount"
          value={formatMoney(summary?.outstandingAmount ?? 0)}
          description="Yet to be collected"
          accent="warning"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Invoice Count"
          value={String(summary?.invoiceCount ?? 0)}
          description="Invoices in period"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Average Invoice Value"
          value={formatMoney(summary?.averageInvoiceValue ?? 0)}
          description="Gross sales per invoice"
          accent="info"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Collection Rate"
          value={`${(summary?.collectionRate ?? 0).toFixed(1)}%`}
          description="Collected vs gross sales"
          accent="success"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Discount Total"
          value={formatMoney(summary?.discountTotal ?? 0)}
          description="Discounts given"
          accent="warning"
          isLoading={summaryBusy}
        />
      </section>

      <TrendChart
        data={trend}
        granularity={granularity}
        onGranularityChange={setGranularity}
        isLoading={trendBusy}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <TopItemsTable
          items={topItems}
          limit={itemsLimit}
          onLimitChange={setItemsLimit}
          isLoading={topItemsBusy}
        />
        <TopCustomersTable
          customers={topCustomers}
          limit={customersLimit}
          onLimitChange={setCustomersLimit}
          isLoading={topCustomersBusy}
        />
      </div>
    </div>
  );
}
