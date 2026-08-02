import { Request, Response } from 'express';
import { sendResponse } from '../../../utils/response';
import { toAvatarPath, toLogoPath } from '../../../middlewares/upload';
import {
  businessSettingsSchema,
  changePasswordSchema,
  invoiceSettingsSchema,
  preferenceSettingsSchema,
  profileSettingsSchema,
  taxSettingsSchema,
} from '../validators/settings.validator';
import * as settingsService from '../services/settings.service';

/**
 * Multipart bodies arrive as strings, so an omitted field is simply absent.
 * Returning `undefined` keeps the stored file untouched.
 */
const resolveUploadedPath = (
  req: Request,
  toPath: (filename: string) => string,
): string | null | undefined => {
  if (req.file) {
    return toPath(req.file.filename);
  }

  return undefined;
};

export const getSettingsHandler = async (req: Request, res: Response): Promise<void> => {
  const settings = await settingsService.getSettings(req.user!.id);

  sendResponse({
    res,
    message: 'Settings retrieved',
    data: settings,
  });
};

export const updateBusinessSettingsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const input = businessSettingsSchema.parse(req.body ?? {});
  const logoPath = resolveUploadedPath(req, toLogoPath);
  const result = await settingsService.updateBusinessSettings(
    req.user!.id,
    input,
    logoPath,
  );

  sendResponse({
    res,
    message: 'Business profile updated successfully',
    data: result,
  });
};

export const updateInvoiceSettingsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const input = invoiceSettingsSchema.parse(req.body ?? {});
  const result = await settingsService.updateInvoiceSettings(req.user!.id, input);

  sendResponse({
    res,
    message: 'Invoice settings updated successfully',
    data: result,
  });
};

export const updateTaxSettingsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const input = taxSettingsSchema.parse(req.body ?? {});
  const result = await settingsService.updateTaxSettings(req.user!.id, input);

  sendResponse({
    res,
    message: 'Tax settings updated successfully',
    data: result,
  });
};

export const updatePreferencesHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const input = preferenceSettingsSchema.parse(req.body ?? {});
  const result = await settingsService.updatePreferenceSettings(req.user!.id, input);

  sendResponse({
    res,
    message: 'Preferences updated successfully',
    data: result,
  });
};

export const updateProfileHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const input = profileSettingsSchema.parse(req.body ?? {});
  const avatarPath = resolveUploadedPath(req, toAvatarPath);
  const result = await settingsService.updateProfileSettings(
    req.user!.id,
    input,
    avatarPath,
  );

  sendResponse({
    res,
    message: 'Profile updated successfully',
    data: result,
  });
};

export const changePasswordHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const input = changePasswordSchema.parse(req.body ?? {});
  await settingsService.changePassword(req.user!.id, input);

  sendResponse({
    res,
    message: 'Password changed successfully',
    data: null,
  });
};
