import type { AgeingBucket } from '@/lib/types/due';
import { Badge, type BadgeTone } from '@/components/ui/Badge';

interface AgeingBadgeProps {
  bucket: AgeingBucket | string | null;
}

const BUCKET_LABELS: Record<string, string> = {
  Current: 'Current',
  '0-30': '0–30 Days',
  '31-60': '31–60 Days',
  '61-90': '61–90 Days',
  '91+': '91+ Days',
};

const BUCKET_TONE: Record<string, BadgeTone> = {
  Current: 'success',
  '0-30': 'warning',
  '31-60': 'warning',
  '61-90': 'danger',
  '91+': 'danger',
};

export const AgeingBadge = ({ bucket }: AgeingBadgeProps) => {
  if (!bucket) {
    return <span className="text-sm text-[#9CA3AF]">—</span>;
  }

  return (
    <Badge tone={BUCKET_TONE[bucket] ?? 'neutral'}>
      {BUCKET_LABELS[bucket] ?? bucket}
    </Badge>
  );
};
