import type { InvoicePaymentStatus } from '@/lib/types/payment';
import { Badge, type BadgeTone } from '@/components/ui/Badge';

interface PaymentStatusBadgeProps {
  status: InvoicePaymentStatus | string;
}

const STATUS_TONE: Record<string, BadgeTone> = {
  Draft: 'neutral',
  Unpaid: 'warning',
  'Partially Paid': 'primary',
  Paid: 'success',
  Overdue: 'danger',
};

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{status}</Badge>;
};
