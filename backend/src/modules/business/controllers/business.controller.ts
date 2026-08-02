import { Request, Response } from 'express';
import { sendResponse } from '../../../utils/response';
import { toLogoPath } from '../../../middlewares/upload';
import { parseBusinessPayload } from '../validators/business.validator';
import * as businessService from '../services/business.service';

const resolveLogoPath = (req: Request): string | null | undefined => {
  if (req.file) {
    return toLogoPath(req.file.filename);
  }

  if (typeof req.body.businessLogo === 'string') {
    return req.body.businessLogo.trim() || null;
  }

  if (req.body.businessLogo === null) {
    return null;
  }

  return undefined;
};

export const createBusinessHandler = async (req: Request, res: Response): Promise<void> => {
  const input = parseBusinessPayload(req.body);
  const logoPath = resolveLogoPath(req) ?? null;
  const result = await businessService.createBusiness(req.user!.id, input, logoPath);

  sendResponse({
    res,
    statusCode: 201,
    message: 'Business profile created successfully',
    data: result,
  });
};

export const getBusinessHandler = async (req: Request, res: Response): Promise<void> => {
  const business = await businessService.getBusinessForUser(req.user!.id);

  sendResponse({
    res,
    message: 'Business profile retrieved',
    data: { business },
  });
};

export const updateBusinessHandler = async (req: Request, res: Response): Promise<void> => {
  const input = parseBusinessPayload(req.body);
  const logoPath = resolveLogoPath(req);
  const business = await businessService.updateBusiness(req.user!.id, input, logoPath);

  sendResponse({
    res,
    message: 'Business profile updated successfully',
    data: { business },
  });
};
