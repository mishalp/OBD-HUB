import jwt, { JwtPayload, SignOptions, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { env } from '../../../config/env';
import { ApiError } from '../../../utils/ApiError';
import { AuthTokenPayload, AuthTokens } from '../types/auth.types';

const isAuthTokenPayload = (payload: string | JwtPayload): payload is AuthTokenPayload & JwtPayload => {
  if (typeof payload === 'string') {
    return false;
  }

  return (
    typeof payload.sub === 'string' &&
    typeof payload.email === 'string' &&
    payload.role === 'admin'
  );
};

export const generateTokenPair = (payload: AuthTokenPayload): AuthTokens => {
  const accessOptions: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  };

  const refreshOptions: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOptions);
  const refreshToken = jwt.sign(
    { ...payload, jti: randomBytes(16).toString('hex') },
    env.JWT_REFRESH_SECRET,
    refreshOptions,
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (!isAuthTokenPayload(decoded)) {
      throw new ApiError(401, 'Malformed token');
    }

    return {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TokenExpiredError) {
      throw new ApiError(401, 'Access token expired');
    }

    if (error instanceof JsonWebTokenError) {
      throw new ApiError(401, 'Malformed token');
    }

    throw new ApiError(401, 'Unauthorized');
  }
};

export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

    if (!isAuthTokenPayload(decoded)) {
      throw new ApiError(401, 'Malformed token');
    }

    return {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TokenExpiredError) {
      throw new ApiError(401, 'Refresh token expired');
    }

    if (error instanceof JsonWebTokenError) {
      throw new ApiError(401, 'Malformed token');
    }

    throw new ApiError(401, 'Unauthorized');
  }
};

export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};
