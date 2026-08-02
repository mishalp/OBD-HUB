import type { ReactNode } from 'react';
import { Calendar, CircleDollarSign, Clock, Receipt } from 'lucide-react';
import type { PaymentStatistics } from '@/lib/types/payment';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface PaymentSummaryCardsProps {
  statistics: PaymentStatistics | null;
  isLoading: boolean;
}

const CARDS: Array<{
  key: keyof PaymentStatistics;
  label: string;
  valueClassName: string;
  format: 'count' | 'money';
  icon: ReactNode;
}> = [
  {
    key: 'totalPayments',
    label: 'Total Payments',
    valueClassName: 'text-[#111827]',
    format: 'count',
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    key: 'todaysCollections',
    label: "Today's Collections",
    valueClassName: 'text-[#111827]',
    format: 'money',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    key: 'totalCollected',
    label: 'Total Collected',
    valueClassName: 'text-[#15803D]',
    format: 'money',
    icon: <CircleDollarSign className="h-5 w-5" />,
  },
  {
    key: 'pendingAmount',
    label: 'Pending Amount',
    valueClassName: 'text-[#B45309]',
    format: 'money',
    icon: <Clock className="h-5 w-5" />,
  },
];

export const PaymentSummaryCards = ({ statistics, isLoading }: PaymentSummaryCardsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const value =
          statistics && !isLoading
            ? card.format === 'money'
              ? formatMoney(statistics[card.key])
              : String(statistics[card.key])
            : '—';

        return (
          <Card key={card.key} hover className="relative overflow-hidden" padding="md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#6B7280]">{card.label}</p>
                {isLoading || !statistics ? (
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
