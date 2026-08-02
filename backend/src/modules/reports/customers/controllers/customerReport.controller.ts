import { Request, Response } from 'express';
import { ApiError } from '../../../../utils/ApiError';
import { sendResponse } from '../../../../utils/response';
import {
  customerDetailQuerySchema,
  customerIdParamSchema,
  customerListQuerySchema,
  customerSummaryQuerySchema,
  customerTopQuerySchema,
} from '../validators/customerReport.validator';
import * as customerReportService from '../services/customerReport.service';

const getBusinessId = (req: Request): string => {
  const businessId = req.user?.businessId;

  if (!businessId) {
    throw new ApiError(403, 'Business profile setup is required');
  }

  return businessId;
};

export const getCustomerSummaryHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = customerSummaryQuerySchema.parse(req.query);
  const result = await customerReportService.getCustomerSummary(
    getBusinessId(req),
    query,
  );

  sendResponse({
    res,
    message: 'Customer report summary retrieved',
    data: result,
  });
};

export const listCustomerReportsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = customerListQuerySchema.parse(req.query);
  const result = await customerReportService.listCustomerReports(
    getBusinessId(req),
    query,
  );

  sendResponse({
    res,
    message: 'Customer report list retrieved',
    data: result,
  });
};

export const getTopCustomersReportHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = customerTopQuerySchema.parse(req.query);
  const result = await customerReportService.getTopCustomersReport(
    getBusinessId(req),
    query,
  );

  sendResponse({
    res,
    message: 'Top customers report retrieved',
    data: result,
  });
};

export const getCustomerDetailReportHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { customerId } = customerIdParamSchema.parse(req.params);
  const query = customerDetailQuerySchema.parse(req.query);
  const result = await customerReportService.getCustomerDetailReport(
    getBusinessId(req),
    customerId,
    query,
  );

  sendResponse({
    res,
    message: 'Customer detail report retrieved',
    data: result,
  });
};
