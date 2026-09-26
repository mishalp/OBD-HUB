'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { paymentsApi } from '@/lib/api/payments';
import { ApiClientError } from '@/lib/api/client';
import type { PaymentDetails } from '@/lib/types/payment';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { PaymentMethodBadge } from '@/components/payments/PaymentMethodBadge';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';

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

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function PaymentDetailsContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('id') || '';

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        if (!paymentId) {
          if (!cancelled) {
            setIsLoading(false);
            setError('No payment ID provided.');
          }
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const response = await paymentsApi.getById(paymentId);
          if (!cancelled) {
            setPayment(response.payment);
          }
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof ApiClientError ? err.message : 'Unable to load payment.',
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
  }, [paymentId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading payment...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-4">
        <Link href="/payments" className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]">
          ← Back to payments
        </Link>
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error ?? 'Payment not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/payments" className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]">
          ← Back to payments
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold text-[#111827]">{payment.paymentNumber}</h2>
          <PaymentMethodBadge method={payment.paymentMethod} />
        </div>
        <p className="mt-1 text-sm text-[#6B7280]">Payment details and audit information.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-base font-semibold text-[#111827]">Payment Information</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Payment Number</dt>
              <dd className="mt-1 text-sm font-medium text-[#111827]">{payment.paymentNumber}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Amount</dt>
              <dd className="mt-1 text-sm font-semibold text-[#111827]">
                {formatMoney(payment.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Payment Date</dt>
              <dd className="mt-1 text-sm text-[#111827]">{formatDate(payment.paymentDate)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Method</dt>
              <dd className="mt-1">
                <PaymentMethodBadge method={payment.paymentMethod} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-base font-semibold text-[#111827]">Invoice Information</h3>
          {payment.invoice ? (
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Invoice</dt>
                <dd className="mt-1 text-sm font-medium text-[#111827]">
                  <Link
                    href={`/invoices/view?id=${payment.invoice.id}`}
                    className="hover:text-[#D32F2F]"
                  >
                    {payment.invoice.invoiceNumber}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Status</dt>
                <dd className="mt-1">
                  <PaymentStatusBadge status={payment.invoice.paymentStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Grand Total</dt>
                <dd className="mt-1 text-sm text-[#111827]">
                  {formatMoney(payment.invoice.grandTotal)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Outstanding</dt>
                <dd className="mt-1 text-sm text-[#111827]">
                  {formatMoney(payment.invoice.outstandingBalance)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-[#6B7280]">Invoice details unavailable.</p>
          )}
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-base font-semibold text-[#111827]">Customer Information</h3>
          {payment.customer ? (
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Name</dt>
                <dd className="mt-1 text-sm font-medium text-[#111827]">{payment.customer.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Code</dt>
                <dd className="mt-1 text-sm text-[#111827]">{payment.customer.customerCode}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Phone</dt>
                <dd className="mt-1 text-sm text-[#111827]">{payment.customer.phone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Email</dt>
                <dd className="mt-1 text-sm text-[#111827]">{payment.customer.email || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-[#6B7280]">Customer details unavailable.</p>
          )}
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-base font-semibold text-[#111827]">Payment Details</h3>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Reference</dt>
              <dd className="mt-1 text-sm text-[#111827]">{payment.referenceNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-[#111827]">
                {payment.notes || '—'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Audit Information</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Recorded By</dt>
            <dd className="mt-1 text-sm text-[#111827]">{payment.recordedByName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Created At</dt>
            <dd className="mt-1 text-sm text-[#111827]">{formatDateTime(payment.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Updated At</dt>
            <dd className="mt-1 text-sm text-[#111827]">{formatDateTime(payment.updatedAt)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export default function PaymentDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-[#6B7280]">Loading payment...</p>
        </div>
      }
    >
      <PaymentDetailsContent />
    </Suspense>
  );
}
