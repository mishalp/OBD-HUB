import { InvoiceStatus, InvoicePaymentStatus } from '../../invoices/models/invoice.model';
import { PaymentMethod } from '../../payments/models/payment.model';
import { InvoiceTimelineEventType } from '../models/invoiceTimeline.model';
import { RecordTimelineEventInput } from '../types/timeline.types';

const formatMoney = (value: number, symbol = '₹'): string => {
  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
};

export interface InvoiceCreatedEventParams {
  businessId: string;
  invoiceId: string;
  userId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  grandTotal: number;
  currencySymbol?: string;
}

export const buildInvoiceCreatedEvent = (
  params: InvoiceCreatedEventParams,
): RecordTimelineEventInput => ({
  businessId: params.businessId,
  invoiceId: params.invoiceId,
  eventType: 'INVOICE_CREATED',
  title: 'Invoice Created',
  description: `Invoice ${params.invoiceNumber} created.`,
  userId: params.userId,
  referenceId: params.invoiceId,
  referenceType: 'invoice',
  metadata: {
    invoiceNumber: params.invoiceNumber,
    status: params.status,
    grandTotal: params.grandTotal,
    currencySymbol: params.currencySymbol ?? '₹',
  },
});

export interface InvoiceUpdatedEventParams {
  businessId: string;
  invoiceId: string;
  userId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  previousStatus?: InvoiceStatus;
  grandTotal: number;
  currencySymbol?: string;
}

export const buildInvoiceUpdatedEvent = (
  params: InvoiceUpdatedEventParams,
): RecordTimelineEventInput => ({
  businessId: params.businessId,
  invoiceId: params.invoiceId,
  eventType: 'INVOICE_UPDATED',
  title: 'Invoice Updated',
  description: `Invoice ${params.invoiceNumber} was updated.`,
  userId: params.userId,
  referenceId: params.invoiceId,
  referenceType: 'invoice',
  metadata: {
    invoiceNumber: params.invoiceNumber,
    status: params.status,
    previousStatus: params.previousStatus ?? null,
    grandTotal: params.grandTotal,
  },
});

export interface StatusChangedEventParams {
  businessId: string;
  invoiceId: string;
  userId: string;
  invoiceNumber: string;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
}

export const buildStatusChangedEvent = (
  params: StatusChangedEventParams,
): RecordTimelineEventInput => ({
  businessId: params.businessId,
  invoiceId: params.invoiceId,
  eventType: 'STATUS_CHANGED',
  title: 'Status Changed',
  description: `Status changed from ${params.fromStatus} to ${params.toStatus}.`,
  userId: params.userId,
  referenceId: params.invoiceId,
  referenceType: 'invoice',
  metadata: {
    invoiceNumber: params.invoiceNumber,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
  },
});

export interface PaymentTimelineEventParams {
  businessId: string;
  invoiceId: string;
  userId: string;
  paymentId: string;
  paymentNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  outstandingBalance: number;
  paymentStatus: InvoicePaymentStatus;
  invoiceStatus: InvoiceStatus;
  currencySymbol?: string;
}

const resolvePaymentEventType = (
  paymentStatus: InvoicePaymentStatus,
): InvoiceTimelineEventType => {
  if (paymentStatus === 'Paid') {
    return 'INVOICE_PAID';
  }
  if (paymentStatus === 'Partially Paid') {
    return 'PARTIAL_PAYMENT';
  }
  return 'PAYMENT_RECORDED';
};

export const buildPaymentTimelineEvent = (
  params: PaymentTimelineEventParams,
): RecordTimelineEventInput => {
  const symbol = params.currencySymbol ?? '₹';
  const amountLabel = formatMoney(params.amount, symbol);
  const outstandingLabel = formatMoney(params.outstandingBalance, symbol);
  const eventType = resolvePaymentEventType(params.paymentStatus);

  if (eventType === 'INVOICE_PAID') {
    return {
      businessId: params.businessId,
      invoiceId: params.invoiceId,
      eventType,
      title: 'Invoice Fully Paid',
      description: `${amountLabel} received via ${params.paymentMethod}. Invoice marked as Paid.`,
      userId: params.userId,
      referenceId: params.paymentId,
      referenceType: 'payment',
      metadata: {
        paymentId: params.paymentId,
        paymentNumber: params.paymentNumber,
        paymentMethod: params.paymentMethod,
        amount: params.amount,
        outstandingBalance: params.outstandingBalance,
        paymentStatus: params.paymentStatus,
        invoiceStatus: params.invoiceStatus,
      },
    };
  }

  if (eventType === 'PARTIAL_PAYMENT') {
    return {
      businessId: params.businessId,
      invoiceId: params.invoiceId,
      eventType,
      title: 'Partial Payment Received',
      description: `${amountLabel} received via ${params.paymentMethod}. Outstanding balance ${outstandingLabel}.`,
      userId: params.userId,
      referenceId: params.paymentId,
      referenceType: 'payment',
      metadata: {
        paymentId: params.paymentId,
        paymentNumber: params.paymentNumber,
        paymentMethod: params.paymentMethod,
        amount: params.amount,
        outstandingBalance: params.outstandingBalance,
        paymentStatus: params.paymentStatus,
        invoiceStatus: params.invoiceStatus,
      },
    };
  }

  return {
    businessId: params.businessId,
    invoiceId: params.invoiceId,
    eventType,
    title: 'Payment Recorded',
    description: `${amountLabel} received via ${params.paymentMethod}. Outstanding balance ${outstandingLabel}.`,
    userId: params.userId,
    referenceId: params.paymentId,
    referenceType: 'payment',
    metadata: {
      paymentId: params.paymentId,
      paymentNumber: params.paymentNumber,
      paymentMethod: params.paymentMethod,
      amount: params.amount,
      outstandingBalance: params.outstandingBalance,
      paymentStatus: params.paymentStatus,
      invoiceStatus: params.invoiceStatus,
    },
  };
};
