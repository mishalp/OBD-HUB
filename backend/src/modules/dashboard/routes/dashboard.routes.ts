import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { authenticate } from '../../../middlewares/authenticate';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.get('/', authenticate, asyncHandler(dashboardController.getDashboardHandler));

export default router;
