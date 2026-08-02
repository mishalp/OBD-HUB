export type ItemType = 'Product' | 'Service';

export type InventoryStatus =
  | 'Out of Stock'
  | 'Low Stock'
  | 'Normal'
  | 'Overstock'
  | 'Not Tracked';

export const STOCK_UNITS = [
  'pcs',
  'kg',
  'g',
  'litres',
  'ml',
  'boxes',
  'packets',
  'meters',
  'cm',
  'dozen',
  'sets',
  'other',
] as const;

export interface StockTransaction {
  id: string;
  businessId: string;
  itemId: string;
  transactionType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  performedBy: string | null;
  performedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
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
  lastStockUpdate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemDetails extends Item {
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
    createdAt: string;
  }>;
}

export interface ItemFormValues {
  name: string;
  description: string;
  type: ItemType;
  category: string;
  unit: string;
  price: number;
  costPrice: string;
  taxRate: number;
  sku: string;
  barcode: string;
  isActive: boolean;
  trackInventory: boolean;
  openingStock: number;
  minimumStock: number;
  maximumStock: string;
  stockUnit: string;
}

export type ItemStockStatusFilter =
  | 'all'
  | 'in_stock'
  | 'out_of_stock'
  | 'low_stock'
  | 'overstock'
  | 'tracked';

export interface ItemListQuery {
  page: number;
  limit: number;
  search: string;
  type: 'all' | ItemType;
  status: 'all' | 'active' | 'inactive';
  stockStatus: ItemStockStatusFilter;
  category: string;
  sortBy:
    | 'createdAt'
    | 'name'
    | 'itemCode'
    | 'type'
    | 'category'
    | 'price'
    | 'taxRate'
    | 'currentStock';
  sortOrder: 'asc' | 'desc';
}

export interface ItemPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ItemListResponse {
  items: Item[];
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
  lastStockUpdate: string | null;
}

export interface StockHistoryResponse {
  itemId: string;
  transactions: StockTransaction[];
  pagination: ItemPagination;
}

export interface AdjustStockPayload {
  adjustmentType: 'Increase' | 'Decrease';
  quantity: number;
  reason: string;
  notes: string | null;
}

export interface InventorySummary {
  products: number;
  trackedProducts: number;
  outOfStock: number;
  lowStock: number;
  totalStockUnits: number;
  recentAdjustments: StockTransaction[];
}

export const defaultItemFormValues = (): ItemFormValues => ({
  name: '',
  description: '',
  type: 'Product',
  category: '',
  unit: 'pcs',
  price: 0,
  costPrice: '',
  taxRate: 0,
  sku: '',
  barcode: '',
  isActive: true,
  trackInventory: true,
  openingStock: 0,
  minimumStock: 0,
  maximumStock: '',
  stockUnit: 'pcs',
});

export const itemToFormValues = (item: Item): ItemFormValues => ({
  name: item.name,
  description: item.description ?? '',
  type: item.type,
  category: item.category ?? '',
  unit: item.unit,
  price: item.price,
  costPrice: item.costPrice === null ? '' : String(item.costPrice),
  taxRate: item.taxRate,
  sku: item.sku ?? '',
  barcode: item.barcode ?? '',
  isActive: item.isActive,
  trackInventory: item.type === 'Product' ? item.trackInventory : false,
  openingStock: item.openingStock ?? 0,
  minimumStock: item.minimumStock ?? 0,
  maximumStock: item.maximumStock === null || item.maximumStock === undefined
    ? ''
    : String(item.maximumStock),
  stockUnit: item.stockUnit || item.unit || 'pcs',
});
