'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { itemsApi } from '@/lib/api/items';
import { ApiClientError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type { ItemDetails, ItemFormValues } from '@/lib/types/item';
import { itemToFormValues } from '@/lib/types/item';
import { ItemDetailsCard } from '@/components/items/ItemDetailsCard';
import { ItemModal } from '@/components/items/ItemModal';
import { ItemDeleteDialog } from '@/components/items/ItemDeleteDialog';
import { AdjustStockModal } from '@/components/inventory/AdjustStockModal';

export default function ItemDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const itemId = params.id;

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [isEditOpen, setIsEditOpen] = useState(false);
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await itemsApi.getById(itemId);
          if (!cancelled) {
            setItem(response.item);
          }
        } catch (err) {
          if (!cancelled) {
            if (err instanceof ApiClientError) {
              setError(err.message);
            } else {
              setError('Unable to load item.');
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
  }, [itemId, reloadToken]);

  const modalKey = useMemo(
    () => (item ? `edit-${item.id}-${item.updatedAt}` : 'edit'),
    [item],
  );

  const canAdjustStock =
    item?.type === 'Product' && Boolean(item.trackInventory);

  const handleUpdate = async (values: ItemFormValues): Promise<void> => {
    if (!item) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormFieldErrors({});

    try {
      await itemsApi.update(item.id, values);
      showToast('Item updated successfully');
      setIsEditOpen(false);
      setReloadToken((prev) => prev + 1);
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
          for (const field of err.errors) {
            if (
              field.path === 'name' ||
              field.path === 'type' ||
              field.path === 'unit' ||
              field.path === 'price' ||
              field.path === 'costPrice' ||
              field.path === 'taxRate'
            ) {
              nextErrors[field.path] = field.message;
            }
          }
          setFormFieldErrors(nextErrors);
        }
        setFormError(err.message);
      } else {
        setFormError('Unable to update item.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!item) {
      return;
    }

    setIsDeleting(true);

    try {
      await itemsApi.remove(item.id);
      showToast('Item deleted successfully');
      router.replace('/items');
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

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading item...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <Link href="/items" className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]">
          ← Back to items
        </Link>
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error ?? 'Item not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/items" className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]">
            ← Back to items
          </Link>
          <h2 className="mt-2 text-2xl font-semibold text-[#111827]">Item Details</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAdjustStock ? (
            <button
              type="button"
              onClick={() => setIsAdjustOpen(true)}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
            >
              Adjust Stock
            </button>
          ) : null}
          {canAdjustStock ? (
            <Link
              href={`/items/${item.id}/stock-history`}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
            >
              Stock History
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setFormFieldErrors({});
              setIsEditOpen(true);
            }}
            className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="rounded-md border border-[#FECACA] px-3 py-2 text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
          >
            Delete
          </button>
        </div>
      </div>

      <ItemDetailsCard item={item} />

      <ItemModal
        key={modalKey}
        open={isEditOpen}
        title="Edit Item"
        initialValues={itemToFormValues(item)}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        serverError={formError}
        fieldErrors={formFieldErrors}
        lockType
        onClose={() => {
          if (!isSubmitting) {
            setIsEditOpen(false);
          }
        }}
        onSubmit={handleUpdate}
      />

      <ItemDeleteDialog
        open={isDeleteOpen}
        itemName={item.name}
        isDeleting={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      {canAdjustStock ? (
        <AdjustStockModal
          open={isAdjustOpen}
          item={item}
          onClose={() => setIsAdjustOpen(false)}
          onSuccess={() => setReloadToken((prev) => prev + 1)}
        />
      ) : null}
    </div>
  );
}
