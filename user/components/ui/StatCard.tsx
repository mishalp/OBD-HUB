import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  trend?: string;
  className?: string;
}

export const StatCard = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) => (
  <Card
    hover
    className={cn('relative overflow-hidden', className)}
    padding="md"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#6B7280]">{title}</p>
        <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-[#111827]">
          {value}
        </p>
        {description ? (
          <p className="mt-1.5 text-[13px] text-[#9CA3AF]">{description}</p>
        ) : null}
        {trend ? (
          <p className="mt-2 text-[13px] font-medium text-[#16A34A]">{trend}</p>
        ) : null}
      </div>
      {icon ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#D32F2F]">
          {icon}
        </div>
      ) : null}
    </div>
  </Card>
);
