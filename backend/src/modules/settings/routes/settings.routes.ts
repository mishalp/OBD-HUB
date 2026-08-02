import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { authenticate, requireBusiness } from '../../../middlewares/authenticate';
import { avatarUpload, logoUpload } from '../../../middlewares/upload';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

// businessId is always derived from the authenticated session, never the body.
router.use(authenticate, requireBusiness);

router.get('/', asyncHandler(settingsController.getSettingsHandler));

router.put(
  '/business',
  logoUpload.single('logo'),
  asyncHandler(settingsController.updateBusinessSettingsHandler),
);

router.put('/invoice', asyncHandler(settingsController.updateInvoiceSettingsHandler));

router.put('/tax', asyncHandler(settingsController.updateTaxSettingsHandler));

router.put('/preferences', asyncHandler(settingsController.updatePreferencesHandler));

router.put(
  '/profile',
  avatarUpload.single('avatar'),
  asyncHandler(settingsController.updateProfileHandler),
);

router.put('/password', asyncHandler(settingsController.changePasswordHandler));

export default router;
