'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { invoicesApi } from '@/lib/api/invoices';
import { paymentsApi } from '@/lib/api/payments';
import { ApiClientError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type { InvoiceDetails } from '@/lib/types/invoice';
import { isEditableInvoiceStatus, canRecordInvoicePayment } from '@/lib/types/invoice';
import type { PaymentHistoryItem } from '@/lib/types/payment';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { InvoiceDetailsCard } from '@/components/invoices/InvoiceDetailsCard';
import { InvoiceTimeline } from '@/components/invoices/InvoiceTimeline';
import { InvoiceDeleteDialog } from '@/components/invoices/InvoiceDeleteDialog';
import { PaymentHistoryTable } from '@/components/payments/PaymentHistoryTable';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';

function InvoiceDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const invoiceId = searchParams.get('id') || '';

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
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
          const response = await invoicesApi.getById(invoiceId);
          if (!cancelled) {
            setInvoice(response.invoice);
          }
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof ApiClientError ? err.message : 'Unable to load invoice.',
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

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        if (!invoiceId) {
          if (!cancelled) {
            setIsPaymentsLoading(false);
          }
          return;
        }

        setIsPaymentsLoading(true);

        try {
          const response = await paymentsApi.listForInvoice(invoiceId);
          if (!cancelled) {
            setPayments(response.payments);
          }
        } catch {
          if (!cancelled) {
            setPayments([]);
          }
        } finally {
          if (!cancelled) {
            setIsPaymentsLoading(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [invoiceId, reloadToken]);

  const handleDelete = async (): Promise<void> => {
    if (!invoice) {
      return;
    }

    setIsDeleting(true);

    try {
      await invoicesApi.remove(invoice.id);
      showToast('Invoice deleted successfully');
      router.replace('/invoices');
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : 'Unable to delete invoice.',
        'error',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPdf = async (): Promise<void> => {
    if (!invoice || isDownloadingPdf) {
      return;
    }

    setIsDownloadingPdf(true);

    try {
      const { blob, fileName } = await invoicesApi.downloadPdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast('PDF downloaded');
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : 'Unable to download PDF.',
        'error',
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Link href="/invoices" className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]">
          ← Back to invoices
        </Link>
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error ?? 'Invoice not found.'}
        </div>
      </div>
    );
  }

  const editable = isEditableInvoiceStatus(invoice.status);
  const canRecordPayment = canRecordInvoicePayment(invoice);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/invoices"
            className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
          >
            ← Back to invoices
          </Link>
          <h2 className="mt-2 text-2xl font-semibold text-[#111827]">Invoice Details</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void handleDownloadPdf();
            }}
            disabled={isDownloadingPdf}
            className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:opacity-60"
          >
            {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
          </button>
          <Link
            href={`/invoices/print?id=${invoice.id}`}
            className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
          >
            Print Invoice
          </Link>
          {editable ? (
            <Link
              href={`/invoices/edit?id=${invoice.id}`}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
            >
              Edit
            </Link>
          ) : (
            <span
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#cbd5e1]"
              title={`A ${invoice.status} invoice cannot be edited`}
            >
              Edit
            </span>
          )}
          {canRecordPayment ? (
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
              title={
                invoice.status === 'Paid'
                  ? 'Paid invoices cannot receive additional payments'
                  : 'This invoice cannot receive payments'
              }
            >
              Record Payment
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="rounded-md border border-[#FECACA] px-3 py-2 text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <InvoiceDetailsCard invoice={invoice} />
        <InvoiceTimeline invoice={invoice} />
      </div>

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[#111827]">Payment Summary</h3>
          <PaymentStatusBadge status={invoice.paymentStatus} />
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Grand Total</dt>
            <dd className="mt-1 text-lg font-semibold text-[#111827]">
              {formatMoney(invoice.grandTotal)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Total Paid</dt>
            <dd className="mt-1 text-lg font-semibold text-[#15803D]">
              {formatMoney(invoice.totalPaid)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
              Outstanding Balance
            </dt>
            <dd className="mt-1 text-lg font-semibold text-[#B45309]">
              {formatMoney(invoice.outstandingBalance)}
            </dd>
          </div>
        </dl>
      </section>

      <PaymentHistoryTable payments={payments} isLoading={isPaymentsLoading} />

      <InvoiceDeleteDialog
        open={isDeleteOpen}
        invoiceNumber={invoice.invoiceNumber}
        isDeleting={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      <RecordPaymentModal
        open={isRecordOpen}
        lockedInvoice={{
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          grandTotal: invoice.grandTotal,
          totalPaid: invoice.totalPaid,
          outstandingBalance: invoice.outstandingBalance,
          customer: invoice.customer
            ? { name: invoice.customer.name }
            : null,
        }}
        onClose={() => setIsRecordOpen(false)}
        onSuccess={() => {
          setReloadToken((prev) => prev + 1);
        }}
      />
    </div>
  );
}

export default function InvoiceDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-[#6B7280]">Loading invoice...</p>
        </div>
      }
    >
      <InvoiceDetailsContent />
    </Suspense>
  );
}
