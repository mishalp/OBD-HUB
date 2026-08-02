import { Request, Response } from 'express';
import { ApiError } from '../../../utils/ApiError';
import { sendResponse } from '../../../utils/response';
import {
  createPaymentSchema,
  listPaymentsQuerySchema,
} from '../validators/payment.validator';
import * as paymentService from '../services/payment.service';

const getBusinessId = (req: Request): string => {
  const businessId = req.user?.businessId;

  if (!businessId) {
    throw new ApiError(403, 'Business profile setup is required');
  }

  return businessId;
};

const getUserId = (req: Request): string => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  return userId;
};

export const listPaymentsHandler = async (req: Request, res: Response): Promise<void> => {
  const query = listPaymentsQuerySchema.parse(req.query);
  const result = await paymentService.listPayments(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Payments retrieved',
    data: result,
  });
};

export const getPaymentHandler = async (req: Request, res: Response): Promise<void> => {
  const payment = await paymentService.getPaymentById(
    getBusinessId(req),
    req.params.id as string,
  );

  sendResponse({
    res,
    message: 'Payment retrieved',
    data: { payment },
  });
};

export const createPaymentHandler = async (req: Request, res: Response): Promise<void> => {
  const input = createPaymentSchema.parse(req.body);
  const result = await paymentService.createPayment(
    getBusinessId(req),
    getUserId(req),
    input,
  );

  sendResponse({
    res,
    statusCode: 201,
    message: 'Payment recorded successfully',
    data: result,
  });
};

export const listInvoicePaymentsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await paymentService.listPaymentsForInvoice(
    getBusinessId(req),
    req.params.id as string,
  );

  sendResponse({
    res,
    message: 'Invoice payments retrieved',
    data: result,
  });
};
