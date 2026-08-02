import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { authenticate } from '../../../middlewares/authenticate';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', asyncHandler(authController.registerHandler));
router.post('/login', asyncHandler(authController.loginHandler));
router.post('/logout', asyncHandler(authController.logoutHandler));
router.get('/me', authenticate, asyncHandler(authController.meHandler));

export default router;
