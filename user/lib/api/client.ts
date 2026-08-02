import type { ApiErrorResponse, ApiResponse } from '@/lib/types/auth';
import { authStorage } from '@/lib/auth/storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly errors?: ApiErrorResponse['errors'];

  constructor(statusCode: number, message: string, errors?: ApiErrorResponse['errors']) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  credentials?: RequestCredentials;
}

export const getApiBaseUrl = (): string => API_URL;

export const resolveAssetUrl = (path: string | null | undefined): string | null => {
  if (!path) {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_URL}${path}`;
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { method = 'GET', body, token, credentials = 'include' } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const accessToken = token === undefined ? authStorage.getAccessToken() : token;

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError(0, 'Network error. Please check your connection.');
  }

  let payload: ApiResponse<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message =
      payload && payload.success === false
        ? payload.message
        : response.status === 401
          ? 'Unauthorized'
          : response.status === 403
            ? 'Forbidden'
            : response.status >= 500
              ? 'Server error. Please try again later.'
              : 'Something went wrong';

    const errors = payload && payload.success === false ? payload.errors : undefined;

    if (
      response.status === 401 &&
      path !== '/api/auth/login' &&
      path !== '/api/auth/register'
    ) {
      authStorage.clear();
    }

    throw new ApiClientError(response.status, message, errors);
  }

  return payload.data;
};
