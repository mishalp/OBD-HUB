import type { ReactNode } from 'react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils/cn';

export interface DashboardTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DashboardTableProps<T> {
  columns: Array<DashboardTableColumn<T>>;
  rows: T[];
  emptyTitle: string;
  emptyDescription?: string;
  getRowKey: (row: T) => string;
}

export const DashboardTable = <T,>({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
  getRowKey,
}: DashboardTableProps<T>) => {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription ?? ''} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
          <thead className="sticky top-0 bg-[#FAFAFA]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] bg-white">
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="transition-colors duration-150 hover:bg-[#FAFAFA]"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 py-3.5 text-[#111827]', column.className)}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
