import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { authenticate } from '../../../middlewares/authenticate';
import { logoUpload } from '../../../middlewares/upload';
import * as businessController from '../controllers/business.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  logoUpload.single('logo'),
  asyncHandler(businessController.createBusinessHandler),
);

router.get('/', asyncHandler(businessController.getBusinessHandler));

router.put(
  '/',
  logoUpload.single('logo'),
  asyncHandler(businessController.updateBusinessHandler),
);

export default router;
