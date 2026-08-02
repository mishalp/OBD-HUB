import type { InvoiceDetails } from '@/lib/types/invoice';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { formatInvoiceItemRate } from '@/lib/utils/invoiceItemDisplay';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';

interface InvoiceDetailsCardProps {
  invoice: InvoiceDetails;
}

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

export const InvoiceDetailsCard = ({ invoice }: InvoiceDetailsCardProps) => {
  const symbol = invoice.business.currencySymbol || '₹';
  const customer = invoice.customer;

  const businessAddress = [
    invoice.business.addressLine1,
    invoice.business.addressLine2,
    invoice.business.city,
    invoice.business.state,
    invoice.business.postalCode,
    invoice.business.country,
  ]
    .filter(Boolean)
    .join(', ');

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
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Invoice
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#111827]">
              {invoice.invoiceNumber}
            </h2>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Invoice Date</dt>
            <dd className="mt-1 text-sm text-[#111827]">{formatDate(invoice.invoiceDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Due Date</dt>
            <dd className="mt-1 text-sm text-[#111827]">{formatDate(invoice.dueDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Created By</dt>
            <dd className="mt-1 text-sm text-[#111827]">{invoice.createdByName || '—'}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-base font-semibold text-[#111827]">From</h3>
          <div className="mt-3 space-y-1 text-sm text-[#374151]">
            <p className="font-medium text-[#111827]">{invoice.business.businessName}</p>
            {businessAddress ? <p>{businessAddress}</p> : null}
            <p>{invoice.business.phone}</p>
            <p>{invoice.business.email}</p>
            {invoice.business.gstEnabled && invoice.business.gstNumber ? (
              <p>GST: {invoice.business.gstNumber}</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-base font-semibold text-[#111827]">Bill To</h3>
          {customer ? (
            <div className="mt-3 space-y-1 text-sm text-[#374151]">
              <p className="font-medium text-[#111827]">
                {customer.name}{' '}
                <span className="text-xs text-[#6B7280]">({customer.customerCode})</span>
              </p>
              {customerAddress ? <p>{customerAddress}</p> : null}
              <p>{customer.phone || '—'}</p>
              {customer.email ? <p>{customer.email}</p> : null}
              {customer.gstNumber ? <p>GST: {customer.gstNumber}</p> : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#6B7280]">Customer information unavailable.</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] px-4 py-3">
          <h3 className="text-base font-semibold text-[#111827]">Invoice Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full divide-y divide-[#E5E7EB] text-left text-sm">
            <thead className="bg-[#FAFAFA] text-xs uppercase tracking-wide text-[#6B7280]">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Tax %</th>
                <th className="px-4 py-3">Tax Amount</th>
                <th className="px-4 py-3">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {invoice.items.map((item, index) => (
                <tr key={`${item.itemId}-${index}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#111827]">{item.itemName}</p>
                    <p className="text-xs text-[#6B7280]">
                      {item.itemCode} · {item.type}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[#374151]">
                    {formatInvoiceItemRate(item, symbol)}
                  </td>
                  <td className="px-4 py-3 text-[#374151]">
                    {formatMoney(item.discount, symbol)}
                  </td>
                  <td className="px-4 py-3 text-[#374151]">{item.taxRate}%</td>
                  <td className="px-4 py-3 text-[#374151]">
                    {formatMoney(item.taxAmount, symbol)}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#111827]">
                    {formatMoney(item.lineTotal, symbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-5">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Notes</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-[#374151]">
              {invoice.notes || '—'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Terms & Conditions</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-[#374151]">
              {invoice.terms || '—'}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-base font-semibold text-[#111827]">Summary</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#6B7280]">Subtotal</dt>
              <dd className="font-medium text-[#111827]">{formatMoney(invoice.subtotal, symbol)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#6B7280]">Discount Total</dt>
              <dd className="font-medium text-[#111827]">
                {formatMoney(invoice.discountTotal, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#6B7280]">Tax Total</dt>
              <dd className="font-medium text-[#111827]">{formatMoney(invoice.taxTotal, symbol)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3">
              <dt className="text-base font-semibold text-[#111827]">Grand Total</dt>
              <dd className="text-lg font-semibold text-[#D32F2F]">
                {formatMoney(invoice.grandTotal, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#6B7280]">Total Paid</dt>
              <dd className="font-medium text-[#15803D]">
                {formatMoney(invoice.totalPaid, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#6B7280]">Outstanding</dt>
              <dd className="font-medium text-[#B45309]">
                {formatMoney(invoice.outstandingBalance, symbol)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
};
