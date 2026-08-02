import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-6 py-14 text-center',
      className,
    )}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#9CA3AF] shadow-sm ring-1 ring-[#E5E7EB]">
      {icon ?? <Inbox className="h-5 w-5" />}
    </div>
    <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
    {description ? (
      <p className="mt-1.5 max-w-sm text-sm text-[#6B7280]">{description}</p>
    ) : null}
    {actionLabel && onAction ? (
      <Button className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={cn('animate-pulse rounded-md bg-[#E5E7EB]/70', className)}
    aria-hidden
  />
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
    <div className="border-b border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
      <Skeleton className="h-4 w-40" />
    </div>
    <div className="divide-y divide-[#E5E7EB]">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);
