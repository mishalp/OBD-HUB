import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export const Card = ({
  className,
  hover = false,
  padding = 'md',
  children,
  ...props
}: CardProps) => (
  <div
    className={cn(
      'rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
      hover &&
        'transition-all duration-200 hover:border-[#D1D5DB] hover:shadow-[0_4px_12px_rgb(0_0_0/0.06)]',
      paddingClass[padding],
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({
  className,
  title,
  description,
  action,
}: {
  className?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) => (
  <div
    className={cn(
      'mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E7EB] pb-4',
      className,
    )}
  >
    <div className="min-w-0">
      <h3 className="text-lg font-semibold tracking-tight text-[#111827]">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);
