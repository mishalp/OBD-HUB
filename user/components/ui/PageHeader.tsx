import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) => (
  <div
    className={cn(
      'mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
      className,
    )}
  >
    <div className="min-w-0">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-[13px]">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <span className="text-[#9CA3AF]">/</span> : null}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? 'font-medium text-[#111827]'
                    : 'text-[#6B7280]'
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      ) : null}
      <h1 className="text-[28px] font-semibold tracking-tight text-[#111827] sm:text-[32px]">
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm text-[#6B7280]">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);
