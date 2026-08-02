import { CookieOptions, Request, Response } from 'express';
import { env } from '../../../config/env';
import { sendResponse } from '../../../utils/response';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { verifyAccessToken, verifyRefreshToken } from '../utils/token';
import * as authService from '../services/auth.service';

const REFRESH_COOKIE_NAME = 'refreshToken';

const getRefreshCookieOptions = (): CookieOptions => {
  const isProduction = env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const resolveUserIdForLogout = (req: Request): string | null => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (typeof refreshToken === 'string' && refreshToken.length > 0) {
    try {
      return verifyRefreshToken(refreshToken).sub;
    } catch {
      // Fall through to access token
    }
  }

  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7).trim();

    if (token) {
      try {
        return verifyAccessToken(token).sub;
      } catch {
        return null;
      }
    }
  }

  return null;
};

const sendAuthSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  result: { user: unknown; accessToken: string; refreshToken: string },
): void => {
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());

  sendResponse({
    res,
    statusCode,
    message,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
};

export const registerHandler = async (req: Request, res: Response): Promise<void> => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);

  sendAuthSuccess(res, 201, 'Registration successful', result);
};

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);

  sendAuthSuccess(res, 200, 'Login successful', result);
};

export const logoutHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = resolveUserIdForLogout(req);

  if (userId) {
    await authService.logout(userId);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/auth',
  });

  sendResponse({
    res,
    message: 'Logout successful',
    data: null,
  });
};

export const meHandler = async (req: Request, res: Response): Promise<void> => {
  const user = await authService.getCurrentUser(req.user!.id);

  sendResponse({
    res,
    message: 'Authenticated user retrieved',
    data: { user },
  });
};
