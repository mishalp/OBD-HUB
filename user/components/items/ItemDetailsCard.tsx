import type { ItemDetails } from '@/lib/types/item';
import { ItemStatusBadge } from '@/components/items/ItemStatusBadge';
import { ItemTypeBadge } from '@/components/items/ItemTypeBadge';
import { StockCard } from '@/components/inventory/StockCard';
import { StockMovementTimeline } from '@/components/inventory/StockMovementTimeline';

interface ItemDetailsCardProps {
  item: ItemDetails;
}

const formatDate = (value: string): string => {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatMoney = (value: number | null): string => {
  if (value === null) {
    return '—';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
};

export const ItemDetailsCard = ({ item }: ItemDetailsCardProps) => {
  const showInventory = item.type === 'Product';

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              {item.itemCode}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#111827]">{item.name}</h2>
            <div className="mt-3">
              <ItemTypeBadge type={item.type} />
            </div>
          </div>
          <ItemStatusBadge isActive={item.isActive} />
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Description</dt>
            <dd className="mt-1 text-sm text-[#111827]">{item.description || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Category</dt>
            <dd className="mt-1 text-sm text-[#111827]">{item.category || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Unit</dt>
            <dd className="mt-1 text-sm text-[#111827]">{item.unit}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">SKU</dt>
            <dd className="mt-1 text-sm text-[#111827]">{item.sku || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Barcode</dt>
            <dd className="mt-1 text-sm text-[#111827]">{item.barcode || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Created Date</dt>
            <dd className="mt-1 text-sm text-[#111827]">{formatDate(item.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Pricing & Tax</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Price</dt>
            <dd className="mt-1 text-sm font-medium text-[#111827]">{formatMoney(item.price)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Cost Price</dt>
            <dd className="mt-1 text-sm text-[#111827]">{formatMoney(item.costPrice)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Tax Rate</dt>
            <dd className="mt-1 text-sm text-[#111827]">{item.taxRate}%</dd>
          </div>
        </dl>
      </section>

      {showInventory ? (
        <>
          <StockCard
            currentStock={item.currentStock}
            openingStock={item.openingStock}
            availableStock={item.availableStock}
            minimumStock={item.minimumStock}
            maximumStock={item.maximumStock}
            stockUnit={item.stockUnit}
            inventoryStatus={item.inventoryStatus}
            lastStockUpdate={item.lastStockUpdate}
            trackInventory={item.trackInventory}
          />
          {item.trackInventory ? (
            <StockMovementTimeline
              movements={item.recentMovements}
              itemId={item.id}
            />
          ) : null}
        </>
      ) : null}

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Usage</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Invoices Using This Item', value: item.invoiceCount },
            { label: 'Total Sold', value: item.totalSold },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[#E5E7EB] p-4">
              <p className="text-xs uppercase tracking-wide text-[#6B7280]">{stat.label}</p>
              <p className="mt-2 text-xl font-semibold text-[#111827]">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
