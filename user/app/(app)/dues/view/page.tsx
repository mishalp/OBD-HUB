'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { duesApi } from '@/lib/api/dues';
import { ApiClientError } from '@/lib/api/client';
import type { DueDetails } from '@/lib/types/due';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { DueStatusBadge } from '@/components/dues/DueStatusBadge';
import { AgeingBadge } from '@/components/dues/AgeingBadge';
import { PaymentMethodBadge } from '@/components/payments/PaymentMethodBadge';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import { EmptyState } from '@/components/dashboard/EmptyState';

const formatDate = (value: string | null): string => {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

function DueDetailsContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id') || searchParams.get('invoiceId') || '';

  const [due, setDue] = useState<DueDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        if (!invoiceId) {
          if (!cancelled) {
            setIsLoading(false);
            setError('No invoice ID provided.');
          }
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const response = await duesApi.getByInvoiceId(invoiceId);
          if (!cancelled) {
            setDue(response.due);
          }
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof ApiClientError ? err.message : 'Unable to load due details.',
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
  }, [invoiceId, reloadToken]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading due details...</p>
      </div>
    );
  }

  if (error || !due) {
    return (
      <div className="space-y-4">
        <Link href="/dues" className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]">
          ← Back to dues
        </Link>
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error ?? 'Due record not found.'}
        </div>
      </div>
    );
  }

  const customer = due.customer;
  const customerAddress = customer
    ? [
        customer.addressLine1,
        customer.addressLine2,
        customer.city,
        customer.state,
        customer.postalCode,
        customer.country,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dues" className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]">
            ← Back to dues
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-[#111827]">{due.invoiceNumber}</h2>
            <DueStatusBadge status={due.dueStatus} />
            <AgeingBadge bucket={due.ageingBucket} />
          </div>
          <p className="mt-1 text-sm text-[#6B7280]">
            Receivable details derived from invoice and payment records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/invoices/view?id=${due.invoiceId}`}
            className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
          >
            View Invoice
          </Link>
          {customer ? (
            <Link
              href={`/customers/view?id=${customer.id}`}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
            >
              View Customer
            </Link>
          ) : null}
          {due.quickActions.recordPayment ? (
            <button
              type="button"
              onClick={() => setIsRecordOpen(true)}
              className="rounded-md bg-[#D32F2F] px-3 py-2 text-sm font-semibold text-white hover:bg-[#B71C1C]"
            >
              Record Payment
            </button>
          ) : (
            <span
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#cbd5e1]"
              title="No outstanding balance"
            >
              Record Payment
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-base font-semibold text-[#111827]">Invoice Summary</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Invoice Number</dt>
              <dd className="mt-1 text-sm font-medium text-[#111827]">{due.invoiceNumber}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Payment Status</dt>
              <dd className="mt-1">
                <PaymentStatusBadge status={due.paymentStatus} />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Invoice Date</dt>
              <dd className="mt-1 text-sm text-[#111827]">{formatDate(due.invoiceDate)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Due Date</dt>
              <dd className="mt-1 text-sm text-[#111827]">{formatDate(due.dueDate)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-base font-semibold text-[#111827]">Customer Summary</h3>
          {customer ? (
            <div className="mt-4 space-y-1 text-sm text-[#374151]">
              <p className="font-medium text-[#111827]">
                {customer.name}{' '}
                <span className="text-xs text-[#6B7280]">({customer.customerCode})</span>
              </p>
              {customerAddress ? <p>{customerAddress}</p> : null}
              <p>{customer.phone}</p>
              {customer.email ? <p>{customer.email}</p> : null}
              {customer.gstNumber ? <p>GST: {customer.gstNumber}</p> : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#6B7280]">Customer information unavailable.</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Outstanding Summary</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Grand Total</dt>
            <dd className="mt-1 text-lg font-semibold text-[#111827]">
              {formatMoney(due.grandTotal)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Total Paid</dt>
            <dd className="mt-1 text-lg font-semibold text-[#15803D]">
              {formatMoney(due.totalPaid)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Outstanding</dt>
            <dd className="mt-1 text-lg font-semibold text-[#B45309]">
              {formatMoney(due.outstandingBalance)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Days Overdue</dt>
            <dd className="mt-1 text-lg font-semibold text-[#111827]">{due.daysOverdue}</dd>
          </div>
        </dl>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Due Status</dt>
            <dd className="mt-1">
              <DueStatusBadge status={due.dueStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Ageing Bucket</dt>
            <dd className="mt-1">
              <AgeingBadge bucket={due.ageingBucket} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Days Outstanding</dt>
            <dd className="mt-1 text-sm font-medium text-[#111827]">{due.daysOutstanding}</dd>
          </div>
        </dl>
      </section>

      <section className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <h3 className="text-base font-semibold text-[#111827]">Payment History</h3>
        </div>
        {due.payments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No payments recorded"
              description="Payments against this invoice will appear here."
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
            <thead className="bg-[#FAFAFA]">
              <tr>
                <th className="px-4 py-3 font-medium text-[#6B7280]">Payment #</th>
                <th className="px-4 py-3 font-medium text-[#6B7280]">Date</th>
                <th className="px-4 py-3 font-medium text-[#6B7280]">Amount</th>
                <th className="px-4 py-3 font-medium text-[#6B7280]">Method</th>
                <th className="px-4 py-3 font-medium text-[#6B7280]">Reference</th>
                <th className="px-4 py-3 font-medium text-[#6B7280]">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {due.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 font-medium text-[#111827]">
                    <Link href={`/payments/view?id=${payment.id}`} className="hover:text-[#D32F2F]">
                      {payment.paymentNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#374151]">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#111827]">
                    {formatMoney(payment.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentMethodBadge method={payment.paymentMethod} />
                  </td>
                  <td className="px-4 py-3 text-[#374151]">
                    {payment.referenceNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-[#374151]">
                    {payment.recordedByName || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <RecordPaymentModal
        open={isRecordOpen}
        lockedInvoice={{
          id: due.invoiceId,
          invoiceNumber: due.invoiceNumber,
          grandTotal: due.grandTotal,
          totalPaid: due.totalPaid,
          outstandingBalance: due.outstandingBalance,
          customer: customer ? { name: customer.name } : null,
        }}
        onClose={() => setIsRecordOpen(false)}
        onSuccess={() => setReloadToken((prev) => prev + 1)}
      />
    </div>
  );
}

export default function DueDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-[#6B7280]">Loading due details...</p>
        </div>
      }
    >
      <DueDetailsContent />
    </Suspense>
  );
}
