import { Types } from 'mongoose';
import { ApiError } from '../../../utils/ApiError';
import { User } from '../../auth/models/user.model';
import { IItemDocument, Item } from '../models/item.model';
import {
  IStockTransactionDocument,
  StockReferenceType,
  StockTransaction,
  StockTransactionType,
} from '../models/stockTransaction.model';
import { deriveInventoryStatus } from '../utils/inventoryStatus';
import {
  InventorySummary,
  SafeStockTransaction,
  StockAdjustmentResult,
  StockHistoryResult,
  StockSnapshot,
} from '../types/inventory.types';

const getDisplayName = (
  user: { firstName?: string; lastName?: string } | null | undefined,
): string | null => {
  if (!user) {
    return null;
  }
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null;
};

const toSafeStockTransaction = (
  tx: IStockTransactionDocument,
  performedByName: string | null = null,
): SafeStockTransaction => ({
  id: tx._id.toString(),
  businessId: tx.businessId.toString(),
  itemId: tx.itemId.toString(),
  transactionType: tx.transactionType,
  quantity: tx.quantity,
  previousStock: tx.previousStock,
  newStock: tx.newStock,
  referenceType: tx.referenceType,
  referenceId: tx.referenceId ? tx.referenceId.toString() : null,
  notes: tx.notes,
  performedBy: tx.performedBy ? tx.performedBy.toString() : null,
  performedByName,
  createdAt: tx.createdAt,
  updatedAt: tx.updatedAt,
});

const roundStock = (value: number): number =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

const findTrackedProduct = async (
  businessId: string,
  itemId: string,
): Promise<IItemDocument> => {
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

  if (item.type !== 'Product') {
    throw new ApiError(400, 'Service items cannot have inventory', [
      { path: 'itemId', message: 'Service items cannot have inventory' },
    ]);
  }

  if (!item.trackInventory) {
    throw new ApiError(400, 'Inventory tracking is disabled for this item', [
      { path: 'trackInventory', message: 'Inventory tracking is disabled for this item' },
    ]);
  }

  return item;
};

/**
 * Atomically applies a stock delta and writes a StockTransaction.
 * Never updates stock silently.
 */
export const applyStockChange = async (input: {
  businessId: string;
  itemId: string;
  delta: number;
  transactionType: StockTransactionType;
  referenceType?: StockReferenceType | null;
  referenceId?: string | null;
  notes?: string | null;
  performedBy?: string | null;
  allowNegative?: boolean;
}): Promise<StockAdjustmentResult> => {
  const businessObjectId = new Types.ObjectId(input.businessId);
  const itemObjectId = new Types.ObjectId(input.itemId);
  const delta = roundStock(input.delta);

  if (!Number.isFinite(delta) || delta === 0) {
    throw new ApiError(400, 'Stock quantity change must be a non-zero number');
  }

  await findTrackedProduct(input.businessId, input.itemId);

  const filter: Record<string, unknown> = {
    _id: itemObjectId,
    businessId: businessObjectId,
    type: 'Product',
    trackInventory: true,
    isDeleted: false,
  };

  if (delta < 0 && !input.allowNegative) {
    filter.currentStock = { $gte: Math.abs(delta) };
  }

  const updated = await Item.findOneAndUpdate(
    filter,
    {
      $inc: { currentStock: delta },
      $set: { lastStockUpdate: new Date() },
    },
    { new: true },
  ).exec();

  if (!updated) {
    throw new ApiError(
      409,
      delta < 0
        ? 'Insufficient stock for this adjustment'
        : 'Unable to update stock. Item may have changed.',
    );
  }

  const previousStock = roundStock(updated.currentStock - delta);
  const newStock = roundStock(updated.currentStock);

  if (newStock < 0) {
    // Safety rollback if allowNegative path somehow went below zero unexpectedly.
    await Item.findOneAndUpdate(
      { _id: itemObjectId, businessId: businessObjectId },
      {
        $inc: { currentStock: -delta },
        $set: { lastStockUpdate: new Date() },
      },
    ).exec();
    throw new ApiError(400, 'Stock cannot be negative');
  }

  const tx = await StockTransaction.create({
    businessId: businessObjectId,
    itemId: itemObjectId,
    transactionType: input.transactionType,
    quantity: delta,
    previousStock,
    newStock,
    referenceType: input.referenceType ?? null,
    referenceId:
      input.referenceId && Types.ObjectId.isValid(input.referenceId)
        ? new Types.ObjectId(input.referenceId)
        : null,
    notes: input.notes?.trim() || null,
    performedBy:
      input.performedBy && Types.ObjectId.isValid(input.performedBy)
        ? new Types.ObjectId(input.performedBy)
        : null,
  });

  let performedByName: string | null = null;
  if (tx.performedBy) {
    const user = await User.findById(tx.performedBy).select('firstName lastName').exec();
    performedByName = getDisplayName(user);
  }

  return {
    itemId: updated._id.toString(),
    currentStock: updated.currentStock,
    inventoryStatus: deriveInventoryStatus(updated),
    transaction: toSafeStockTransaction(tx, performedByName),
  };
};

