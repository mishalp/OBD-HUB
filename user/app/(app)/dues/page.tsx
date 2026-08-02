'use client';

import { useEffect, useMemo, useState } from 'react';
import { duesApi } from '@/lib/api/dues';
import { customersApi } from '@/lib/api/customers';
import { ApiClientError } from '@/lib/api/client';
import type {
  DueListItem,
  DueListQuery,
  DuePagination,
  DueSummary,
} from '@/lib/types/due';
import { DueSummaryCards } from '@/components/dues/DueSummaryCards';
import { AgeingCard } from '@/components/dues/AgeingCard';
import { OutstandingCustomerCard } from '@/components/dues/OutstandingCustomerCard';
import { DueFilters } from '@/components/dues/DueFilters';
import { DueTable } from '@/components/dues/DueTable';
import { DueTableSkeleton } from '@/components/dues/DueTableSkeleton';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';

export default function DuesPage() {
  const [query, setQuery] = useState<DueListQuery>({
    page: 1,
    limit: 10,
    search: '',
    customer: '',
    status: 'all',
    fromDate: '',
    toDate: '',
    ageingBucket: 'all',
    sortBy: 'dueDate',
    sortOrder: 'asc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [dues, setDues] = useState<DueListItem[]>([]);
  const [pagination, setPagination] = useState<DuePagination | null>(null);
  const [summary, setSummary] = useState<DueSummary | null>(null);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [recordTarget, setRecordTarget] = useState<DueListItem | null>(null);

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
        // Filters still work without dropdown options.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsSummaryLoading(true);
      try {
        const response = await duesApi.getSummary();
        if (!cancelled) {
          setSummary(response.summary);
        }
      } catch {
        if (!cancelled) {
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setIsSummaryLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await duesApi.list(query);
          if (!cancelled) {
            setDues(response.dues);
            setPagination(response.pagination);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof ApiClientError ? err.message : 'Unable to load dues.');
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

  const refresh = (): void => {
    setReloadToken((prev) => prev + 1);
  };

  const hasFilters = useMemo(
    () =>
      Boolean(query.search) ||
      query.status !== 'all' ||
      query.ageingBucket !== 'all' ||
      Boolean(query.customer) ||
      Boolean(query.fromDate) ||
      Boolean(query.toDate),
    [
      query.search,
      query.status,
      query.ageingBucket,
      query.customer,
      query.fromDate,
      query.toDate,
    ],
  );

  const handleSort = (sortBy: DueListQuery['sortBy']): void => {
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
          <h2 className="text-2xl font-semibold text-[#111827]">Due Management</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Track outstanding receivables, overdue invoices, and ageing analysis.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="h-11 rounded-md border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
        >
          Refresh
        </button>
      </div>

      <DueSummaryCards summary={summary} isLoading={isSummaryLoading && !summary} />

      <div className="grid gap-6 xl:grid-cols-2">
        <AgeingCard
          buckets={summary?.ageingBuckets ?? []}
          isLoading={isSummaryLoading && !summary}
        />
        <OutstandingCustomerCard
          customers={summary?.topOutstandingCustomers ?? []}
          isLoading={isSummaryLoading && !summary}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by invoice number, customer name, or phone"
              className="h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20"
              aria-label="Search dues"
            />
          </div>
        </div>
        <DueFilters
          status={query.status}
          ageingBucket={query.ageingBucket}
          fromDate={query.fromDate}
          toDate={query.toDate}
          customer={query.customer}
          customers={customers}
          onStatusChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))}
          onAgeingBucketChange={(ageingBucket) =>
            setQuery((prev) => ({ ...prev, page: 1, ageingBucket }))
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
        <DueTableSkeleton />
      ) : (
        <DueTable
          dues={dues}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          onSort={handleSort}
          onRecordPayment={setRecordTarget}
          hasFilters={hasFilters}
        />
      )}

      {pagination && pagination.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#6B7280]">
            Showing page {pagination.page} of {pagination.totalPages} · {pagination.total}{' '}
            dues
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
        open={Boolean(recordTarget)}
        lockedInvoice={
          recordTarget
            ? {
                id: recordTarget.invoiceId,
                invoiceNumber: recordTarget.invoiceNumber,
                grandTotal: recordTarget.grandTotal,
                totalPaid: recordTarget.totalPaid,
                outstandingBalance: recordTarget.outstandingBalance,
                customer: recordTarget.customer
                  ? { name: recordTarget.customer.name }
                  : null,
              }
            : null
        }
        onClose={() => setRecordTarget(null)}
        onSuccess={() => {
          refresh();
        }}
      />
    </div>
  );
}
