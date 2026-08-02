import type { InventoryStatus } from '@/lib/types/item';
import { StockStatusBadge } from '@/components/inventory/StockStatusBadge';

interface StockCardProps {
  currentStock: number;
  openingStock: number;
  availableStock: number | null;
  minimumStock: number;
  maximumStock: number | null;
  stockUnit: string | null;
  inventoryStatus: InventoryStatus;
  lastStockUpdate: string | null;
  trackInventory: boolean;
}

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const StockCard = ({
  currentStock,
  openingStock,
  availableStock,
  minimumStock,
  maximumStock,
  stockUnit,
  inventoryStatus,
  lastStockUpdate,
  trackInventory,
}: StockCardProps) => {
  const unit = stockUnit || '';

  if (!trackInventory) {
    return (
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Inventory</h3>
        <p className="mt-3 text-sm text-[#6B7280]">
          Inventory tracking is disabled for this item.
        </p>
      </section>
    );
  }

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Current Stock', value: `${currentStock} ${unit}`.trim() },
    { label: 'Opening Stock', value: `${openingStock} ${unit}`.trim() },
    {
      label: 'Available Stock',
      value:
        availableStock === null ? '—' : `${availableStock} ${unit}`.trim(),
    },
    { label: 'Minimum Stock', value: `${minimumStock} ${unit}`.trim() },
    {
      label: 'Maximum Stock',
      value:
        maximumStock === null ? '—' : `${maximumStock} ${unit}`.trim(),
    },
    { label: 'Stock Unit', value: unit || '—' },
    { label: 'Last Updated', value: formatDateTime(lastStockUpdate) },
  ];

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#111827]">Inventory</h3>
        <StockStatusBadge status={inventoryStatus} />
      </div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
              {row.label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-[#111827]">{row.value}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
            Inventory Status
          </dt>
          <dd className="mt-1">
            <StockStatusBadge status={inventoryStatus} />
          </dd>
        </div>
      </dl>
    </section>
  );
};
