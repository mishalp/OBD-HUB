import type { CustomerReportStatus } from '@/lib/types/customerReport';
import { CUSTOMER_STATUS_LABELS } from '@/lib/types/customerReport';
import { Badge, type BadgeTone } from '@/components/ui/Badge';

const STATUS_TONE: Record<CustomerReportStatus, BadgeTone> = {
  new: 'info',
  active: 'success',
  inactive: 'neutral',
  repeat: 'warning',
};

interface CustomerStatusBadgeProps {
  status: CustomerReportStatus;
}

export const CustomerStatusBadge = ({ status }: CustomerStatusBadgeProps) => {
  return (
    <Badge tone={STATUS_TONE[status]}>{CUSTOMER_STATUS_LABELS[status]}</Badge>
  );
};
