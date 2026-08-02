import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { authenticate, requireBusiness } from '../../../middlewares/authenticate';
import * as itemController from '../controllers/item.controller';

const router = Router();

router.use(authenticate, requireBusiness);

router.get('/', asyncHandler(itemController.listItemsHandler));
router.post('/', asyncHandler(itemController.createItemHandler));
router.get('/inventory-summary', asyncHandler(itemController.getInventorySummaryHandler));
router.get('/:id', asyncHandler(itemController.getItemHandler));
router.put('/:id', asyncHandler(itemController.updateItemHandler));
router.delete('/:id', asyncHandler(itemController.deleteItemHandler));
router.get('/:id/stock', asyncHandler(itemController.getItemStockHandler));
router.get('/:id/stock-history', asyncHandler(itemController.getItemStockHistoryHandler));
router.post('/:id/adjust-stock', asyncHandler(itemController.adjustItemStockHandler));

export default router;
