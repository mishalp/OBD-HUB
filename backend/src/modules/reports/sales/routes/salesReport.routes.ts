import { Router } from 'express';
import { asyncHandler } from '../../../../utils/asyncHandler';
import * as salesReportController from '../controllers/salesReport.controller';

const router = Router();

router.get('/summary', asyncHandler(salesReportController.getSalesSummaryHandler));
router.get('/trend', asyncHandler(salesReportController.getSalesTrendHandler));
router.get('/top-items', asyncHandler(salesReportController.getTopItemsHandler));
router.get('/top-customers', asyncHandler(salesReportController.getTopCustomersHandler));

export default router;
