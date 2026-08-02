import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { authenticate, requireBusiness } from '../../../middlewares/authenticate';
import * as customerController from '../controllers/customer.controller';

const router = Router();

router.use(authenticate, requireBusiness);

router.get('/', asyncHandler(customerController.listCustomersHandler));
router.post('/', asyncHandler(customerController.createCustomerHandler));
router.get('/:id', asyncHandler(customerController.getCustomerHandler));
router.put('/:id', asyncHandler(customerController.updateCustomerHandler));
router.delete('/:id', asyncHandler(customerController.deleteCustomerHandler));

export default router;
