import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-[#F3F4F6] text-[#374151] ring-[#E5E7EB]',
  success: 'bg-[#F0FDF4] text-[#15803D] ring-[#BBF7D0]',
  warning: 'bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]',
  danger: 'bg-[#FEF2F2] text-[#B91C1C] ring-[#FECACA]',
  info: 'bg-[#F9FAFB] text-[#111827] ring-[#E5E7EB]',
  primary: 'bg-[#FEF2F2] text-[#D32F2F] ring-[#FECACA]',
};

export const Badge = ({
  className,
  tone = 'neutral',
  children,
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset',
      toneClass[tone],
      className,
    )}
    {...props}
  >
    {children}
  </span>
);
