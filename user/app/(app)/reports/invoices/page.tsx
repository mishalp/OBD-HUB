'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { reportsApi } from '@/lib/api/reports';
import { customersApi } from '@/lib/api/customers';
import type { Customer } from '@/lib/types/customer';
import type {
  InvoiceReportFilters,
  InvoiceReportListItem,
  InvoiceReportPagination,
  InvoiceReportSortBy,
  InvoiceReportSummary,
  InvoiceStatusBreakdownItem,
  InvoiceTrendPoint,
} from '@/lib/types/invoiceReport';
import { createDefaultInvoiceReportFilters } from '@/lib/types/invoiceReport';
import type { TrendGranularity } from '@/lib/types/report';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { ReportSummaryCard } from '@/components/reports/ReportSummaryCard';
import { ReportNavTabs } from '@/components/reports/ReportNavTabs';
import { InvoiceKpiCards } from '@/components/reports/invoices/InvoiceKpiCards';
import { InvoiceReportFilterBar } from '@/components/reports/invoices/InvoiceReportFilterBar';
import { InvoiceReportTable } from '@/components/reports/invoices/InvoiceReportTable';
import { InvoiceStatusChart } from '@/components/reports/invoices/InvoiceStatusChart';
import { InvoiceTrendChart } from '@/components/reports/invoices/InvoiceTrendChart';

const EXPORT_MESSAGE = 'Export functionality will be implemented in a future module.';

const isFilterReady = (filters: InvoiceReportFilters): boolean => {
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

export default function InvoiceReportsPage() {
  const [filters, setFilters] = useState<InvoiceReportFilters>(
    createDefaultInvoiceReportFilters,
  );
  const [granularity, setGranularity] = useState<TrendGranularity>('daily');
  const [refreshToken, setRefreshToken] = useState(0);

  const [summary, setSummary] = useState<InvoiceReportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [statuses, setStatuses] = useState<InvoiceStatusBreakdownItem[]>([]);
  const [statusTotal, setStatusTotal] = useState(0);
  const [statusLoading, setStatusLoading] = useState(true);

  const [trend, setTrend] = useState<InvoiceTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  const [invoices, setInvoices] = useState<InvoiceReportListItem[]>([]);
  const [pagination, setPagination] = useState<InvoiceReportPagination | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const ready = isFilterReady(filters);

  // Customer options for the filter bar (fetched once).
  useEffect(() => {
    const loadCustomers = async (): Promise<void> => {
      try {
        const response = await customersApi.list({
          page: 1,
          limit: 100,
          search: '',
          sortBy: 'name',
          sortOrder: 'asc',
          status: 'active',
        });
        setCustomers(response.customers);
      } catch {
        // Filter options are non-critical; ignore load failures.
      }
    };

    void loadCustomers();
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
        const response = await reportsApi.invoiceSummary(filters);
        if (!cancelled) {
          setSummary(response.summary);
        }
      } catch (err) {
        if (!cancelled) {
          setSummaryError(resolveError(err, 'Unable to load invoice summary.'));
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
      setStatusLoading(true);
      try {
        const response = await reportsApi.invoiceStatus(filters);
        if (!cancelled) {
          setStatuses(response.statuses);
          setStatusTotal(response.totals.invoiceCount);
        }
      } catch {
        if (!cancelled) {
          setStatuses([]);
          setStatusTotal(0);
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
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
        const response = await reportsApi.invoiceTrend(filters, granularity);
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
      setListLoading(true);
      setListError(null);
      try {
        const response = await reportsApi.invoiceList(filters);
        if (!cancelled) {
          setInvoices(response.invoices);
          setPagination(response.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setListError(resolveError(err, 'Unable to load invoice list.'));
          setInvoices([]);
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

  const handleRefresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  const handleSortChange = (sortBy: InvoiceReportSortBy): void => {
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
  const statusBusy = ready && statusLoading;
  const trendBusy = ready && trendLoading;
  const listBusy = ready && listLoading;
  const anyLoading = summaryBusy || statusBusy || trendBusy || listBusy;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6">
        <div>
          <div className="mb-3">
            <ReportNavTabs active="invoices" />
          </div>
          <h2 className="text-2xl font-semibold text-[#111827]">Invoice Reports</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6B7280]">
            Track invoice volume, status distribution, collections, and outstanding
            balances. All figures are derived from stored invoice and payment totals.
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

      <InvoiceReportFilterBar
        filters={filters}
        onChange={setFilters}
        onRefresh={handleRefresh}
        customers={customers}
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
          title="Total Invoices"
          value={String(summary?.totalInvoices ?? 0)}
          description="Including drafts"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Gross Invoice Amount"
          value={formatMoney(summary?.grossInvoiceAmount ?? 0)}
          description="Excludes drafts and cancelled"
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
          description={`${summary?.outstandingInvoiceCount ?? 0} open invoices`}
          accent="warning"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Collection Rate"
          value={`${(summary?.collectionRate ?? 0).toFixed(1)}%`}
          description="Collected vs invoiced"
          accent="success"
          isLoading={summaryBusy}
        />
        <ReportSummaryCard
          title="Average Invoice Value"
          value={formatMoney(summary?.averageInvoiceValue ?? 0)}
          description="Per non-draft invoice"
          accent="info"
          isLoading={summaryBusy}
        />
      </section>

      <InvoiceKpiCards summary={summary} isLoading={summaryBusy} />

      <div className="grid gap-6 xl:grid-cols-2">
        <InvoiceStatusChart
          statuses={statuses}
          totalInvoices={statusTotal}
          isLoading={statusBusy}
        />
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-base font-semibold text-[#111827]">Receivables Health</h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            Overdue exposure and average balances for the period.
          </p>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-[#FFFBEB] px-3 py-3">
              <dt className="text-sm text-[#B45309]">Overdue Amount</dt>
              <dd className="text-lg font-semibold text-[#111827]">
                {formatMoney(summary?.overdueAmount ?? 0)}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-3">
              <dt className="text-sm text-[#6B7280]">Overdue Invoices</dt>
              <dd className="text-lg font-semibold text-[#111827]">
                {summary?.overdueInvoiceCount ?? 0}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-3">
              <dt className="text-sm text-[#6B7280]">Avg Outstanding Balance</dt>
              <dd className="text-lg font-semibold text-[#111827]">
                {formatMoney(summary?.averageOutstandingBalance ?? 0)}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-3">
              <dt className="text-sm text-[#6B7280]">Avg Days to Payment</dt>
              <dd className="text-sm font-medium text-[#9CA3AF]">
                {summary?.averageDaysToPayment === null ||
                summary?.averageDaysToPayment === undefined
                  ? 'Coming soon (placeholder)'
                  : `${summary.averageDaysToPayment} days`}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <InvoiceTrendChart
        data={trend}
        granularity={granularity}
        onGranularityChange={setGranularity}
        isLoading={trendBusy}
      />

      {listError ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {listError}
        </div>
      ) : null}

      <InvoiceReportTable
        invoices={invoices}
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
