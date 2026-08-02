import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { authenticate, requireBusiness } from '../../../middlewares/authenticate';
import * as dueController from '../controllers/due.controller';

const router = Router();

router.use(authenticate, requireBusiness);

router.get('/', asyncHandler(dueController.listDuesHandler));
router.get('/summary', asyncHandler(dueController.getDueSummaryHandler));
router.get('/:invoiceId', asyncHandler(dueController.getDueDetailsHandler));

export default router;
