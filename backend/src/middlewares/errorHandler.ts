import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

interface ErrorBody {
  success: false;
  message: string;
  data: null;
  errors?: unknown;
  stack?: string;
}

const formatZodError = (error: ZodError): { path: string; message: string }[] => {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
};

const isMongoDuplicateKeyError = (
  err: unknown,
): err is mongoose.mongo.MongoServerError => {
  return err instanceof mongoose.mongo.MongoServerError && err.code === 11000;
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = formatZodError(err);
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Logo must be 2MB or smaller'
        : 'Invalid file upload';
  } else if (isMongoDuplicateKeyError(err)) {
    statusCode = 409;
    const key = Object.keys(err.keyPattern ?? {})[0];
    message =
      key === 'ownerId'
        ? 'Business profile already completed'
        : key === 'email'
          ? 'Email already registered'
          : key === 'phone'
            ? 'Phone number already exists for this business'
            : key === 'name'
              ? 'Item name already exists for this business'
              : 'Duplicate record';
    errors =
      key === 'email'
        ? [{ path: 'email', message: 'Email already registered' }]
        : key === 'phone'
          ? [{ path: 'phone', message: 'Phone number already exists for this business' }]
          : key === 'name'
            ? [{ path: 'name', message: 'Item name already exists for this business' }]
            : undefined;
  } else if (err instanceof Error) {
    message = err.message;
  }

  const body: ErrorBody = {
    success: false,
    message,
    data: null,
  };

  if (errors !== undefined) {
    body.errors = errors;
  }

  if (env.NODE_ENV === 'development' && err instanceof Error) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};
