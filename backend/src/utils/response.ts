import { Response } from 'express';

interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
}

export const sendResponse = <T>({
  res,
  statusCode = 200,
  message = 'Success',
  data = null as T,
}: ApiResponseOptions<T>): Response => {
  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
  });
};
