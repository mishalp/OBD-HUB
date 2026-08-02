import { Router } from 'express';
import { asyncHandler } from '../../../../utils/asyncHandler';
import * as customerReportController from '../controllers/customerReport.controller';

const router = Router();

router.get(
  '/summary',
  asyncHandler(customerReportController.getCustomerSummaryHandler),
);
router.get('/list', asyncHandler(customerReportController.listCustomerReportsHandler));
router.get('/top', asyncHandler(customerReportController.getTopCustomersReportHandler));
router.get(
  '/:customerId',
  asyncHandler(customerReportController.getCustomerDetailReportHandler),
);

export default router;
