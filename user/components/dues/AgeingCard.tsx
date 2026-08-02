import type { AgeingBucketSummary } from '@/lib/types/due';
import { formatMoney } from '@/lib/utils/invoiceCalculations';
import { AgeingBadge } from '@/components/dues/AgeingBadge';

interface AgeingCardProps {
  buckets: AgeingBucketSummary[];
  isLoading: boolean;
}

export const AgeingCard = ({ buckets, isLoading }: AgeingCardProps) => {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="text-base font-semibold text-[#111827]">Ageing Analysis</h3>
      <p className="mt-1 text-sm text-[#6B7280]">
        Outstanding receivables grouped by days past due date.
      </p>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-[#F3F4F6]" />
          ))}
        </div>
      ) : (
        <div className="mt-4 divide-y divide-[#E5E7EB]">
          {buckets.map((bucket) => (
            <div
              key={bucket.bucket}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <AgeingBadge bucket={bucket.bucket} />
              <div className="text-right">
                <p className="text-sm font-semibold text-[#111827]">
                  {formatMoney(bucket.outstandingAmount)}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {bucket.invoiceCount} invoice{bucket.invoiceCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
