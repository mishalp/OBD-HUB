'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  FileText,
  Package,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { dashboardApi } from '@/lib/api/dashboard';
import { ApiClientError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import type { DashboardData } from '@/lib/types/dashboard';
import { StatisticCard } from '@/components/dashboard/StatisticCard';
import { SectionHeader } from '@/components/dashboard/SectionHeader';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import { BusinessSummaryCard } from '@/components/dashboard/BusinessSummaryCard';
import { InventorySummaryCards } from '@/components/inventory/InventorySummary';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/EmptyState';

const formatMoney = (amount: number, symbol: string): string => {
  return `${symbol}${amount.toLocaleString('en-IN')}`;
};

const statusTone = (
  status: string,
): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' => {
  const normalized = status.toLowerCase();
  if (normalized.includes('paid') && !normalized.includes('partial')) {
    return 'success';
  }
  if (normalized.includes('partial') || normalized.includes('unpaid')) {
    return 'warning';
  }
  if (normalized.includes('overdue') || normalized.includes('cancel')) {
    return 'danger';
  }
  if (normalized.includes('draft')) {
    return 'neutral';
  }
  return 'primary';
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await dashboardApi.get();
        setData(response);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError('Unable to load dashboard data.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const hasActivity = useMemo(() => {
    if (!data) {
      return false;
    }

    return (
      data.statistics.totalCustomers > 0 ||
      data.statistics.totalProductsAndServices > 0 ||
      data.statistics.totalInvoices > 0 ||
      data.recentActivity.length > 0
    );
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {error ?? 'Dashboard data unavailable.'}
      </div>
    );
  }

  const { statistics, business, recentActivity, recentInvoices, outstandingPayments, recentInventoryAdjustments } = data;
  const symbol = business.currencySymbol || '₹';

  return (
    <div className="space-y-8">
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-[#D32F2F]/5" />
        <p className="text-sm text-[#6B7280]">
          Welcome back{user ? `, ${user.firstName}` : ''}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#111827] sm:text-[28px]">
          {business.businessName}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6B7280]">
          Track customers, invoices, collections, and growth from one place.
        </p>
        {!hasActivity ? (
          <p className="mt-4 inline-flex rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#D32F2F]">
            No business activity yet. Start by adding your first customer or product.
          </p>
        ) : null}
      </Card>

      <section>
        <SectionHeader title="Overview" description="Key metrics for your business." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatisticCard
            title="Total Customers"
            value={String(statistics.totalCustomers)}
            description="Active customer records"
            icon={<Users className="h-5 w-5" />}
          />
          <StatisticCard
            title="Products & Services"
            value={String(statistics.totalProductsAndServices)}
            description="Items available to sell"
            icon={<Package className="h-5 w-5" />}
          />
          <StatisticCard
            title="Total Invoices"
            value={String(statistics.totalInvoices)}
            description="Invoices created to date"
            icon={<Receipt className="h-5 w-5" />}
          />
          <StatisticCard
            title="Today's Sales"
            value={formatMoney(statistics.todaysSales, symbol)}
            description="Sales recorded today"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatisticCard
            title="Outstanding Amount"
            value={formatMoney(statistics.outstandingAmount, symbol)}
            description="Unpaid invoice balance"
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatisticCard
            title="Total Revenue"
            value={formatMoney(statistics.totalRevenue, symbol)}
            description="Collected revenue to date"
            icon={<FileText className="h-5 w-5" />}
          />
        </div>
      </section>

      <InventorySummaryCards
        summary={{
          products: statistics.inventoryProducts,
          trackedProducts: statistics.inventoryTracked,
          outOfStock: statistics.inventoryOutOfStock,
          lowStock: statistics.inventoryLowStock,
          totalStockUnits: statistics.inventoryTotalUnits,
        }}
        recentAdjustments={recentInventoryAdjustments}
      />

      <section>
        <SectionHeader title="Quick Actions" description="Jump into common workflows." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionCard
            title="Add Customer"
            description="Create a new customer record"
            href="/customers"
            icon={<Users className="h-5 w-5" />}
          />
          <QuickActionCard
            title="Add Product"
            description="Add a product or service"
            href="/items"
            icon={<Package className="h-5 w-5" />}
          />
          <QuickActionCard
            title="Create Invoice"
            description="Generate a new invoice"
            href="/invoices/new"
            icon={<Receipt className="h-5 w-5" />}
          />
          <QuickActionCard
            title="Record Payment"
            description="Log an incoming payment"
            href="/payments"
            icon={<Wallet className="h-5 w-5" />}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card padding="md">
          <SectionHeader
            title="Recent Activity"
            action={
              <Activity className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
            }
          />
          {recentActivity.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Activity will appear here once invoices and payments are created."
            />
          ) : (
            <ul className="space-y-2">
              {recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 transition hover:bg-[#FAFAFA]"
                >
                  <p className="text-sm font-medium text-[#111827]">{item.title}</p>
                  <p className="mt-0.5 text-[13px] text-[#6B7280]">{item.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <BusinessSummaryCard business={business} />
      </div>

      <Card padding="md">
        <SectionHeader
          title="Recent Invoices"
          description="Latest invoices across your business."
          action={
            <Link
              href="/invoices"
              className="inline-flex h-8 items-center rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-medium text-[#111827] transition hover:bg-[#FAFAFA]"
            >
              View all
            </Link>
          }
        />
        <DashboardTable
          rows={recentInvoices}
          getRowKey={(row) => row.id}
          emptyTitle="No invoices yet"
          emptyDescription="Create your first invoice to see it listed here."
          columns={[
            {
              key: 'invoiceNo',
              header: 'Invoice No',
              render: (row) => (
                <span className="font-medium text-[#111827]">{row.invoiceNo}</span>
              ),
            },
            { key: 'customer', header: 'Customer', render: (row) => row.customer },
            {
              key: 'amount',
              header: 'Amount',
              render: (row) => formatMoney(row.amount, symbol),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
            },
            { key: 'date', header: 'Date', render: (row) => row.date },
          ]}
        />
      </Card>

      <Card padding="md">
        <SectionHeader
          title="Outstanding Payments"
          description="Balances waiting to be collected."
          action={
            <Link
              href="/dues"
              className="text-sm font-medium text-[#D32F2F] transition hover:text-[#B71C1C]"
            >
              View dues
            </Link>
          }
        />
        <DashboardTable
          rows={outstandingPayments}
          getRowKey={(row) => row.id}
          emptyTitle="No outstanding payments"
          emptyDescription="Outstanding balances will appear once invoices are unpaid."
          columns={[
            { key: 'customer', header: 'Customer', render: (row) => row.customer },
            { key: 'invoice', header: 'Invoice', render: (row) => row.invoice },
            {
              key: 'amountDue',
              header: 'Amount Due',
              render: (row) => (
                <span className="font-medium">{formatMoney(row.amountDue, symbol)}</span>
              ),
            },
            { key: 'dueDate', header: 'Due Date', render: (row) => row.dueDate },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
