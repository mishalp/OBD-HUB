import type { ItemType } from '@/lib/types/item';
import { formatMoney } from '@/lib/utils/invoiceCalculations';

export const isServiceItem = (type: ItemType | string | null | undefined): boolean =>
  type === 'Service';

export const isProductItem = (type: ItemType | string | null | undefined): boolean =>
  type === 'Product';

export const showsQuantityFields = (type: ItemType | string | null | undefined): boolean =>
  isProductItem(type);

/**
 * Compact rate display for invoice details / documents.
 * Product: "2 pcs × ₹500"
 * Service: "₹500"
 */
export const formatInvoiceItemRate = (
  item: {
    type: ItemType | string;
    quantity: number;
    unit: string;
    unitPrice: number;
  },
  currencySymbol = '₹',
): string => {
  const price = formatMoney(item.unitPrice, currencySymbol);

  if (isServiceItem(item.type)) {
    return price;
  }

  const qty = Number.isFinite(item.quantity) ? item.quantity : 0;
  const unit = item.unit?.trim() || '';
  return unit ? `${qty} ${unit} × ${price}` : `${qty} × ${price}`;
};

export const invoicePriceColumnLabel = (
  type: ItemType | string | null | undefined,
): string => (isServiceItem(type) ? 'Service Price' : 'Unit Price');
