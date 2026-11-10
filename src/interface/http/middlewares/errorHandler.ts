import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/domain/AppError';
import { logger } from '../../../shared/infrastructure/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  logger.error({ error: err instanceof Error ? err.message : String(err) }, 'unhandled_error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
    },
  });
}
