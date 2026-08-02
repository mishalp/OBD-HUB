import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface StatisticCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  trendLabel?: string;
  className?: string;
}

export const StatisticCard = ({
  title,
  value,
  description,
  icon,
  trendLabel = 'No change yet',
  className,
}: StatisticCardProps) => {
  return (
    <Card hover className={cn(className)} padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#6B7280]">{title}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-[#111827]">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#D32F2F]">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-sm text-[#6B7280]">{description}</p>
      <p className="mt-2 text-[12px] font-medium text-[#9CA3AF]">{trendLabel}</p>
    </Card>
  );
};
