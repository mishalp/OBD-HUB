import { Request, Response } from 'express';
import { ApiError } from '../../../../utils/ApiError';
import { sendResponse } from '../../../../utils/response';
import {
  invoiceListQuerySchema,
  invoiceStatusQuerySchema,
  invoiceSummaryQuerySchema,
  invoiceTrendQuerySchema,
} from '../validators/invoiceReport.validator';
import * as invoiceReportService from '../services/invoiceReport.service';

const getBusinessId = (req: Request): string => {
  const businessId = req.user?.businessId;

  if (!businessId) {
    throw new ApiError(403, 'Business profile setup is required');
  }

  return businessId;
};

export const getInvoiceSummaryHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = invoiceSummaryQuerySchema.parse(req.query);
  const result = await invoiceReportService.getInvoiceSummary(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Invoice report summary retrieved',
    data: result,
  });
};

export const listInvoiceReportsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = invoiceListQuerySchema.parse(req.query);
  const result = await invoiceReportService.listInvoiceReports(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Invoice report list retrieved',
    data: result,
  });
};

export const getInvoiceTrendHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = invoiceTrendQuerySchema.parse(req.query);
  const result = await invoiceReportService.getInvoiceTrend(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Invoice trend retrieved',
    data: result,
  });
};

export const getInvoiceStatusHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = invoiceStatusQuerySchema.parse(req.query);
  const result = await invoiceReportService.getInvoiceStatusBreakdown(
    getBusinessId(req),
    query,
  );

  sendResponse({
    res,
    message: 'Invoice status distribution retrieved',
    data: result,
  });
};
