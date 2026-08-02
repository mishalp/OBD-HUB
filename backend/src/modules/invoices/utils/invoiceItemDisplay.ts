export type InvoiceLineItemType = 'Product' | 'Service';

export const isServiceItem = (type: InvoiceLineItemType | string | null | undefined): boolean =>
  type === 'Service';

export const isProductItem = (type: InvoiceLineItemType | string | null | undefined): boolean =>
  type === 'Product';

export const showsQuantityFields = (type: InvoiceLineItemType | string | null | undefined): boolean =>
  isProductItem(type);

/**
 * Compact rate for PDF cells.
 * Product: "2 pcs × Rs.500.00"
 * Service: "Rs.500.00"
 */
export const formatInvoiceItemRate = (
  item: {
    type: InvoiceLineItemType | string;
    quantity: number;
    unit: string;
    unitPrice: number;
  },
  formatMoney: (value: number) => string,
): string => {
  const price = formatMoney(item.unitPrice);

  if (isServiceItem(item.type)) {
    return price;
  }

  const qty = Number.isFinite(item.quantity) ? item.quantity : 0;
  const unit = item.unit?.trim() || '';
  return unit ? `${qty} ${unit} x ${price}` : `${qty} x ${price}`;
};
