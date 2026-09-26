'use client';

import Link from 'next/link';
import type { Item, ItemListQuery } from '@/lib/types/item';
import { ItemStatusBadge } from '@/components/items/ItemStatusBadge';
import { ItemTypeBadge } from '@/components/items/ItemTypeBadge';
import { StockStatusBadge } from '@/components/inventory/StockStatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface ItemTableProps {
  items: Item[];
  sortBy: ItemListQuery['sortBy'];
  sortOrder: ItemListQuery['sortOrder'];
  onSort: (sortBy: ItemListQuery['sortBy']) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onAdjustStock: (item: Item) => void;
  hasFilters: boolean;
}

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
};

export const ItemTable = ({
  items,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onAdjustStock,
  hasFilters,
}: ItemTableProps) => {
  if (items.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? 'No items match your filters.' : 'No items yet.'}
        description={
          hasFilters
            ? 'Try adjusting your search or filters.'
            : 'Add your first product or service to start selling.'
        }
      />
    );
  }

  const renderSortLabel = (key: ItemListQuery['sortBy'], label: string) => {
    const active = sortBy === key;
    return (
      <button
        type="button"
        onClick={() => onSort(key)}
        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-inherit hover:text-[#111827]"
      >
        {label}
        {active ? <span>{sortOrder === 'asc' ? '↑' : '↓'}</span> : null}
      </button>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
      <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-[#FAFAFA] shadow-[inset_0_-1px_0_#E5E7EB]">
          <tr>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('itemCode', 'Item Code')}</th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('name', 'Name')}</th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('type', 'Type')}</th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('category', 'Category')}</th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Unit</th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('price', 'Price')}</th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{renderSortLabel('currentStock', 'Stock')}</th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Stock Status</th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Tracked</th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Status</th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-[#FAFAFA]">
              <td className="px-4 py-3.5 font-medium text-[#111827]">{item.itemCode}</td>
              <td className="px-4 py-3.5 text-[#111827]">{item.name}</td>
              <td className="px-4 py-3.5">
                <ItemTypeBadge type={item.type} />
              </td>
              <td className="px-4 py-3.5 text-[#374151]">{item.category || '—'}</td>
              <td className="px-4 py-3.5 text-[#374151]">{item.unit}</td>
              <td className="px-4 py-3.5 text-[#374151]">{formatMoney(item.price)}</td>
              <td className="px-4 py-3.5 text-[#374151]">
                {item.type === 'Product' && item.trackInventory
                  ? `${item.currentStock} ${item.stockUnit || item.unit}`
                  : '—'}
              </td>
              <td className="px-4 py-3.5">
                <StockStatusBadge status={item.inventoryStatus} />
              </td>
              <td className="px-4 py-3.5 text-[#374151]">
                {item.type === 'Product' ? (item.trackInventory ? 'Yes' : 'No') : '—'}
              </td>
              <td className="px-4 py-3.5">
                <ItemStatusBadge isActive={item.isActive} />
              </td>
              <td className="px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/items/view?id=${item.id}`}
                    className="rounded-md border border-[#E5E7EB] px-2 py-1 text-xs font-medium text-[#D32F2F] hover:bg-[#FEF2F2]"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-md border border-[#E5E7EB] px-2 py-1 text-xs font-medium text-[#374151] hover:bg-[#FAFAFA]"
                  >
                    Edit
                  </button>
                  {item.type === 'Product' && item.trackInventory ? (
                    <button
                      type="button"
                      onClick={() => onAdjustStock(item)}
                      className="rounded-md border border-[#E5E7EB] px-2 py-1 text-xs font-medium text-[#374151] hover:bg-[#FAFAFA]"
                    >
                      Adjust Stock
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="rounded-md border border-[#FECACA] px-2 py-1 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
