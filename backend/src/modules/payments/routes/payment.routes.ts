import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { authenticate, requireBusiness } from '../../../middlewares/authenticate';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

router.use(authenticate, requireBusiness);

router.get('/', asyncHandler(paymentController.listPaymentsHandler));
router.post('/', asyncHandler(paymentController.createPaymentHandler));
router.get('/:id', asyncHandler(paymentController.getPaymentHandler));

export default router;
