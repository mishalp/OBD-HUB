'use client';

import type { ItemStockStatusFilter, ItemType } from '@/lib/types/item';

interface ItemFiltersProps {
  type: 'all' | ItemType;
  status: 'all' | 'active' | 'inactive';
  stockStatus: ItemStockStatusFilter;
  category: string;
  onTypeChange: (type: 'all' | ItemType) => void;
  onStatusChange: (status: 'all' | 'active' | 'inactive') => void;
  onStockStatusChange: (stockStatus: ItemStockStatusFilter) => void;
  onCategoryChange: (category: string) => void;
}

const selectClassName =
  'h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20';

export const ItemFilters = ({
  type,
  status,
  stockStatus,
  category,
  onTypeChange,
  onStatusChange,
  onStockStatusChange,
  onCategoryChange,
}: ItemFiltersProps) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <select
        value={type}
        onChange={(event) => onTypeChange(event.target.value as 'all' | ItemType)}
        className={selectClassName}
        aria-label="Filter by type"
      >
        <option value="all">All types</option>
        <option value="Product">Products</option>
        <option value="Service">Services</option>
      </select>

      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as 'all' | 'active' | 'inactive')
        }
        className={selectClassName}
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <select
        value={stockStatus}
        onChange={(event) =>
          onStockStatusChange(event.target.value as ItemStockStatusFilter)
        }
        className={selectClassName}
        aria-label="Filter by stock"
      >
        <option value="all">All stock</option>
        <option value="tracked">Track Inventory</option>
        <option value="in_stock">In Stock</option>
        <option value="out_of_stock">Out of Stock</option>
        <option value="low_stock">Low Stock</option>
        <option value="overstock">Overstock</option>
      </select>

      <input
        type="text"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        placeholder="Filter by category"
        className={`${selectClassName} min-w-[160px]`}
        aria-label="Filter by category"
      />
    </div>
  );
};
