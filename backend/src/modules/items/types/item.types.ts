import { InventoryStatus, ItemType } from '../models/item.model';

export interface SafeItem {
  id: string;
  businessId: string;
  itemCode: string;
  name: string;
  description: string | null;
  type: ItemType;
  category: string | null;
  unit: string;
  price: number;
  costPrice: number | null;
  taxRate: number;
  sku: string | null;
  barcode: string | null;
  trackInventory: boolean;
  currentStock: number;
  openingStock: number;
  minimumStock: number;
  maximumStock: number | null;
  stockUnit: string | null;
  stockValue: number | null;
  inventoryStatus: InventoryStatus;
  lastStockUpdate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemDetails extends SafeItem {
  invoiceCount: number;
  totalSold: number;
  availableStock: number | null;
  recentMovements: Array<{
    id: string;
    transactionType: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    notes: string | null;
    performedByName: string | null;
    createdAt: Date;
  }>;
}

export interface ItemPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ItemListResult {
  items: SafeItem[];
  pagination: ItemPagination;
  meta: {
    search: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    status: 'all' | 'active' | 'inactive';
    type: 'all' | ItemType;
    stockStatus: string;
    category: string | null;
  };
}
