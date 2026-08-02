import { Request, Response } from 'express';
import { ApiError } from '../../../utils/ApiError';
import { sendResponse } from '../../../utils/response';
import {
  invoiceNumberQuerySchema,
  updateInvoiceNumberSettingsSchema,
} from '../validators/numberSequence.validator';
import * as numberSequenceService from '../services/numberSequence.service';
import { toInvoiceNumberResult } from '../types/numberSequence.types';
import { DEFAULT_DOCUMENT_TYPE } from '../utils/documentTypes';

const getBusinessId = (req: Request): string => {
  const businessId = req.user?.businessId;

  if (!businessId) {
    throw new ApiError(403, 'Business profile setup is required');
  }

  return businessId;
};

export const getNextInvoiceNumberHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = invoiceNumberQuerySchema.parse(req.query);
  const result = await numberSequenceService.reserveNextNumber(
    getBusinessId(req),
    query.documentType,
  );

  sendResponse({
    res,
    message: 'Invoice number reserved',
    data: toInvoiceNumberResult(result),
  });
};

export const peekInvoiceNumberHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = invoiceNumberQuerySchema.parse(req.query);
  const result = await numberSequenceService.peekNextNumber(
    getBusinessId(req),
    query.documentType,
  );

  sendResponse({
    res,
    message: 'Next invoice number retrieved',
    data: toInvoiceNumberResult(result),
  });
};

export const updateInvoiceNumberSettingsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const input = updateInvoiceNumberSettingsSchema.parse(req.body);
  const sequence = await numberSequenceService.updateSequenceSettings(
    getBusinessId(req),
    input,
    DEFAULT_DOCUMENT_TYPE,
  );

  sendResponse({
    res,
    message: 'Invoice number settings updated',
    data: { sequence },
  });
};
