import { Request, Response } from 'express';
import { ApiError } from '../../../utils/ApiError';
import { sendResponse } from '../../../utils/response';
import {
  adjustStockSchema,
  createItemSchema,
  listItemsQuerySchema,
  stockHistoryQuerySchema,
  updateItemSchema,
} from '../validators/item.validator';
import * as itemService from '../services/item.service';
import * as inventoryService from '../services/inventory.service';

const getBusinessId = (req: Request): string => {
  const businessId = req.user?.businessId;

  if (!businessId) {
    throw new ApiError(403, 'Business profile setup is required');
  }

  return businessId;
};

export const listItemsHandler = async (req: Request, res: Response): Promise<void> => {
  const query = listItemsQuerySchema.parse(req.query);
  const result = await itemService.listItems(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Items retrieved',
    data: result,
  });
};

export const getItemHandler = async (req: Request, res: Response): Promise<void> => {
  const item = await itemService.getItemById(getBusinessId(req), req.params.id as string);

  sendResponse({
    res,
    message: 'Item retrieved',
    data: { item },
  });
};

export const createItemHandler = async (req: Request, res: Response): Promise<void> => {
  const input = createItemSchema.parse(req.body);
  const item = await itemService.createItem(getBusinessId(req), req.user!.id, input);

  sendResponse({
    res,
    statusCode: 201,
    message: 'Item created successfully',
    data: { item },
  });
};

export const updateItemHandler = async (req: Request, res: Response): Promise<void> => {
  const input = updateItemSchema.parse(req.body);
  const item = await itemService.updateItem(
    getBusinessId(req),
    req.params.id as string,
    input,
  );

  sendResponse({
    res,
    message: 'Item updated successfully',
    data: { item },
  });
};

export const deleteItemHandler = async (req: Request, res: Response): Promise<void> => {
  await itemService.deleteItem(getBusinessId(req), req.params.id as string);

  sendResponse({
    res,
    message: 'Item deleted successfully',
    data: null,
  });
};

export const getItemStockHandler = async (req: Request, res: Response): Promise<void> => {
  const stock = await inventoryService.getStockSnapshot(
    getBusinessId(req),
    req.params.id as string,
  );

  sendResponse({
    res,
    message: 'Item stock retrieved',
    data: { stock },
  });
};

export const getItemStockHistoryHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = stockHistoryQuerySchema.parse(req.query);
  const result = await inventoryService.listStockHistory(
    getBusinessId(req),
    req.params.id as string,
    query,
  );

  sendResponse({
    res,
    message: 'Stock history retrieved',
    data: result,
  });
};

export const adjustItemStockHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const input = adjustStockSchema.parse(req.body);
  const result = await inventoryService.adjustStockManually({
    businessId: getBusinessId(req),
    itemId: req.params.id as string,
    userId: req.user!.id,
    adjustmentType: input.adjustmentType,
    quantity: input.quantity,
    reason: input.reason,
    notes: input.notes,
  });

  sendResponse({
    res,
    message: 'Stock adjusted successfully',
    data: result,
  });
};

export const getInventorySummaryHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const summary = await inventoryService.getInventorySummary(getBusinessId(req));

  sendResponse({
    res,
    message: 'Inventory summary retrieved',
    data: { summary },
  });
};
