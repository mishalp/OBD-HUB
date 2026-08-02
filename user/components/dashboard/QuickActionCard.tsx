import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon?: ReactNode;
}

export const QuickActionCard = ({
  title,
  description,
  href,
  icon,
}: QuickActionCardProps) => {
  return (
    <Link href={href} className="block">
      <Card hover className="h-full group" padding="md">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111111] text-white">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
              <ArrowRight className="h-4 w-4 text-[#9CA3AF] transition group-hover:translate-x-0.5 group-hover:text-[#D32F2F]" />
            </div>
            <p className="mt-1.5 text-sm text-[#6B7280]">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};
