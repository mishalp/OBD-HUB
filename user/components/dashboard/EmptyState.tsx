import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#9CA3AF] shadow-sm ring-1 ring-[#E5E7EB]">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-[#6B7280]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};
