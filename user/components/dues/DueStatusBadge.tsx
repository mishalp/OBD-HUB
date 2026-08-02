import type { DueStatus } from '@/lib/types/due';
import { Badge, type BadgeTone } from '@/components/ui/Badge';

interface DueStatusBadgeProps {
  status: DueStatus | string;
}

const STATUS_TONE: Record<string, BadgeTone> = {
  Current: 'success',
  Outstanding: 'warning',
  Overdue: 'danger',
  Paid: 'success',
};

export const DueStatusBadge = ({ status }: DueStatusBadgeProps) => {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{status}</Badge>;
};
