import type { InvoiceTimelineEvent } from '@/lib/types/invoice';
import {
  BadgeCheck,
  CreditCard,
  FilePlus2,
  type LucideIcon,
  Pencil,
  RefreshCw,
  Send,
  Ban,
  Undo2,
  CircleDot,
} from 'lucide-react';

export const getTimelineIcon = (eventType: InvoiceTimelineEvent['eventType']): LucideIcon => {
  switch (eventType) {
    case 'INVOICE_CREATED':
      return FilePlus2;
    case 'INVOICE_UPDATED':
      return Pencil;
    case 'PAYMENT_RECORDED':
    case 'PARTIAL_PAYMENT':
      return CreditCard;
    case 'INVOICE_PAID':
      return BadgeCheck;
    case 'STATUS_CHANGED':
      return RefreshCw;
    case 'INVOICE_SENT':
      return Send;
    case 'PAYMENT_REVERSED':
      return Undo2;
    case 'INVOICE_CANCELLED':
      return Ban;
    default:
      return CircleDot;
  }
};

export const getTimelineIconClassName = (
  eventType: InvoiceTimelineEvent['eventType'],
): string => {
  switch (eventType) {
    case 'INVOICE_PAID':
      return 'bg-[#ECFDF5] text-[#15803D]';
    case 'PARTIAL_PAYMENT':
    case 'PAYMENT_RECORDED':
      return 'bg-[#EFF6FF] text-[#1D4ED8]';
    case 'INVOICE_CANCELLED':
    case 'PAYMENT_REVERSED':
      return 'bg-[#FEF2F2] text-[#DC2626]';
    case 'STATUS_CHANGED':
      return 'bg-[#FFFBEB] text-[#B45309]';
    default:
      return 'bg-[#FEF2F2] text-[#D32F2F]';
  }
};

export const formatTimelineTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return 'Just now';
  }
  if (diffMs < hour) {
    const mins = Math.max(1, Math.floor(diffMs / minute));
    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diffMs < 2 * day) {
    return 'Yesterday';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
