import { Router } from 'express';
import { asyncHandler } from '../../../../utils/asyncHandler';
import * as invoiceReportController from '../controllers/invoiceReport.controller';

const router = Router();

router.get('/summary', asyncHandler(invoiceReportController.getInvoiceSummaryHandler));
router.get('/list', asyncHandler(invoiceReportController.listInvoiceReportsHandler));
router.get('/trend', asyncHandler(invoiceReportController.getInvoiceTrendHandler));
router.get('/status', asyncHandler(invoiceReportController.getInvoiceStatusHandler));

export default router;
