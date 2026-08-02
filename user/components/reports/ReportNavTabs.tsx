'use client';

import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  UserRoundSearch,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type ReportTab = 'sales' | 'customers' | 'invoices';

interface ReportNavTabsProps {
  active: ReportTab;
}

const TABS: { key: ReportTab; href: string; label: string; icon: LucideIcon }[] = [
  { key: 'sales', href: '/reports/sales', label: 'Sales', icon: TrendingUp },
  {
    key: 'customers',
    href: '/reports/customers',
    label: 'Customers',
    icon: UserRoundSearch,
  },
  { key: 'invoices', href: '/reports/invoices', label: 'Invoices', icon: BarChart3 },
];

export const ReportNavTabs = ({ active }: ReportNavTabsProps) => {
  return (
    <div
      className="inline-flex rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-1"
      role="tablist"
      aria-label="Report type"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150',
              isActive
                ? 'bg-[#D32F2F] text-white shadow-sm'
                : 'text-[#6B7280] hover:bg-white hover:text-[#111827]',
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};
