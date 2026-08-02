import { InventoryStatus, ItemType } from '../models/item.model';
import { StockReferenceType, StockTransactionType } from '../models/stockTransaction.model';

export interface SafeStockTransaction {
  id: string;
  businessId: string;
  itemId: string;
  transactionType: StockTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType: StockReferenceType | null;
  referenceId: string | null;
  notes: string | null;
  performedBy: string | null;
  performedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockSnapshot {
  itemId: string;
  itemName: string;
  itemCode: string;
  type: ItemType;
  trackInventory: boolean;
  currentStock: number;
  openingStock: number;
  availableStock: number | null;
  minimumStock: number;
  maximumStock: number | null;
  stockUnit: string | null;
  stockValue: number | null;
  inventoryStatus: InventoryStatus;
  lastStockUpdate: Date | null;
}

export interface StockAdjustmentResult {
  itemId: string;
  currentStock: number;
  inventoryStatus: InventoryStatus;
  transaction: SafeStockTransaction;
}

export interface StockHistoryResult {
  itemId: string;
  transactions: SafeStockTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface InventorySummary {
  products: number;
  trackedProducts: number;
  outOfStock: number;
  lowStock: number;
  totalStockUnits: number;
  recentAdjustments: SafeStockTransaction[];
}
