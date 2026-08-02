import type { InvoiceDetails } from '@/lib/types/invoice';
import { formatDocumentDate } from '@/lib/documents/types';
import { DocumentBusinessHeader } from '@/components/documents/DocumentBusinessHeader';
import { DocumentCustomerSection } from '@/components/documents/DocumentCustomerSection';
import { DocumentItemsTable } from '@/components/documents/DocumentItemsTable';
import { DocumentSummary } from '@/components/documents/DocumentSummary';
import { DocumentFooter } from '@/components/documents/DocumentFooter';

interface InvoiceDocumentTemplateProps {
  invoice: InvoiceDetails;
  generatedAt?: string;
  title?: string;
}

/**
 * Shared invoice document template used by the print layout.
 * Structured so quotations / POs can reuse the same section components.
 */
export const InvoiceDocumentTemplate = ({
  invoice,
  generatedAt,
  title = 'INVOICE',
}: InvoiceDocumentTemplateProps) => {
  const symbol = invoice.business.currencySymbol || '₹';
  const generated = generatedAt ?? new Date().toISOString();

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white text-black">
      <DocumentBusinessHeader business={invoice.business} title={title} />

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <DocumentCustomerSection customer={invoice.customer} />
        <dl className="space-y-2 text-sm sm:text-right">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#737373]">Invoice Number</dt>
            <dd className="font-semibold">{invoice.invoiceNumber}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#737373]">Invoice Date</dt>
            <dd>{formatDocumentDate(invoice.invoiceDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#737373]">Due Date</dt>
            <dd>{formatDocumentDate(invoice.dueDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#737373]">Status</dt>
            <dd className="font-medium text-[#b91c1c]">{invoice.status}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6">
        <DocumentItemsTable items={invoice.items} currencySymbol={symbol} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-[#b91c1c]">Notes</h3>
            <p className="mt-1 whitespace-pre-line text-[#404040]">
              {invoice.notes || '—'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#b91c1c]">Terms & Conditions</h3>
            <p className="mt-1 whitespace-pre-line text-[#404040]">
              {invoice.terms || '—'}
            </p>
          </div>
        </div>
        <DocumentSummary
          subtotal={invoice.subtotal}
          discountTotal={invoice.discountTotal}
          taxTotal={invoice.taxTotal}
          grandTotal={invoice.grandTotal}
          currencySymbol={symbol}
        />
      </div>

      <DocumentFooter
        businessName={invoice.business.businessName}
        phone={invoice.business.phone}
        email={invoice.business.email}
        generatedAt={generated}
      />
    </article>
  );
};