export const recordOpeningStock = async (input: {
  businessId: string;
  itemId: string;
  openingStock: number;
  performedBy: string;
  stockUnit?: string | null;
}): Promise<StockAdjustmentResult | null> => {
  const opening = roundStock(input.openingStock);
  if (opening <= 0) {
    return null;
  }

  return applyStockChange({
    businessId: input.businessId,
    itemId: input.itemId,
    delta: opening,
    transactionType: 'Opening Stock',
    referenceType: 'item',
    referenceId: input.itemId,
    notes: 'Opening stock on item creation',
    performedBy: input.performedBy,
  });
};

export const adjustStockManually = async (input: {
  businessId: string;
  itemId: string;
  userId: string;
  adjustmentType: 'Increase' | 'Decrease';
  quantity: number;
  reason: string;
  notes?: string | null;
}): Promise<StockAdjustmentResult> => {
  const quantity = roundStock(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new ApiError(400, 'Quantity must be greater than zero', [
      { path: 'quantity', message: 'Quantity must be greater than zero' },
    ]);
  }

  const delta = input.adjustmentType === 'Increase' ? quantity : -quantity;
  const reason = input.reason.trim();
  const notes = [reason, input.notes?.trim()].filter(Boolean).join(' — ');

  return applyStockChange({
    businessId: input.businessId,
    itemId: input.itemId,
    delta,
    transactionType: 'Manual Adjustment',
    referenceType: 'manual',
    referenceId: null,
    notes: notes || null,
    performedBy: input.userId,
  });
};

export const applyInvoiceSaleStock = async (input: {
  businessId: string;
  invoiceId: string;
  userId: string | null;
  lines: Array<{ itemId: string; type: string; quantity: number; itemName?: string }>;
}): Promise<void> => {
  for (const line of input.lines) {
    if (line.type !== 'Product') {
      continue;
    }

    const item = await Item.findOne({
      _id: line.itemId,
      businessId: new Types.ObjectId(input.businessId),
      isDeleted: false,
    }).exec();

    if (!item || item.type !== 'Product' || !item.trackInventory) {
      continue;
    }

    const qty = roundStock(line.quantity);
    if (qty <= 0) {
      continue;
    }

    await applyStockChange({
      businessId: input.businessId,
      itemId: line.itemId,
      delta: -qty,
      transactionType: 'Invoice Sale',
      referenceType: 'invoice',
      referenceId: input.invoiceId,
      notes: line.itemName
        ? `Sold via invoice · ${line.itemName}`
        : 'Sold via invoice',
      performedBy: input.userId,
      // Allow invoice to proceed even if stock goes insufficient? Spec says handle negative stock.
      // Prefer blocking insufficient stock for production integrity.
      allowNegative: false,
    });
  }
};

export const restoreInvoiceSaleStock = async (input: {
  businessId: string;
  invoiceId: string;
  userId: string | null;
  lines: Array<{ itemId: string; type: string; quantity: number; itemName?: string }>;
}): Promise<void> => {
  for (const line of input.lines) {
    if (line.type !== 'Product') {
      continue;
    }

    const item = await Item.findOne({
      _id: line.itemId,
      businessId: new Types.ObjectId(input.businessId),
      isDeleted: false,
    }).exec();

    if (!item || item.type !== 'Product' || !item.trackInventory) {
      continue;
    }

    const qty = roundStock(line.quantity);
    if (qty <= 0) {
      continue;
    }

    await applyStockChange({
      businessId: input.businessId,
      itemId: line.itemId,
      delta: qty,
      transactionType: 'Stock Correction',
      referenceType: 'invoice',
      referenceId: input.invoiceId,
      notes: line.itemName
        ? `Stock restored · invoice change · ${line.itemName}`
        : 'Stock restored · invoice change',
      performedBy: input.userId,
    });
  }
};

