import { Router } from 'express';
import { authenticate, requireBusiness } from '../../../middlewares/authenticate';
import salesReportRoutes from '../sales/routes/salesReport.routes';
import customerReportRoutes from '../customers/routes/customerReport.routes';
import invoiceReportRoutes from '../invoices/routes/invoiceReport.routes';

const router = Router();

router.use(authenticate, requireBusiness);

router.use('/sales', salesReportRoutes);
router.use('/customers', customerReportRoutes);
router.use('/invoices', invoiceReportRoutes);

export default router;
