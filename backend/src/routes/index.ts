import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/response';
import { getDatabaseStatus } from '../database/connection';
import { env } from '../config/env';
import authRoutes from '../modules/auth/routes/auth.routes';
import businessRoutes from '../modules/business/routes/business.routes';
import dashboardRoutes from '../modules/dashboard/routes/dashboard.routes';
import customerRoutes from '../modules/customers/routes/customer.routes';
import itemRoutes from '../modules/items/routes/item.routes';
import invoiceRoutes from '../modules/invoices/routes/invoice.routes';
import numberSequenceRoutes from '../modules/number-sequence/routes/numberSequence.routes';
import paymentRoutes from '../modules/payments/routes/payment.routes';
import dueRoutes from '../modules/due-management/routes/due.routes';
import reportRoutes from '../modules/reports/routes';
import settingsRoutes from '../modules/settings/routes/settings.routes';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    sendResponse({
      res,
      message: 'API is running',
      data: {
        name: 'Billing & CRM API',
        version: '1.0.0',
        environment: env.NODE_ENV,
        health: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  }),
);

router.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    const database = getDatabaseStatus();
    const isHealthy = database === 'connected';

    sendResponse({
      res,
      statusCode: isHealthy ? 200 : 503,
      message: isHealthy ? 'Service is healthy' : 'Service is degraded',
      data: {
        status: isHealthy ? 'ok' : 'degraded',
        database,
        uptime: process.uptime(),
      },
    });
  }),
);

router.use('/api/auth', authRoutes);
router.use('/api/business', businessRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/customers', customerRoutes);
router.use('/api/items', itemRoutes);
router.use('/api/invoices', invoiceRoutes);
router.use('/api/invoice-number', numberSequenceRoutes);
router.use('/api/payments', paymentRoutes);
router.use('/api/dues', dueRoutes);
router.use('/api/reports', reportRoutes);
router.use('/api/settings', settingsRoutes);

export default router;
