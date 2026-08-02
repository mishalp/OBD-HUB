'use client';

import { useMemo, useState } from 'react';
import { itemsApi } from '@/lib/api/items';
import { ApiClientError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import { NumberInput } from '@/components/ui/NumberInput';
import type { Item } from '@/lib/types/item';

interface AdjustStockModalProps {
  open: boolean;
  item: Pick<Item, 'id' | 'name' | 'currentStock' | 'stockUnit' | 'unit'>;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdjustStockModal = ({
  open,
  item,
  onClose,
  onSuccess,
}: AdjustStockModalProps) => {
  const { showToast } = useToast();
  const [adjustmentType, setAdjustmentType] = useState<'Increase' | 'Decrease'>('Increase');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unit = item.stockUnit || item.unit || 'pcs';
  const preview = useMemo(() => {
    const delta = adjustmentType === 'Increase' ? quantity : -quantity;
    return {
      previous: item.currentStock,
      next: Math.max(item.currentStock + delta, 0),
      delta,
    };
  }, [adjustmentType, quantity, item.currentStock]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (): Promise<void> => {
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    if (adjustmentType === 'Decrease' && quantity > item.currentStock) {
      setError('Cannot decrease more than current stock');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await itemsApi.adjustStock(item.id, {
        adjustmentType,
        quantity,
        reason: reason.trim(),
        notes: notes.trim() || null,
      });
      showToast('Stock adjusted successfully');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to adjust stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#111111]/40 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-stock-title"
        className="relative w-full max-w-lg rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl"
      >
        <h2 id="adjust-stock-title" className="text-xl font-semibold text-[#111827]">
          Adjust Stock
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">{item.name}</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#111827]">
              Adjustment Type
            </label>
            <select
              className="ui-input h-11"
              value={adjustmentType}
              disabled={isSubmitting}
              onChange={(event) =>
                setAdjustmentType(event.target.value as 'Increase' | 'Decrease')
              }
            >
              <option value="Increase">Increase</option>
              <option value="Decrease">Decrease</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#111827]">
              Quantity ({unit})
            </label>
            <NumberInput
              className="ui-input h-11"
              min={0.001}
              step="0.001"
              value={quantity}
              emptyValue={1}
              disabled={isSubmitting}
              onValueChange={setQuantity}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#111827]">
              Reason
            </label>
            <input
              className="ui-input h-11"
              value={reason}
              disabled={isSubmitting}
              placeholder="e.g. Damaged stock, physical count"
              onChange={(event) => setReason(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#111827]">
              Notes
            </label>
            <textarea
              className="ui-textarea"
              rows={3}
              value={notes}
              disabled={isSubmitting}
              placeholder="Optional"
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-sm">
            <p className="font-medium text-[#111827]">Preview</p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-[#374151]">
              <div>
                <dt className="text-xs text-[#6B7280]">Previous Stock</dt>
                <dd>
                  {preview.previous} {unit}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#6B7280]">New Stock</dt>
                <dd className="font-semibold text-[#111827]">
                  {preview.next} {unit}
                </dd>
              </div>
            </dl>
          </div>

          {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:opacity-60"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-[#D32F2F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B71C1C] disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
};
