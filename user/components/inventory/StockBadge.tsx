import type { InventoryStatus } from '@/lib/types/item';
import { cn } from '@/lib/utils/cn';

const STATUS_STYLES: Record<InventoryStatus, string> = {
  Normal: 'bg-[#ECFDF5] text-[#15803D]',
  'Low Stock': 'bg-[#FFF7ED] text-[#C2410C]',
  'Out of Stock': 'bg-[#FEF2F2] text-[#DC2626]',
  Overstock: 'bg-[#EFF6FF] text-[#1D4ED8]',
  'Not Tracked': 'bg-[#F3F4F6] text-[#6B7280]',
};

interface StockBadgeProps {
  status: InventoryStatus;
  className?: string;
}

/** Compact stock status pill — alias of status badge for reuse. */
export const StockBadge = ({ status, className }: StockBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      STATUS_STYLES[status] ?? STATUS_STYLES['Not Tracked'],
      className,
    )}
  >
    {status}
  </span>
);
