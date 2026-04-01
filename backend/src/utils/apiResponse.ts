import { Response } from 'express';
import type { ApiResponse, PaginatedResponse } from '@tennis-club/shared';

export function success<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(body);
}

export function error(
  res: Response,
  message: string,
  statusCode = 400,
  code = 'ERROR',
  details?: unknown
): void {
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  res.status(statusCode).json(body);
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): void {
  const body: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  res.status(200).json(body);
}
