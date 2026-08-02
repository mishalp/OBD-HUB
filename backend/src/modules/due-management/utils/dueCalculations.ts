import { calculateOutstandingBalance } from '../../invoices/utils/invoicePaymentBalance';

export const DUE_STATUSES = ['Current', 'Outstanding', 'Overdue', 'Paid'] as const;
export type DueStatus = (typeof DUE_STATUSES)[number];

export const AGEING_BUCKETS = ['Current', '0-30', '31-60', '61-90', '91+'] as const;
export type AgeingBucket = (typeof AGEING_BUCKETS)[number];

export const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const endOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

/** Whole calendar days between two dates (to - from). */
export const daysBetween = (from: Date, to: Date): number => {
  const start = startOfDay(from).getTime();
  const end = startOfDay(to).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
};

export const resolveEffectiveDueDate = (
  dueDate: Date | null | undefined,
  invoiceDate: Date,
): Date => (dueDate ? new Date(dueDate) : new Date(invoiceDate));

export const calculateDaysOutstanding = (
  invoiceDate: Date,
  today: Date = new Date(),
): number => Math.max(0, daysBetween(invoiceDate, today));

export const calculateDaysOverdue = (params: {
  grandTotal: number;
  totalPaid: number;
  dueDate: Date | null | undefined;
  invoiceDate: Date;
  today?: Date;
}): number => {
  const outstanding = calculateOutstandingBalance(params.grandTotal, params.totalPaid);
  if (outstanding <= 0) {
    return 0;
  }

  const dueDate = resolveEffectiveDueDate(params.dueDate, params.invoiceDate);
  return Math.max(0, daysBetween(dueDate, params.today ?? new Date()));
};

export const calculateDueStatus = (params: {
  grandTotal: number;
  totalPaid: number;
  invoiceDate: Date;
  dueDate: Date | null | undefined;
  today?: Date;
}): DueStatus => {
  const today = startOfDay(params.today ?? new Date());
  const outstanding = calculateOutstandingBalance(params.grandTotal, params.totalPaid);

  if (outstanding <= 0) {
    return 'Paid';
  }

  if (startOfDay(params.invoiceDate).getTime() === today.getTime()) {
    return 'Current';
  }

  const dueDate = startOfDay(resolveEffectiveDueDate(params.dueDate, params.invoiceDate));
  if (dueDate.getTime() < today.getTime()) {
    return 'Overdue';
  }

  return 'Outstanding';
};

/**
 * Ageing buckets use Today - Due Date.
 * Paid invoices are excluded (returns null).
 */
export const calculateAgeingBucket = (params: {
  grandTotal: number;
  totalPaid: number;
  dueDate: Date | null | undefined;
  invoiceDate: Date;
  today?: Date;
}): AgeingBucket | null => {
  const outstanding = calculateOutstandingBalance(params.grandTotal, params.totalPaid);
  if (outstanding <= 0) {
    return null;
  }

  const dueDate = resolveEffectiveDueDate(params.dueDate, params.invoiceDate);
  const daysPastDue = daysBetween(dueDate, params.today ?? new Date());

  if (daysPastDue <= 0) {
    return 'Current';
  }
  if (daysPastDue <= 30) {
    return '0-30';
  }
  if (daysPastDue <= 60) {
    return '31-60';
  }
  if (daysPastDue <= 90) {
    return '61-90';
  }
  return '91+';
};
