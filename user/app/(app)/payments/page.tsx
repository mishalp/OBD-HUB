'use client';

import { useEffect, useMemo, useState } from 'react';
import { paymentsApi } from '@/lib/api/payments';
import { customersApi } from '@/lib/api/customers';
import { ApiClientError } from '@/lib/api/client';
import type {
  PaymentListItem,
  PaymentListQuery,
  PaymentPagination,
  PaymentStatistics,
} from '@/lib/types/payment';
import { PaymentSummaryCards } from '@/components/payments/PaymentSummaryCard';
import { PaymentFilters } from '@/components/payments/PaymentFilters';
import { PaymentTable } from '@/components/payments/PaymentTable';
import { PaymentTableSkeleton } from '@/components/payments/PaymentTableSkeleton';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';

export default function PaymentsPage() {
  const [query, setQuery] = useState<PaymentListQuery>({
    page: 1,
    limit: 10,
    search: '',
    paymentMethod: 'all',
    customer: '',
    invoice: '',
    fromDate: '',
    toDate: '',
    sortBy: 'paymentDate',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [pagination, setPagination] = useState<PaymentPagination | null>(null);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await customersApi.list({
          page: 1,
          limit: 100,
          search: '',
          sortBy: 'name',
          sortOrder: 'asc',
          status: 'active',
        });
        if (!cancelled) {
          setCustomers(
            response.customers.map((customer) => ({
              id: customer.id,
              name: customer.name,
            })),
          );
        }
      } catch {
        // Filters still work without the customer dropdown options.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await paymentsApi.list(query);
          if (!cancelled) {
            setPayments(response.payments);
            setPagination(response.pagination);
            setStatistics(response.statistics);
          }
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof ApiClientError ? err.message : 'Unable to load payments.',
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, reloadToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({ ...prev, page: 1, search: searchInput.trim() }));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const refreshPayments = (): void => {
    setReloadToken((prev) => prev + 1);
  };

  const hasFilters = useMemo(
    () =>
      Boolean(query.search) ||
      query.paymentMethod !== 'all' ||
      Boolean(query.customer) ||
      Boolean(query.fromDate) ||
      Boolean(query.toDate),
    [query.search, query.paymentMethod, query.customer, query.fromDate, query.toDate],
  );

  const handleSort = (sortBy: PaymentListQuery['sortBy']): void => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#111827]">Payment Management</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Record payments, track collections, and keep invoice balances in sync.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsRecordOpen(true)}
          className="rounded-md bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B71C1C]"
        >
          Record Payment
        </button>
      </div>

      <PaymentSummaryCards statistics={statistics} isLoading={isLoading && !statistics} />

      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by payment number, reference, customer, or invoice"
              className="h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20"
              aria-label="Search payments"
            />
          </div>
          <button
            type="button"
            onClick={refreshPayments}
            className="h-11 rounded-md border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
          >
            Refresh
          </button>
        </div>
        <PaymentFilters
          paymentMethod={query.paymentMethod}
          fromDate={query.fromDate}
          toDate={query.toDate}
          customer={query.customer}
          customers={customers}
          onPaymentMethodChange={(paymentMethod) =>
            setQuery((prev) => ({ ...prev, page: 1, paymentMethod }))
          }
          onFromDateChange={(fromDate) =>
            setQuery((prev) => ({ ...prev, page: 1, fromDate }))
          }
          onToDateChange={(toDate) => setQuery((prev) => ({ ...prev, page: 1, toDate }))}
          onCustomerChange={(customer) =>
            setQuery((prev) => ({ ...prev, page: 1, customer }))
          }
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <PaymentTableSkeleton />
      ) : (
        <PaymentTable
          payments={payments}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          onSort={handleSort}
          hasFilters={hasFilters}
        />
      )}

      {pagination && pagination.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#6B7280]">
            Showing page {pagination.page} of {pagination.totalPages} · {pagination.total}{' '}
            payments
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <RecordPaymentModal
        open={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        onSuccess={() => {
          refreshPayments();
        }}
      />
    </div>
  );
}
