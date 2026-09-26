import Link from 'next/link';
import {
  AlertTriangle,
  Boxes,
  Package,
  PackageCheck,
  PackageX,
} from 'lucide-react';
import type { InventorySummary } from '@/lib/types/item';
import type { DashboardInventoryAdjustment } from '@/lib/types/dashboard';
import { StatisticCard } from '@/components/dashboard/StatisticCard';
import { SectionHeader } from '@/components/dashboard/SectionHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Card } from '@/components/ui/Card';

interface InventorySummaryCardsProps {
  summary: Pick<
    InventorySummary,
    | 'products'
    | 'trackedProducts'
    | 'outOfStock'
    | 'lowStock'
    | 'totalStockUnits'
  >;
  recentAdjustments?: Array<
    Pick<
      DashboardInventoryAdjustment,
      | 'id'
      | 'itemId'
      | 'quantity'
      | 'previousStock'
      | 'newStock'
      | 'notes'
      | 'performedByName'
      | 'createdAt'
    >
  >;
  showRecent?: boolean;
}

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const InventorySummaryCards = ({
  summary,
  recentAdjustments = [],
  showRecent = true,
}: InventorySummaryCardsProps) => {
  return (
    <div className="space-y-6">
      <section>
        <SectionHeader
          title="Inventory"
          description="Stock health across tracked products."
          action={
            <Link
              href="/items?stockStatus=tracked"
              className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
            >
              View items
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <StatisticCard
            title="Products"
            value={String(summary.products)}
            description="Product catalog size"
            icon={<Package className="h-5 w-5" />}
          />
          <StatisticCard
            title="Tracked Products"
            value={String(summary.trackedProducts)}
            description="Inventory enabled"
            icon={<PackageCheck className="h-5 w-5" />}
          />
          <StatisticCard
            title="Out of Stock"
            value={String(summary.outOfStock)}
            description="Current stock is zero"
            icon={<PackageX className="h-5 w-5" />}
          />
          <StatisticCard
            title="Low Stock"
            value={String(summary.lowStock)}
            description="At or below minimum"
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatisticCard
            title="Total Stock Units"
            value={String(summary.totalStockUnits)}
            description="Units across tracked items"
            icon={<Boxes className="h-5 w-5" />}
          />
        </div>
      </section>

      {showRecent ? (
        <Card padding="md">
          <SectionHeader title="Recent Adjustments" />
          {recentAdjustments.length === 0 ? (
            <EmptyState
              title="No recent adjustments"
              description="Manual stock adjustments will appear here."
            />
          ) : (
            <ul className="space-y-2">
              {recentAdjustments.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] px-3.5 py-2.5"
                >
                  <div>
                    <Link
                      href={`/items/view?id=${row.itemId}`}
                      className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
                    >
                      View item
                    </Link>
                    <p className="mt-0.5 text-xs text-[#6B7280]">
                      {formatDateTime(row.createdAt)}
                      {row.performedByName ? ` · ${row.performedByName}` : ''}
                      {row.notes ? ` · ${row.notes}` : ''}
                    </p>
                  </div>
                  <p
                    className={[
                      'text-sm font-semibold',
                      row.quantity < 0 ? 'text-[#DC2626]' : 'text-[#15803D]',
                    ].join(' ')}
                  >
                    {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
                    <span className="ml-2 font-normal text-[#6B7280]">
                      ({row.previousStock} → {row.newStock})
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
};
