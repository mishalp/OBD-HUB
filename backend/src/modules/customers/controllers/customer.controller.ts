import { Request, Response } from 'express';
import { ApiError } from '../../../utils/ApiError';
import { sendResponse } from '../../../utils/response';
import {
  createCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from '../validators/customer.validator';
import * as customerService from '../services/customer.service';

const getBusinessId = (req: Request): string => {
  const businessId = req.user?.businessId;

  if (!businessId) {
    throw new ApiError(403, 'Business profile setup is required');
  }

  return businessId;
};

export const listCustomersHandler = async (req: Request, res: Response): Promise<void> => {
  const query = listCustomersQuerySchema.parse(req.query);
  const result = await customerService.listCustomers(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Customers retrieved',
    data: result,
  });
};

export const getCustomerHandler = async (req: Request, res: Response): Promise<void> => {
  const customer = await customerService.getCustomerById(
    getBusinessId(req),
    req.params.id as string,
  );

  sendResponse({
    res,
    message: 'Customer retrieved',
    data: { customer },
  });
};

export const createCustomerHandler = async (req: Request, res: Response): Promise<void> => {
  const input = createCustomerSchema.parse(req.body);
  const customer = await customerService.createCustomer(getBusinessId(req), input);

  sendResponse({
    res,
    statusCode: 201,
    message: 'Customer created successfully',
    data: { customer },
  });
};

export const updateCustomerHandler = async (req: Request, res: Response): Promise<void> => {
  const input = updateCustomerSchema.parse(req.body);
  const customer = await customerService.updateCustomer(
    getBusinessId(req),
    req.params.id as string,
    input,
  );

  sendResponse({
    res,
    message: 'Customer updated successfully',
    data: { customer },
  });
};

export const deleteCustomerHandler = async (req: Request, res: Response): Promise<void> => {
  await customerService.deleteCustomer(getBusinessId(req), req.params.id as string);

  sendResponse({
    res,
    message: 'Customer deleted successfully',
    data: null,
  });
};
