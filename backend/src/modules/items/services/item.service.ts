import { Types } from 'mongoose';
import { ApiError } from '../../../utils/ApiError';
import { IItemDocument, Item, ItemType } from '../models/item.model';
import { StockTransaction } from '../models/stockTransaction.model';
import { User } from '../../auth/models/user.model';
import {
  CreateItemInput,
  ListItemsQuery,
  UpdateItemInput,
} from '../validators/item.validator';
import { ItemDetails, ItemListResult, SafeItem } from '../types/item.types';
import { deriveInventoryStatus } from '../utils/inventoryStatus';
import { recordOpeningStock } from './inventory.service';

const toSafeItem = (item: IItemDocument): SafeItem => ({
  id: item._id.toString(),
  businessId: item.businessId.toString(),
  itemCode: item.itemCode,
  name: item.name,
  description: item.description,
  type: item.type,
  category: item.category,
  unit: item.unit,
  price: item.price,
  costPrice: item.costPrice,
  taxRate: item.taxRate,
  sku: item.sku,
  barcode: item.barcode,
  trackInventory: item.type === 'Product' ? Boolean(item.trackInventory) : false,
  currentStock: item.type === 'Product' && item.trackInventory ? item.currentStock : 0,
  openingStock: item.type === 'Product' ? item.openingStock : 0,
  minimumStock: item.type === 'Product' ? item.minimumStock : 0,
  maximumStock: item.type === 'Product' ? item.maximumStock : null,
  stockUnit: item.type === 'Product' ? item.stockUnit || item.unit : null,
  stockValue: item.type === 'Product' ? item.stockValue : null,
  inventoryStatus: deriveInventoryStatus(item),
  lastStockUpdate: item.lastStockUpdate,
  isActive: item.isActive,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

type ItemFilter = {
  businessId: Types.ObjectId;
  isDeleted: boolean;
  isActive?: boolean;
  type?: ItemType;
  trackInventory?: boolean;
  category?: string | RegExp;
  currentStock?: number | { $lte?: number; $gt?: number };
  _id?: { $ne: Types.ObjectId };
  name?: RegExp | string;
  $or?: Array<Record<string, RegExp>>;
  $expr?: Record<string, unknown>;
};

export const generateItemCode = async (businessId: string): Promise<string> => {
  const count = await Item.countDocuments({
    businessId: new Types.ObjectId(businessId),
  }).exec();

  return `ITM-${String(count + 1).padStart(6, '0')}`;
};

const assertUniqueName = async (
  businessId: string,
  name: string,
  excludeId?: string,
): Promise<void> => {
  const query: ItemFilter = {
    businessId: new Types.ObjectId(businessId),
    name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    isDeleted: false,
  };

  if (excludeId) {
    query._id = { $ne: new Types.ObjectId(excludeId) };
  }

  const existing = await Item.findOne(query).collation({ locale: 'en', strength: 2 }).exec();

  if (existing) {
    throw new ApiError(409, 'Item name already exists for this business', [
      { path: 'name', message: 'Item name already exists for this business' },
    ]);
  }
};

const resolveInventoryFields = (
  type: ItemType,
  input: {
    trackInventory?: boolean;
    openingStock?: number;
    minimumStock?: number;
    maximumStock?: number | null;
    stockUnit?: string | null;
    unit: string;
  },
) => {
  if (type === 'Service') {
    return {
      trackInventory: false,
      currentStock: 0,
      openingStock: 0,
      minimumStock: 0,
      maximumStock: null,
      stockUnit: null,
      stockValue: null,
      lastStockUpdate: null,
    };
  }

  const trackInventory = input.trackInventory !== false;
  const openingStock = trackInventory ? Number(input.openingStock ?? 0) : 0;
  const minimumStock = trackInventory ? Number(input.minimumStock ?? 0) : 0;
  const maximumStock = trackInventory ? (input.maximumStock ?? null) : null;
  const stockUnit = trackInventory
    ? (input.stockUnit?.trim() || input.unit.trim() || 'pcs')
    : null;

  return {
    trackInventory,
    // Opening stock is applied via transaction after create so current starts at 0
    // then increments atomically through inventory service.
    currentStock: 0,
    openingStock,
    minimumStock,
    maximumStock,
    stockUnit,
    stockValue: null as number | null,
    lastStockUpdate: null as Date | null,
  };
};

export const listItems = async (
  businessId: string,
  query: ListItemsQuery,
): Promise<ItemListResult> => {
  const filter: ItemFilter = {
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
  };

  if (query.status === 'active') {
    filter.isActive = true;
  } else if (query.status === 'inactive') {
    filter.isActive = false;
  }

  if (query.type !== 'all') {
    filter.type = query.type;
  }

  if (query.stockStatus === 'tracked') {
    filter.type = 'Product';
    filter.trackInventory = true;
  } else if (query.stockStatus === 'out_of_stock') {
    filter.type = 'Product';
    filter.trackInventory = true;
    filter.currentStock = { $lte: 0 };
  } else if (query.stockStatus === 'in_stock') {
    filter.type = 'Product';
    filter.trackInventory = true;
    filter.currentStock = { $gt: 0 };
  } else if (query.stockStatus === 'low_stock') {
    filter.type = 'Product';
    filter.trackInventory = true;
    filter.currentStock = { $gt: 0 };
    filter.$expr = { $lte: ['$currentStock', '$minimumStock'] };
  } else if (query.stockStatus === 'overstock') {
    filter.type = 'Product';
    filter.trackInventory = true;
    filter.$expr = {
      $and: [
        { $ne: ['$maximumStock', null] },
        { $gt: ['$currentStock', '$maximumStock'] },
      ],
    };
  }

  if (query.category) {
    filter.category = new RegExp(
      `^${query.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    );
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { name: searchRegex },
      { itemCode: searchRegex },
      { sku: searchRegex },
      { barcode: searchRegex },
      { stockUnit: searchRegex },
      { unit: searchRegex },
    ];
  }

  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Item.find(filter)
      .sort({ [query.sortBy]: sortDirection })
      .skip(skip)
      .limit(query.limit)
      .exec(),
    Item.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    items: items.map(toSafeItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPrevPage: query.page > 1,
    },
    meta: {
      search: query.search || null,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
      type: query.type,
      stockStatus: query.stockStatus,
      category: query.category || null,
    },
  };
};

export const getItemById = async (
  businessId: string,
  itemId: string,
): Promise<ItemDetails> => {
  if (!Types.ObjectId.isValid(itemId)) {
    throw new ApiError(404, 'Item not found');
  }

  const item = await Item.findOne({
    _id: itemId,
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
  }).exec();

  if (!item) {
    throw new ApiError(404, 'Item not found');
  }

  const recent = await StockTransaction.find({
    businessId: new Types.ObjectId(businessId),
    itemId: item._id,
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .exec();

  const userIds = [
    ...new Set(
      recent
        .map((row) => (row.performedBy ? row.performedBy.toString() : null))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const users =
    userIds.length > 0
      ? await User.find({ _id: { $in: userIds } }).select('firstName lastName').exec()
      : [];
  const userMap = new Map(
    users.map((user) => [
      user._id.toString(),
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null,
    ]),
  );

  return {
    ...toSafeItem(item),
    invoiceCount: 0,
    totalSold: 0,
    availableStock: item.trackInventory && item.type === 'Product' ? item.currentStock : null,
    recentMovements: recent.map((row) => ({
      id: row._id.toString(),
      transactionType: row.transactionType,
      quantity: row.quantity,
      previousStock: row.previousStock,
      newStock: row.newStock,
      notes: row.notes,
      performedByName: row.performedBy
        ? userMap.get(row.performedBy.toString()) ?? null
        : null,
      createdAt: row.createdAt,
    })),
  };
};

export const createItem = async (
  businessId: string,
  userId: string,
  input: CreateItemInput,
): Promise<SafeItem> => {
  await assertUniqueName(businessId, input.name);

  const itemCode = await generateItemCode(businessId);
  const inventory = resolveInventoryFields(input.type, input);

  try {
    const item = await Item.create({
      businessId: new Types.ObjectId(businessId),
      itemCode,
      name: input.name.trim(),
      description: input.description,
      type: input.type,
      category: input.category,
      unit: input.unit,
      price: input.price,
      costPrice: input.costPrice,
      taxRate: input.taxRate,
      sku: input.sku,
      barcode: input.barcode,
      ...inventory,
      isActive: input.isActive,
      isDeleted: false,
    });

    if (
      item.type === 'Product' &&
      item.trackInventory &&
      inventory.openingStock > 0
    ) {
      await recordOpeningStock({
        businessId,
        itemId: item._id.toString(),
        openingStock: inventory.openingStock,
        performedBy: userId,
        stockUnit: inventory.stockUnit,
      });
      const refreshed = await Item.findById(item._id).exec();
      if (refreshed) {
        return toSafeItem(refreshed);
      }
    }

    return toSafeItem(item);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new ApiError(409, 'Item name already exists for this business', [
        { path: 'name', message: 'Item name already exists for this business' },
      ]);
    }

    throw error;
  }
};

export const updateItem = async (
  businessId: string,
  itemId: string,
  input: UpdateItemInput,
): Promise<SafeItem> => {
  if (!Types.ObjectId.isValid(itemId)) {
    throw new ApiError(404, 'Item not found');
  }

  const item = await Item.findOne({
    _id: itemId,
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
  }).exec();

  if (!item) {
    throw new ApiError(404, 'Item not found');
  }

  await assertUniqueName(businessId, input.name, itemId);

  item.name = input.name.trim();
  item.description = input.description;
  item.category = input.category;
  item.unit = input.unit;
  item.price = input.price;
  item.costPrice = input.costPrice;
  item.taxRate = input.taxRate;
  item.sku = input.sku;
  item.barcode = input.barcode;
  item.isActive = input.isActive;

  if (item.type === 'Product') {
    const trackInventory = input.trackInventory !== false;
    item.trackInventory = trackInventory;
    item.minimumStock = trackInventory ? Number(input.minimumStock ?? 0) : 0;
    item.maximumStock = trackInventory ? (input.maximumStock ?? null) : null;
    item.stockUnit = trackInventory
      ? input.stockUnit?.trim() || item.unit || 'pcs'
      : null;
    // Opening stock is historical — do not rewrite current stock on update.
    if (typeof input.openingStock === 'number') {
      item.openingStock = input.openingStock;
    }
  } else {
    item.trackInventory = false;
    item.currentStock = 0;
    item.openingStock = 0;
    item.minimumStock = 0;
    item.maximumStock = null;
    item.stockUnit = null;
    item.stockValue = null;
    item.lastStockUpdate = null;
  }

  try {
    await item.save();
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new ApiError(409, 'Item name already exists for this business', [
        { path: 'name', message: 'Item name already exists for this business' },
      ]);
    }

    throw error;
  }

  return toSafeItem(item);
};

export const deleteItem = async (businessId: string, itemId: string): Promise<void> => {
  if (!Types.ObjectId.isValid(itemId)) {
    throw new ApiError(404, 'Item not found');
  }

  const item = await Item.findOne({
    _id: itemId,
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
  }).exec();

  if (!item) {
    throw new ApiError(404, 'Item not found');
  }

  item.isDeleted = true;
  item.isActive = false;
  await item.save();
};
