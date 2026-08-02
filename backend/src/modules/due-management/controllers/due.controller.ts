import { Request, Response } from 'express';
import { ApiError } from '../../../utils/ApiError';
import { sendResponse } from '../../../utils/response';
import {
  dueInvoiceIdParamSchema,
  listDuesQuerySchema,
} from '../validators/due.validator';
import * as dueService from '../services/due.service';

const getBusinessId = (req: Request): string => {
  const businessId = req.user?.businessId;

  if (!businessId) {
    throw new ApiError(403, 'Business profile setup is required');
  }

  return businessId;
};

export const listDuesHandler = async (req: Request, res: Response): Promise<void> => {
  const query = listDuesQuerySchema.parse(req.query);
  const result = await dueService.listDues(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Dues retrieved',
    data: result,
  });
};

export const getDueSummaryHandler = async (req: Request, res: Response): Promise<void> => {
  const summary = await dueService.getDueSummary(getBusinessId(req));

  sendResponse({
    res,
    message: 'Due summary retrieved',
    data: { summary },
  });
};

export const getDueDetailsHandler = async (req: Request, res: Response): Promise<void> => {
  const { invoiceId } = dueInvoiceIdParamSchema.parse({
    invoiceId: req.params.invoiceId,
  });
  const due = await dueService.getDueDetails(getBusinessId(req), invoiceId);

  sendResponse({
    res,
    message: 'Due details retrieved',
    data: { due },
  });
};