export const syncInvoiceLineStock = async (input: {
  businessId: string;
  invoiceId: string;
  userId: string | null;
  previousLines: Array<{ itemId: string; type: string; quantity: number; itemName?: string }>;
  nextLines: Array<{ itemId: string; type: string; quantity: number; itemName?: string }>;
  previouslyEffective: boolean;
  nextEffective: boolean;
}): Promise<void> => {
  if (!input.previouslyEffective && !input.nextEffective) {
    return;
  }

  if (!input.previouslyEffective && input.nextEffective) {
    await applyInvoiceSaleStock({
      businessId: input.businessId,
      invoiceId: input.invoiceId,
      userId: input.userId,
      lines: input.nextLines,
    });
    return;
  }

  if (input.previouslyEffective && !input.nextEffective) {
    await restoreInvoiceSaleStock({
      businessId: input.businessId,
      invoiceId: input.invoiceId,
      userId: input.userId,
      lines: input.previousLines,
    });
    return;
  }

  // Both effective: apply quantity deltas per item.
  const previousMap = new Map<string, number>();
  for (const line of input.previousLines) {
    if (line.type !== 'Product') {
      continue;
    }
    previousMap.set(
      line.itemId,
      roundStock((previousMap.get(line.itemId) ?? 0) + line.quantity),
    );
  }

  const nextMap = new Map<string, number>();
  for (const line of input.nextLines) {
    if (line.type !== 'Product') {
      continue;
    }
    nextMap.set(line.itemId, roundStock((nextMap.get(line.itemId) ?? 0) + line.quantity));
  }

  const itemIds = new Set([...previousMap.keys(), ...nextMap.keys()]);

  for (const itemId of itemIds) {
    const previousQty = previousMap.get(itemId) ?? 0;
    const nextQty = nextMap.get(itemId) ?? 0;
    const deltaSold = roundStock(nextQty - previousQty);
    if (deltaSold === 0) {
      continue;
    }

    const item = await Item.findOne({
      _id: itemId,
      businessId: new Types.ObjectId(input.businessId),
      isDeleted: false,
    }).exec();

    if (!item || item.type !== 'Product' || !item.trackInventory) {
      continue;
    }

    // More sold → reduce stock; less sold → restore stock.
    await applyStockChange({
      businessId: input.businessId,
      itemId,
      delta: -deltaSold,
      transactionType: deltaSold > 0 ? 'Invoice Sale' : 'Stock Correction',
      referenceType: 'invoice',
      referenceId: input.invoiceId,
      notes: 'Invoice line quantity updated',
      performedBy: input.userId,
      allowNegative: false,
    });
  }
};

export const getStockSnapshot = async (
  businessId: string,
  itemId: string,
): Promise<StockSnapshot> => {
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

  return {
    itemId: item._id.toString(),
    itemName: item.name,
    itemCode: item.itemCode,
    type: item.type,
    trackInventory: item.trackInventory,
    currentStock: item.currentStock,
    openingStock: item.openingStock,
    availableStock: item.trackInventory ? item.currentStock : null,
    minimumStock: item.minimumStock,
    maximumStock: item.maximumStock,
    stockUnit: item.stockUnit || item.unit,
    stockValue: item.stockValue,
    inventoryStatus: deriveInventoryStatus(item),
    lastStockUpdate: item.lastStockUpdate,
  };
};

export const listStockHistory = async (
  businessId: string,
  itemId: string,
  options: { page?: number; limit?: number } = {},
): Promise<StockHistoryResult> => {
  await getStockSnapshot(businessId, itemId);

  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const filter = {
    businessId: new Types.ObjectId(businessId),
    itemId: new Types.ObjectId(itemId),
  };

  const [rows, total] = await Promise.all([
    StockTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
    StockTransaction.countDocuments(filter).exec(),
  ]);

  const userIds = [
    ...new Set(
      rows
        .map((row) => (row.performedBy ? row.performedBy.toString() : null))
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const users =
    userIds.length > 0
      ? await User.find({ _id: { $in: userIds } }).select('firstName lastName').exec()
      : [];
  const userMap = new Map(users.map((user) => [user._id.toString(), getDisplayName(user)]));

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    itemId,
    transactions: rows.map((row) =>
      toSafeStockTransaction(
        row,
        row.performedBy ? userMap.get(row.performedBy.toString()) ?? null : null,
      ),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const getInventorySummary = async (businessId: string): Promise<InventorySummary> => {
  const businessObjectId = new Types.ObjectId(businessId);

  const [productCount, trackedCount, outOfStock, lowStockAgg, stockUnitsAgg, recent] =
    await Promise.all([
      Item.countDocuments({
        businessId: businessObjectId,
        isDeleted: false,
        type: 'Product',
      }).exec(),
      Item.countDocuments({
        businessId: businessObjectId,
        isDeleted: false,
        type: 'Product',
        trackInventory: true,
      }).exec(),
      Item.countDocuments({
        businessId: businessObjectId,
        isDeleted: false,
        type: 'Product',
        trackInventory: true,
        currentStock: { $lte: 0 },
      }).exec(),
      Item.countDocuments({
        businessId: businessObjectId,
        isDeleted: false,
        type: 'Product',
        trackInventory: true,
        currentStock: { $gt: 0 },
        $expr: { $lte: ['$currentStock', '$minimumStock'] },
      }).exec(),
      Item.aggregate<{ total: number }>([
        {
          $match: {
            businessId: businessObjectId,
            isDeleted: false,
            type: 'Product',
            trackInventory: true,
          },
        },
        { $group: { _id: null, total: { $sum: '$currentStock' } } },
      ]).exec(),
      StockTransaction.find({
        businessId: businessObjectId,
        transactionType: 'Manual Adjustment',
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .exec(),
    ]);

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
  const userMap = new Map(users.map((user) => [user._id.toString(), getDisplayName(user)]));

  return {
    products: productCount,
    trackedProducts: trackedCount,
    outOfStock,
    lowStock: lowStockAgg,
    totalStockUnits: roundStock(stockUnitsAgg[0]?.total ?? 0),
    recentAdjustments: recent.map((row) =>
      toSafeStockTransaction(
        row,
        row.performedBy ? userMap.get(row.performedBy.toString()) ?? null : null,
      ),
    ),
  };
};
