import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { authenticate, requireBusiness } from '../../../middlewares/authenticate';
import * as invoiceController from '../controllers/invoice.controller';
import * as paymentController from '../../payments/controllers/payment.controller';

const router = Router();

router.use(authenticate, requireBusiness);

router.get('/', asyncHandler(invoiceController.listInvoicesHandler));
router.post('/', asyncHandler(invoiceController.createInvoiceHandler));
router.get('/:id/pdf', asyncHandler(invoiceController.downloadInvoicePdfHandler));
router.get('/:id/print', asyncHandler(invoiceController.getInvoicePrintHandler));
router.get('/:id/payments', asyncHandler(paymentController.listInvoicePaymentsHandler));
router.get('/:id', asyncHandler(invoiceController.getInvoiceHandler));
router.put('/:id', asyncHandler(invoiceController.updateInvoiceHandler));
router.delete('/:id', asyncHandler(invoiceController.deleteInvoiceHandler));

export default router;
