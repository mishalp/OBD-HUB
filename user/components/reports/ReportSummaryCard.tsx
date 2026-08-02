import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface ReportSummaryCardProps {
  title: string;
  value: string;
  description?: string;
  accent?: 'default' | 'success' | 'warning' | 'info';
  isLoading?: boolean;
}

const accentDot: Record<NonNullable<ReportSummaryCardProps['accent']>, string> = {
  default: 'bg-[#D32F2F]',
  success: 'bg-[#16A34A]',
  warning: 'bg-[#F59E0B]',
  info: 'bg-[#111111]',
};

export const ReportSummaryCard = ({
  title,
  value,
  description,
  accent = 'default',
  isLoading = false,
}: ReportSummaryCardProps) => {
  return (
    <Card hover padding="md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-[#6B7280]">{title}</p>
        <span
          className={cn('mt-1 h-2 w-2 rounded-full', accentDot[accent])}
          aria-hidden="true"
        />
      </div>
      {isLoading ? (
        <div className="mt-3 h-7 w-24 animate-pulse rounded bg-[#E5E7EB]/70" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">{value}</p>
      )}
      {description ? (
        <p className="mt-2 text-[12px] text-[#9CA3AF]">{description}</p>
      ) : null}
    </Card>
  );
};
