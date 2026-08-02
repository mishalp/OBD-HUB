import { BarChart3 } from 'lucide-react';

interface EmptyReportStateProps {
  title?: string;
  description?: string;
}

export const EmptyReportState = ({
  title = 'No data for this period',
  description = 'Try adjusting the date range or filters to see report data.',
}: EmptyReportStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#9CA3AF]">
        <BarChart3 className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-[#6B7280]">{description}</p>
    </div>
  );
};
