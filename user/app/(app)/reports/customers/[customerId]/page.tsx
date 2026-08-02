'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ApiClientError } from '@/lib/api/client';
import { reportsApi } from '@/lib/api/reports';
import type { CustomerDetailReportResponse } from '@/lib/types/customerReport';
import type { ReportPeriod } from '@/lib/types/report';
import { REPORT_PERIOD_LABELS, createDefaultReportFilters } from '@/lib/types/report';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { ReportNavTabs } from '@/components/reports/ReportNavTabs';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import { TrendChart } from '@/components/reports/TrendChart';
import { EmptyReportState } from '@/components/reports/EmptyReportState';
import { CustomerProfileHeader } from '@/components/reports/customers/CustomerProfileHeader';
import { CustomerRevenueCard } from '@/components/reports/customers/CustomerRevenueCard';
import { CustomerOutstandingCard } from '@/components/reports/customers/CustomerOutstandingCard';
import { CustomerTimeline } from '@/components/reports/customers/CustomerTimeline';

const QUICK_PERIODS: ReportPeriod[] = [
  'last_7_days',
  'last_30_days',
  'current_month',
  'previous_month',
  'current_year',
  'custom',
];

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function CustomerProfileReportPage() {
  const params = useParams<{ customerId: string }>();
  const customerId = params.customerId;

  const defaults = createDefaultReportFilters();
  const [period, setPeriod] = useState<ReportPeriod>(defaults.period);
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [refreshToken, setRefreshToken] = useState(0);

  const [report, setReport] = useState<CustomerDetailReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ready =
    period !== 'custom' ||
    (Boolean(fromDate) &&
      Boolean(toDate) &&
      new Date(fromDate) <= new Date(toDate));

  useEffect(() => {
    if (!customerId || !ready) {
      return;
    }

    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await reportsApi.customerDetail(customerId, {
          period,
          fromDate,
          toDate,
        });
        if (!cancelled) {
          setReport(response);
        }
      } catch (err) {
        if (!cancelled) {
          setReport(null);
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'Unable to load customer report.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [customerId, period, fromDate, toDate, ready, refreshToken]);

  const handleRefresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <ReportNavTabs active="customers" />
            <Link
              href="/reports/customers"
              className="text-xs font-medium text-[#D32F2F] hover:underline"
            >
              ← Back to Customer Reports
            </Link>
          </div>
          <h2 className="text-2xl font-semibold text-[#111827]">Customer Profile Report</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6B7280]">
            Detailed revenue, outstanding, and purchase history for this customer.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="rounded-lg bg-[#D32F2F] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#B71C1C] disabled:opacity-60"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex flex-wrap gap-2">
          {QUICK_PERIODS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              aria-pressed={period === option}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                period === option
                  ? 'border-[#D32F2F] bg-[#FEF2F2] text-[#D32F2F]'
                  : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#cbd5e1]'
              }`}
            >
              {REPORT_PERIOD_LABELS[option]}
            </button>
          ))}
        </div>
        {period === 'custom' ? (
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onChange={(range) => {
              setFromDate(range.fromDate);
              setToDate(range.toDate);
            }}
          />
        ) : null}
      </section>

      {!ready ? (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
          Select a valid custom date range to view this report.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      ) : null}

      {isLoading && !report ? (
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-xl bg-[#F3F4F6]" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-48 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-48 animate-pulse rounded-xl bg-[#F3F4F6]" />
          </div>
        </div>
      ) : null}

      {!isLoading && !report && !error ? (
        <EmptyReportState title="Customer report unavailable" />
      ) : null}

      {report ? (
        <>
          <CustomerProfileHeader
            customer={report.customer}
            customerStatus={report.customerStatus}
            lifetimeValueLabel={formatMoney(report.lifetimeValue)}
          />

          <div className="grid gap-6 xl:grid-cols-2">
            <CustomerRevenueCard
              revenue={formatMoney(report.invoiceSummary.revenue)}
              invoiceCount={report.invoiceSummary.invoiceCount}
              averageInvoice={formatMoney(report.invoiceSummary.averageInvoiceValue)}
              paidCount={report.invoiceSummary.paidCount}
              unpaidCount={report.invoiceSummary.unpaidCount}
              partiallyPaidCount={report.invoiceSummary.partiallyPaidCount}
            />
            <CustomerOutstandingCard
              outstandingAmount={formatMoney(report.outstandingSummary.outstandingAmount)}
              outstandingInvoiceCount={report.outstandingSummary.outstandingInvoiceCount}
              totalCollected={formatMoney(report.paymentSummary.totalCollected)}
              paymentCount={report.paymentSummary.paymentCount}
              averagePayment={formatMoney(report.paymentSummary.averagePayment)}
              averagePaymentTime={report.paymentSummary.averagePaymentTime}
            />
          </div>

          <TrendChart
            data={report.revenueTrend}
            granularity="daily"
            showGranularity={false}
            title="Revenue Trend"
            description="Daily revenue, collections, and outstanding for this customer."
            isLoading={isLoading}
          />

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <h3 className="text-base font-semibold text-[#111827]">Recent Invoices</h3>
              {report.recentInvoices.length === 0 ? (
                <div className="mt-4">
                  <EmptyReportState title="No invoices in this period" />
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-left text-xs uppercase tracking-wide text-[#6B7280]">
                        <th className="px-2 py-2 font-medium">Invoice</th>
                        <th className="px-2 py-2 font-medium">Date</th>
                        <th className="px-2 py-2 font-medium">Status</th>
                        <th className="px-2 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.recentInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-[#F3F4F6]">
                          <td className="px-2 py-2">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="font-medium text-[#D32F2F] hover:underline"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-2 py-2 text-[#6B7280]">
                            {formatDate(invoice.invoiceDate)}
                          </td>
                          <td className="px-2 py-2 text-[#6B7280]">{invoice.status}</td>
                          <td className="px-2 py-2 text-right font-medium text-[#111827]">
                            {formatMoney(invoice.grandTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <h3 className="text-base font-semibold text-[#111827]">Recent Payments</h3>
              {report.recentPayments.length === 0 ? (
                <div className="mt-4">
                  <EmptyReportState title="No payments in this period" />
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-left text-xs uppercase tracking-wide text-[#6B7280]">
                        <th className="px-2 py-2 font-medium">Payment</th>
                        <th className="px-2 py-2 font-medium">Date</th>
                        <th className="px-2 py-2 font-medium">Method</th>
                        <th className="px-2 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.recentPayments.map((payment) => (
                        <tr key={payment.id} className="border-b border-[#F3F4F6]">
                          <td className="px-2 py-2">
                            <Link
                              href={`/payments/${payment.id}`}
                              className="font-medium text-[#D32F2F] hover:underline"
                            >
                              {payment.paymentNumber}
                            </Link>
                          </td>
                          <td className="px-2 py-2 text-[#6B7280]">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="px-2 py-2 text-[#6B7280]">
                            {payment.paymentMethod}
                          </td>
                          <td className="px-2 py-2 text-right font-medium text-[#111827]">
                            {formatMoney(payment.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <CustomerTimeline items={report.purchaseTimeline} isLoading={isLoading} />
        </>
      ) : null}
    </div>
  );
}
