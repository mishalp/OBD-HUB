import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../modules/auth/utils/token';
import { findUserById } from '../modules/auth/repositories/user.repository';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized');
    }

    const token = header.slice(7).trim();

    if (!token) {
      throw new ApiError(401, 'Unauthorized');
    }

    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.sub);

    if (!user) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      businessId: user.businessId ? user.businessId.toString() : null,
      businessSetupCompleted: Boolean(user.businessSetupCompleted),
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireBusiness = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user?.businessId || !req.user.businessSetupCompleted) {
    next(new ApiError(403, 'Business profile setup is required'));
    return;
  }

  next();
};
