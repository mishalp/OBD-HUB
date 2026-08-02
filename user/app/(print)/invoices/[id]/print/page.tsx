'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { invoicesApi } from '@/lib/api/invoices';
import { ApiClientError } from '@/lib/api/client';
import type { InvoiceDetails } from '@/lib/types/invoice';
import { PrintLayout } from '@/components/documents/PrintLayout';

export default function InvoicePrintPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;
  const printedRef = useRef(false);

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await invoicesApi.getPrintDocument(invoiceId);
          if (!cancelled) {
            setInvoice(response.document);
            setGeneratedAt(response.generatedAt);
          }
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof ApiClientError ? err.message : 'Unable to load print document.',
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
  }, [invoiceId]);

  useEffect(() => {
    if (!invoice || printedRef.current) {
      return;
    }

    printedRef.current = true;
    const timer = window.setTimeout(() => {
      window.print();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [invoice]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#737373]">Preparing invoice for print...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-10">
        <Link href={`/invoices/${invoiceId}`} className="text-sm font-medium text-[#b91c1c]">
          ← Back to invoice
        </Link>
        <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error ?? 'Invoice not found.'}
        </div>
      </div>
    );
  }

  return (
    <PrintLayout
      invoice={invoice}
      generatedAt={generatedAt}
      toolbar={
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
          <Link
            href={`/invoices/${invoice.id}`}
            className="text-sm font-medium text-[#b91c1c] hover:underline"
          >
            ← Back to invoice
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-[#b91c1c] px-3 py-2 text-sm font-semibold text-white hover:bg-[#B91C1C]"
          >
            Print Again
          </button>
        </div>
      }
    />
  );
}
