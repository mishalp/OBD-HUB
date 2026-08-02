import type { ReactNode } from 'react';
import { CircleDollarSign, Clock, FileStack, FileText, Receipt } from 'lucide-react';
import type { InvoiceStatistics } from '@/lib/types/invoice';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface InvoiceSummaryCardsProps {
  statistics: InvoiceStatistics | null;
  isLoading: boolean;
}

const CARDS: Array<{
  key: keyof InvoiceStatistics;
  label: string;
  valueClassName: string;
  icon: ReactNode;
}> = [
  {
    key: 'totalInvoices',
    label: 'Total Invoices',
    valueClassName: 'text-[#111827]',
    icon: <FileStack className="h-5 w-5" />,
  },
  {
    key: 'draft',
    label: 'Draft',
    valueClassName: 'text-[#6B7280]',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    key: 'unpaid',
    label: 'Unpaid',
    valueClassName: 'text-[#B45309]',
    icon: <Clock className="h-5 w-5" />,
  },
  {
    key: 'partiallyPaid',
    label: 'Partially Paid',
    valueClassName: 'text-[#111827]',
    icon: <CircleDollarSign className="h-5 w-5" />,
  },
  {
    key: 'paid',
    label: 'Paid',
    valueClassName: 'text-[#15803D]',
    icon: <Receipt className="h-5 w-5" />,
  },
];

export const InvoiceSummaryCards = ({ statistics, isLoading }: InvoiceSummaryCardsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {CARDS.map((card) => {
        const value =
          statistics && !isLoading ? String(statistics[card.key]) : '—';

        return (
          <Card key={card.key} hover className="relative overflow-hidden" padding="md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#6B7280]">{card.label}</p>
                {isLoading || !statistics ? (
                  <div className="mt-2 h-8 w-16 animate-pulse rounded bg-[#F3F4F6]" />
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
