import { Request, Response } from 'express';
import { ApiError } from '../../../../utils/ApiError';
import { sendResponse } from '../../../../utils/response';
import {
  salesSummaryQuerySchema,
  salesTopCustomersQuerySchema,
  salesTopItemsQuerySchema,
  salesTrendQuerySchema,
} from '../validators/salesReport.validator';
import * as salesReportService from '../services/salesReport.service';

const getBusinessId = (req: Request): string => {
  const businessId = req.user?.businessId;

  if (!businessId) {
    throw new ApiError(403, 'Business profile setup is required');
  }

  return businessId;
};

export const getSalesSummaryHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = salesSummaryQuerySchema.parse(req.query);
  const result = await salesReportService.getSalesSummary(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Sales summary retrieved',
    data: result,
  });
};

export const getSalesTrendHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = salesTrendQuerySchema.parse(req.query);
  const result = await salesReportService.getSalesTrend(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Sales trend retrieved',
    data: result,
  });
};

export const getTopItemsHandler = async (req: Request, res: Response): Promise<void> => {
  const query = salesTopItemsQuerySchema.parse(req.query);
  const result = await salesReportService.getTopItems(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Top items retrieved',
    data: result,
  });
};

export const getTopCustomersHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = salesTopCustomersQuerySchema.parse(req.query);
  const result = await salesReportService.getTopCustomers(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Top customers retrieved',
    data: result,
  });
};
