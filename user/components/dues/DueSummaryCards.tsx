import type { ReactNode } from 'react';
import { AlertTriangle, CircleDollarSign, Clock, FileText } from 'lucide-react';
import type { DueSummary } from '@/lib/types/due';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface DueSummaryCardsProps {
  summary: DueSummary | null;
  isLoading: boolean;
}

const CARDS: Array<{
  key: keyof Pick<
    DueSummary,
    | 'totalOutstandingAmount'
    | 'totalOverdueAmount'
    | 'outstandingInvoiceCount'
    | 'overdueInvoiceCount'
  >;
  label: string;
  valueClassName: string;
  format: 'money' | 'count';
  icon: ReactNode;
}> = [
  {
    key: 'totalOutstandingAmount',
    label: 'Outstanding Amount',
    valueClassName: 'text-[#B45309]',
    format: 'money',
    icon: <CircleDollarSign className="h-5 w-5" />,
  },
  {
    key: 'totalOverdueAmount',
    label: 'Overdue Amount',
    valueClassName: 'text-[#b91c1c]',
    format: 'money',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    key: 'outstandingInvoiceCount',
    label: 'Outstanding Invoices',
    valueClassName: 'text-[#111827]',
    format: 'count',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    key: 'overdueInvoiceCount',
    label: 'Overdue Invoices',
    valueClassName: 'text-[#b91c1c]',
    format: 'count',
    icon: <Clock className="h-5 w-5" />,
  },
];

export const DueSummaryCards = ({ summary, isLoading }: DueSummaryCardsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const raw = summary?.[card.key];
        const value =
          summary && !isLoading
            ? card.format === 'money'
              ? formatMoney(raw as number)
              : String(raw)
            : '—';

        return (
          <Card key={card.key} hover className="relative overflow-hidden" padding="md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#6B7280]">{card.label}</p>
                {isLoading || !summary ? (
                  <div className="mt-2 h-8 w-24 animate-pulse rounded bg-[#F3F4F6]" />
                ) : (
                  <p
                    className={cn(
                      'mt-2 truncate text-2xl font-semibold tracking-tight',
                      card.valueClassName,
                    )}
                  >
                    {value}
                  </p>
                )}
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#D32F2F]">
                {card.icon}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
