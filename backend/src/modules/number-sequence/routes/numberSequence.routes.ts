import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { authenticate, requireBusiness } from '../../../middlewares/authenticate';
import * as numberSequenceController from '../controllers/numberSequence.controller';

const router = Router();

router.use(authenticate, requireBusiness);

router.get('/next', asyncHandler(numberSequenceController.getNextInvoiceNumberHandler));
router.get('/peek', asyncHandler(numberSequenceController.peekInvoiceNumberHandler));
router.put(
  '/settings',
  asyncHandler(numberSequenceController.updateInvoiceNumberSettingsHandler),
);

export default router;
