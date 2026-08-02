import Link from 'next/link';

interface StockMovement {
  id: string;
  transactionType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes: string | null;
  performedByName: string | null;
  createdAt: string;
}

interface StockMovementTimelineProps {
  movements: StockMovement[];
  itemId: string;
  emptyMessage?: string;
}

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const StockMovementTimeline = ({
  movements,
  itemId,
  emptyMessage = 'No stock movements yet.',
}: StockMovementTimelineProps) => {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#111827]">
          Recent Stock Movements
        </h3>
        <Link
          href={`/items/${itemId}/stock-history`}
          className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
        >
          View full history
        </Link>
      </div>

      {movements.length === 0 ? (
        <p className="mt-4 text-sm text-[#6B7280]">{emptyMessage}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {movements.map((movement) => (
            <li
              key={movement.id}
              className="rounded-lg border border-[#E5E7EB] px-3.5 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[#111827]">
                    {movement.transactionType}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    {formatDateTime(movement.createdAt)}
                    {movement.performedByName
                      ? ` · ${movement.performedByName}`
                      : ''}
                  </p>
                </div>
                <p
                  className={[
                    'text-sm font-semibold',
                    movement.quantity < 0 ? 'text-[#DC2626]' : 'text-[#15803D]',
                  ].join(' ')}
                >
                  {movement.quantity > 0
                    ? `+${movement.quantity}`
                    : movement.quantity}
                </p>
              </div>
              <p className="mt-2 text-xs text-[#6B7280]">
                {movement.previousStock} → {movement.newStock}
                {movement.notes ? ` · ${movement.notes}` : ''}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
