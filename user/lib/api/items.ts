import { apiRequest } from '@/lib/api/client';
import type {
  AdjustStockPayload,
  InventorySummary,
  Item,
  ItemDetails,
  ItemFormValues,
  ItemListQuery,
  ItemListResponse,
  StockHistoryResponse,
  StockSnapshot,
  StockTransaction,
} from '@/lib/types/item';

const toQueryString = (query: ItemListQuery): string => {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    search: query.search,
    type: query.type,
    status: query.status,
    stockStatus: query.stockStatus,
    category: query.category,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return params.toString();
};

const toPayload = (values: ItemFormValues, includeType: boolean) => {
  const isProduct = values.type === 'Product';
  const trackInventory = isProduct && values.trackInventory;

  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    description: values.description.trim() || null,
    category: values.category.trim() || null,
    unit: values.unit.trim(),
    price: values.price,
    costPrice: values.costPrice.trim() === '' ? null : Number(values.costPrice),
    taxRate: values.taxRate,
    sku: values.sku.trim() || null,
    barcode: values.barcode.trim() || null,
    isActive: values.isActive,
    trackInventory: isProduct ? trackInventory : false,
    openingStock: trackInventory ? values.openingStock : 0,
    minimumStock: trackInventory ? values.minimumStock : 0,
    maximumStock:
      trackInventory && values.maximumStock.trim() !== ''
        ? Number(values.maximumStock)
        : null,
    stockUnit: trackInventory ? values.stockUnit.trim() || values.unit.trim() : null,
  };

  if (includeType) {
    payload.type = values.type;
  }

  return payload;
};

export const itemsApi = {
  list(query: ItemListQuery): Promise<ItemListResponse> {
    return apiRequest<ItemListResponse>(`/api/items?${toQueryString(query)}`);
  },

  getById(id: string): Promise<{ item: ItemDetails }> {
    return apiRequest<{ item: ItemDetails }>(`/api/items/${id}`);
  },

  create(values: ItemFormValues): Promise<{ item: Item }> {
    return apiRequest<{ item: Item }>('/api/items', {
      method: 'POST',
      body: toPayload(values, true),
    });
  },

  update(id: string, values: ItemFormValues): Promise<{ item: Item }> {
    return apiRequest<{ item: Item }>(`/api/items/${id}`, {
      method: 'PUT',
      body: toPayload(values, false),
    });
  },

  remove(id: string): Promise<null> {
    return apiRequest<null>(`/api/items/${id}`, {
      method: 'DELETE',
    });
  },

  getStock(id: string): Promise<{ stock: StockSnapshot }> {
    return apiRequest<{ stock: StockSnapshot }>(`/api/items/${id}/stock`);
  },

  getStockHistory(
    id: string,
    page = 1,
    limit = 20,
  ): Promise<StockHistoryResponse> {
    return apiRequest<StockHistoryResponse>(
      `/api/items/${id}/stock-history?page=${page}&limit=${limit}`,
    );
  },

  adjustStock(
    id: string,
    payload: AdjustStockPayload,
  ): Promise<{
    itemId: string;
    currentStock: number;
    inventoryStatus: string;
    transaction: StockTransaction;
  }> {
    return apiRequest(`/api/items/${id}/adjust-stock`, {
      method: 'POST',
      body: payload,
    });
  },

  inventorySummary(): Promise<{ summary: InventorySummary }> {
    return apiRequest<{ summary: InventorySummary }>('/api/items/inventory-summary');
  },
};
