import { InvoicePaymentStatus, InvoiceStatus } from '../models/invoice.model';
import { roundMoney } from './invoiceCalculations';

export interface InvoicePaymentBalances {
  totalPaid: number;
  outstandingBalance: number;
  paymentStatus: InvoicePaymentStatus;
}

export interface InvoicePaymentSyncResult extends InvoicePaymentBalances {
  status: InvoiceStatus;
}

/**
 * Initial paymentStatus for a newly created (or draft) invoice.
 */
export const initialPaymentStatus = (
  invoiceStatus: InvoiceStatus,
): InvoicePaymentStatus => {
  if (invoiceStatus === 'Draft') {
    return 'Draft';
  }

  return 'Unpaid';
};

/**
 * outstandingBalance = grandTotal - totalPaid (never negative), rounded to 2 decimals.
 */
export const calculateOutstandingBalance = (
  grandTotal: number,
  totalPaid: number,
): number => roundMoney(Math.max(roundMoney(grandTotal) - roundMoney(totalPaid), 0));

/**
 * Payment status from outstanding vs grand total.
 * Draft invoices always keep paymentStatus = Draft.
 */
export const derivePaymentStatus = (
  grandTotal: number,
  outstandingBalance: number,
  invoiceStatus?: InvoiceStatus,
): InvoicePaymentStatus => {
  if (invoiceStatus === 'Draft') {
    return 'Draft';
  }

  const outstanding = roundMoney(outstandingBalance);
  const total = roundMoney(grandTotal);

  if (outstanding <= 0) {
    return 'Paid';
  }

  if (outstanding >= total) {
    return 'Unpaid';
  }

  return 'Partially Paid';
};

/**
 * Builds stored payment fields from grand total + sum of payments.
 */
export const buildPaymentBalances = (
  grandTotal: number,
  totalPaid: number,
  invoiceStatus?: InvoiceStatus,
): InvoicePaymentBalances => {
  const paid = roundMoney(Math.max(totalPaid, 0));
  const outstandingBalance = calculateOutstandingBalance(grandTotal, paid);

  return {
    totalPaid: paid,
    outstandingBalance,
    paymentStatus: derivePaymentStatus(grandTotal, outstandingBalance, invoiceStatus),
  };
};

/**
 * Sync balances and invoice status after a payment (or repair).
 * Preserves Draft and Cancelled invoice status.
 */
export const syncInvoicePaymentState = (
  grandTotal: number,
  totalPaid: number,
  currentStatus: InvoiceStatus,
): InvoicePaymentSyncResult => {
  const balances = buildPaymentBalances(grandTotal, totalPaid, currentStatus);

  if (currentStatus === 'Draft' || currentStatus === 'Cancelled') {
    return {
      ...balances,
      status: currentStatus,
    };
  }

  const paymentStatus = balances.paymentStatus;
  let status: InvoiceStatus = currentStatus;

  if (paymentStatus === 'Paid') {
    status = 'Paid';
  } else if (paymentStatus === 'Partially Paid') {
    status = 'Partially Paid';
  } else {
    status = 'Unpaid';
  }

  return {
    ...balances,
    paymentStatus,
    status,
  };
};
