'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { itemsApi } from '@/lib/api/items';
import { ApiClientError } from '@/lib/api/client';
import type { ItemDetails, StockTransaction } from '@/lib/types/item';
import { StockHistoryTable } from '@/components/inventory/StockHistoryTable';

function ItemStockHistoryContent() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get('id') || '';

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      if (!itemId) {
        if (!cancelled) {
          setIsLoading(false);
          setError('No item ID provided.');
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [itemRes, historyRes] = await Promise.all([
          itemsApi.getById(itemId),
          itemsApi.getStockHistory(itemId, page, 20),
        ]);

        if (cancelled) {
          return;
        }

        setItem(itemRes.item);
        setTransactions(historyRes.transactions);
        setTotalPages(historyRes.pagination.totalPages);
        setHasNextPage(historyRes.pagination.hasNextPage);
        setHasPrevPage(historyRes.pagination.hasPrevPage);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'Unable to load stock history.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [itemId, page]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading stock history...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <Link
          href={`/items/view?id=${itemId}`}
          className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
        >
          ← Back to item
        </Link>
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error ?? 'Item not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/items/view?id=${item.id}`}
          className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
        >
          ← Back to {item.name}
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-[#111827]">
          Stock History
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          {item.itemCode} · {item.name}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <StockHistoryTable transactions={transactions} />
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#6B7280]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!hasPrevPage}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ItemStockHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-[#6B7280]">Loading stock history...</p>
        </div>
      }
    >
      <ItemStockHistoryContent />
    </Suspense>
  );
}
