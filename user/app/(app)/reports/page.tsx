import Link from 'next/link';
import { BarChart3, TrendingUp, UserRoundSearch, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const REPORTS = [
  {
    href: '/reports/sales',
    label: 'Sales',
    title: 'Sales Reports',
    description: 'Gross sales, collections, trends, top items, and top customers.',
    icon: TrendingUp,
  },
  {
    href: '/reports/customers',
    label: 'Customers',
    title: 'Customer Reports',
    description: 'Acquisition, lifetime value, outstanding balances, and purchase history.',
    icon: UserRoundSearch,
  },
  {
    href: '/reports/invoices',
    label: 'Invoices',
    title: 'Invoice Reports',
    description: 'Status distribution, collections, overdue exposure, and invoice trends.',
    icon: BarChart3,
  },
] as const;

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <Card padding="lg">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Reports</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6B7280]">
          Analyse sales performance and customer behaviour using live invoice and payment data.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href} className="group block">
              <Card hover className="h-full" padding="md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#D32F2F]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#9CA3AF] transition group-hover:translate-x-0.5 group-hover:text-[#D32F2F]" />
                </div>
                <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-[#D32F2F]">
                  {report.label}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#111827]">{report.title}</h3>
                <p className="mt-2 text-sm text-[#6B7280]">{report.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
