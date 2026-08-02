'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { itemsApi } from '@/lib/api/items';
import { ApiClientError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type {
  Item,
  ItemFormValues,
  ItemListQuery,
  ItemPagination,
  ItemStockStatusFilter,
} from '@/lib/types/item';
import { defaultItemFormValues, itemToFormValues } from '@/lib/types/item';
import { ItemSearchBar } from '@/components/items/ItemSearchBar';
import { ItemFilters } from '@/components/items/ItemFilters';
import { ItemTable } from '@/components/items/ItemTable';
import { ItemTableSkeleton } from '@/components/items/ItemTableSkeleton';
import { ItemModal } from '@/components/items/ItemModal';
import { ItemDeleteDialog } from '@/components/items/ItemDeleteDialog';
import { AdjustStockModal } from '@/components/inventory/AdjustStockModal';

const STOCK_STATUS_VALUES: ItemStockStatusFilter[] = [
  'all',
  'in_stock',
  'out_of_stock',
  'low_stock',
  'overstock',
  'tracked',
];

const parseStockStatus = (value: string | null): ItemStockStatusFilter => {
  if (value && STOCK_STATUS_VALUES.includes(value as ItemStockStatusFilter)) {
    return value as ItemStockStatusFilter;
  }
  return 'all';
};

export default function ItemsPage() {
  return (
    <Suspense fallback={<ItemTableSkeleton />}>
      <ItemsPageContent />
    </Suspense>
  );
}

function ItemsPageContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialStockStatus = parseStockStatus(searchParams.get('stockStatus'));

  const [query, setQuery] = useState<ItemListQuery>({
    page: 1,
    limit: 10,
    search: '',
    type: 'all',
    status: 'all',
    stockStatus: initialStockStatus,
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<ItemPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formFieldErrors, setFormFieldErrors] = useState<{
    name?: string;
    type?: string;
    unit?: string;
    price?: string;
    costPrice?: string;
    taxRate?: string;
  }>({});

  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Item | null>(null);

  useEffect(() => {
    const next = parseStockStatus(searchParams.get('stockStatus'));
    setQuery((prev) =>
      prev.stockStatus === next ? prev : { ...prev, page: 1, stockStatus: next },
    );
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await itemsApi.list(query);
          if (!cancelled) {
            setItems(response.items);
            setPagination(response.pagination);
          }
        } catch (err) {
          if (!cancelled) {
            if (err instanceof ApiClientError) {
              setError(err.message);
            } else {
              setError('Unable to load items.');
            }
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, reloadToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({
        ...prev,
        page: 1,
        search: searchInput.trim(),
      }));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({
        ...prev,
        page: 1,
        category: categoryInput.trim(),
      }));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [categoryInput]);

  const refreshItems = (): void => {
    setReloadToken((prev) => prev + 1);
  };

  const hasFilters = useMemo(
    () =>
      Boolean(query.search) ||
      query.status !== 'all' ||
      query.type !== 'all' ||
      query.stockStatus !== 'all' ||
      Boolean(query.category),
    [query.search, query.status, query.type, query.stockStatus, query.category],
  );

  const openCreateModal = (): void => {
    setEditingItem(null);
    setFormError(null);
    setFormFieldErrors({});
    setModalMode('create');
  };

  const openEditModal = (item: Item): void => {
    setEditingItem(item);
    setFormError(null);
    setFormFieldErrors({});
    setModalMode('edit');
  };

  const closeModal = (): void => {
    if (isSubmitting) {
      return;
    }
    setModalMode(null);
    setEditingItem(null);
    setFormError(null);
    setFormFieldErrors({});
  };

  const handleSort = (sortBy: ItemListQuery['sortBy']): void => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSubmit = async (values: ItemFormValues): Promise<void> => {
    setIsSubmitting(true);
    setFormError(null);
    setFormFieldErrors({});

    try {
      if (modalMode === 'edit' && editingItem) {
        await itemsApi.update(editingItem.id, values);
        showToast('Item updated successfully');
      } else {
        await itemsApi.create(values);
        showToast('Item created successfully');
      }

      closeModal();
      refreshItems();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.errors?.length) {
          const nextErrors: {
            name?: string;
            type?: string;
            unit?: string;
            price?: string;
            costPrice?: string;
            taxRate?: string;
          } = {};
          for (const item of err.errors) {
            if (
              item.path === 'name' ||
              item.path === 'type' ||
              item.path === 'unit' ||
              item.path === 'price' ||
              item.path === 'costPrice' ||
              item.path === 'taxRate'
            ) {
              nextErrors[item.path] = item.message;
            }
          }
          setFormFieldErrors(nextErrors);
        }
        setFormError(err.message);
      } else {
        setFormError('Unable to save item.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await itemsApi.remove(deleteTarget.id);
      showToast('Item deleted successfully');
      setDeleteTarget(null);
      refreshItems();
    } catch (err) {
      if (err instanceof ApiClientError) {
        showToast(err.message, 'error');
      } else {
        showToast('Unable to delete item.', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#111827]">Items</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage products, services, and product stock.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-md bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B71C1C]"
        >
          Add Item
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <ItemSearchBar value={searchInput} onChange={setSearchInput} />
          </div>
          <button
            type="button"
            onClick={refreshItems}
            className="h-11 rounded-md border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
          >
            Refresh
          </button>
        </div>
        <ItemFilters
          type={query.type}
          status={query.status}
          stockStatus={query.stockStatus}
          category={categoryInput}
          onTypeChange={(type) => setQuery((prev) => ({ ...prev, page: 1, type }))}
          onStatusChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))}
          onStockStatusChange={(stockStatus) =>
            setQuery((prev) => ({ ...prev, page: 1, stockStatus }))
          }
          onCategoryChange={setCategoryInput}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <ItemTableSkeleton />
      ) : (
        <ItemTable
          items={items}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          onSort={handleSort}
          onEdit={openEditModal}
          onDelete={setDeleteTarget}
          onAdjustStock={setAdjustTarget}
          hasFilters={hasFilters}
        />
      )}

      {pagination && pagination.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#6B7280]">
            Showing page {pagination.page} of {pagination.totalPages} · {pagination.total} items
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <ItemModal
        open={modalMode !== null}
        title={modalMode === 'edit' ? 'Edit Item' : 'Add Item'}
        initialValues={editingItem ? itemToFormValues(editingItem) : defaultItemFormValues()}
        submitLabel={modalMode === 'edit' ? 'Save Changes' : 'Save Item'}
        isSubmitting={isSubmitting}
        serverError={formError}
        fieldErrors={formFieldErrors}
        lockType={modalMode === 'edit'}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ItemDeleteDialog
        open={Boolean(deleteTarget)}
        itemName={deleteTarget?.name ?? ''}
        isDeleting={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      {adjustTarget ? (
        <AdjustStockModal
          key={adjustTarget.id}
          open
          item={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSuccess={refreshItems}
        />
      ) : null}
    </div>
  );
}
