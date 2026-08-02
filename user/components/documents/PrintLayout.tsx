import type { ReactNode } from 'react';
import { InvoiceDocumentTemplate } from '@/components/documents/InvoiceDocumentTemplate';
import type { InvoiceDetails } from '@/lib/types/invoice';

interface PrintLayoutProps {
  invoice: InvoiceDetails;
  generatedAt: string;
  toolbar?: ReactNode;
}

/**
 * A4 portrait print layout. Application chrome is excluded by the (print) route group.
 * Screen toolbar is hidden via print CSS.
 */
export const PrintLayout = ({ invoice, generatedAt, toolbar }: PrintLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#f5f5f5] print:bg-white">
      {toolbar ? (
        <div className="sticky top-0 z-10 border-b border-[#e5e5e5] bg-white px-4 py-3 print:hidden">
          {toolbar}
        </div>
      ) : null}

      <div className="mx-auto px-4 py-6 print:p-0">
        <div className="rounded-sm bg-white p-6 shadow-sm print:rounded-none print:p-0 print:shadow-none">
          <InvoiceDocumentTemplate invoice={invoice} generatedAt={generatedAt} />
        </div>
      </div>

      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        @media print {
          html,
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};
