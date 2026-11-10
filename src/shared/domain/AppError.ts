export type ErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'BUSINESS_RULE';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.statusCode = AppError.httpStatus(code);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  private static httpStatus(code: ErrorCode): number {
    switch (code) {
      case 'NOT_FOUND':
        return 404;
      case 'VALIDATION_ERROR':
        return 400;
      case 'CONFLICT':
        return 409;
      case 'UNAUTHORIZED':
        return 401;
      case 'FORBIDDEN':
        return 403;
      case 'BUSINESS_RULE':
        return 422;
      case 'INTERNAL_ERROR':
      default:
        return 500;
    }
  }

  static notFound(resource: string): AppError {
    return new AppError('NOT_FOUND', `${resource} não encontrado.`);
  }

  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('VALIDATION_ERROR', message, details);
  }

  static conflict(message: string): AppError {
    return new AppError('CONFLICT', message);
  }

  static business(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('BUSINESS_RULE', message, details);
  }

  static unauthorized(message = 'Não autorizado.'): AppError {
    return new AppError('UNAUTHORIZED', message);
  }
}
