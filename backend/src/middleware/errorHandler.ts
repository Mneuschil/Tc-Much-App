import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const meta: Record<string, unknown> = { name: err.name };
  if (env.NODE_ENV !== 'production') {
    meta.stack = err.stack;
  }
  logger.error(err.message, meta);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validierung fehlgeschlagen',
        details: err.issues,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Ein Eintrag mit diesen Daten existiert bereits',
          },
        });
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Eintrag nicht gefunden',
          },
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Datenbankfehler',
          },
        });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Ungueltige Daten',
      },
    });
    return;
  }

  // Support custom errors with statusCode and code properties
  const statusCode = (err as Error & { statusCode?: number }).statusCode || 500;
  const code =
    (err as Error & { code?: string }).code ||
    (statusCode === 404 ? 'NOT_FOUND' : statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const message = statusCode === 500 ? 'Interner Serverfehler' : err.message;

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}
