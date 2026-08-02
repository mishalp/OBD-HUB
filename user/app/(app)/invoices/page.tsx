'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { invoicesApi } from '@/lib/api/invoices';
import { ApiClientError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type {
  InvoiceListItem,
  InvoiceListQuery,
  InvoicePagination,
  InvoiceStatistics,
  InvoiceStatus,
} from '@/lib/types/invoice';
import { InvoiceSearchBar } from '@/components/invoices/InvoiceSearchBar';
import { InvoiceFilters } from '@/components/invoices/InvoiceFilters';
import { InvoiceSummaryCards } from '@/components/invoices/InvoiceSummaryCards';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoiceTableSkeleton } from '@/components/invoices/InvoiceTableSkeleton';
import { InvoiceDeleteDialog } from '@/components/invoices/InvoiceDeleteDialog';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import type { PayableInvoiceOption } from '@/components/payments/PaymentForm';

export default function InvoicesPage() {
  const { showToast } = useToast();

  const [query, setQuery] = useState<InvoiceListQuery>({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    customer: '',
    fromDate: '',
    toDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [pagination, setPagination] = useState<InvoicePagination | null>(null);
  const [statistics, setStatistics] = useState<InvoiceStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<InvoiceListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<PayableInvoiceOption | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await invoicesApi.list(query);
          if (!cancelled) {
            setInvoices(response.invoices);
            setPagination(response.pagination);
            setStatistics(response.statistics);
          }
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof ApiClientError ? err.message : 'Unable to load invoices.',
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

  const refreshInvoices = (): void => {
    setReloadToken((prev) => prev + 1);
  };

  const hasFilters = useMemo(
    () =>
      Boolean(query.search) ||
      query.status !== 'all' ||
      Boolean(query.customer) ||
      Boolean(query.fromDate) ||
      Boolean(query.toDate),
    [query.search, query.status, query.customer, query.fromDate, query.toDate],
  );

  const handleSort = (sortBy: InvoiceListQuery['sortBy']): void => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRecordPayment = (invoice: InvoiceListItem): void => {
    setPaymentTarget({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      grandTotal: invoice.grandTotal,
      totalPaid: invoice.totalPaid,
      outstandingBalance: invoice.outstandingBalance,
      customer: invoice.customer ? { name: invoice.customer.name } : null,
    });
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await invoicesApi.remove(deleteTarget.id);
      showToast('Invoice deleted successfully');
      setDeleteTarget(null);
      refreshInvoices();
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : 'Unable to delete invoice.',
        'error',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#111827]">Invoice Management</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            View, search, filter, edit, and manage your invoices.
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="rounded-md bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B71C1C]"
        >
          New Invoice
        </Link>
      </div>

      <InvoiceSummaryCards statistics={statistics} isLoading={isLoading && !statistics} />

      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <InvoiceSearchBar value={searchInput} onChange={setSearchInput} />
          </div>
          <button
            type="button"
            onClick={refreshInvoices}
            className="h-11 rounded-md border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
          >
            Refresh
          </button>
        </div>
        <InvoiceFilters
          status={query.status}
          fromDate={query.fromDate}
          toDate={query.toDate}
          onStatusChange={(status: 'all' | InvoiceStatus) =>
            setQuery((prev) => ({ ...prev, page: 1, status }))
          }
          onFromDateChange={(fromDate) =>
            setQuery((prev) => ({ ...prev, page: 1, fromDate }))
          }
          onToDateChange={(toDate) => setQuery((prev) => ({ ...prev, page: 1, toDate }))}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <InvoiceTableSkeleton />
      ) : (
        <InvoiceTable
          invoices={invoices}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          onSort={handleSort}
          onDelete={setDeleteTarget}
          onRecordPayment={handleRecordPayment}
          hasFilters={hasFilters}
        />
      )}

      {pagination && pagination.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#6B7280]">
            Showing page {pagination.page} of {pagination.totalPages} · {pagination.total}{' '}
            invoices
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

      <InvoiceDeleteDialog
        open={Boolean(deleteTarget)}
        invoiceNumber={deleteTarget?.invoiceNumber ?? ''}
        isDeleting={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      <RecordPaymentModal
        open={Boolean(paymentTarget)}
        lockedInvoice={paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onSuccess={() => {
          setPaymentTarget(null);
          refreshInvoices();
        }}
      />
    </div>
  );
}
