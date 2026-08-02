import { InventoryStatus } from '../models/item.model';

export const deriveInventoryStatus = (input: {
  type: string;
  trackInventory: boolean;
  currentStock: number;
  minimumStock: number;
  maximumStock: number | null;
}): InventoryStatus => {
  if (input.type !== 'Product' || !input.trackInventory) {
    return 'Not Tracked';
  }

  const current = Number(input.currentStock) || 0;
  const minimum = Number(input.minimumStock) || 0;
  const maximum =
    input.maximumStock === null || input.maximumStock === undefined
      ? null
      : Number(input.maximumStock);

  if (current <= 0) {
    return 'Out of Stock';
  }

  if (maximum !== null && Number.isFinite(maximum) && current > maximum) {
    return 'Overstock';
  }

  if (current <= minimum) {
    return 'Low Stock';
  }

  return 'Normal';
};
