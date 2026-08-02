import type { InvoiceStatus } from '@/lib/types/invoice';
import { Badge, type BadgeTone } from '@/components/ui/Badge';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const STATUS_TONE: Record<InvoiceStatus, BadgeTone> = {
  Draft: 'neutral',
  Unpaid: 'warning',
  'Partially Paid': 'primary',
  Paid: 'success',
  Cancelled: 'danger',
};

export const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
  return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
};
