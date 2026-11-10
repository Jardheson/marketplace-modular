import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../../shared/domain/AppError';

export function validateBody(dtoClass: new () => unknown) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const instance = plainToInstance(dtoClass, req.body);
      const errors = await validate(instance as object);
      if (errors.length > 0) {
        const details = errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
        }));
        throw AppError.validation('Dados inválidos.', { errors: details });
      }
      req.body = instance;
      next();
    } catch (error) {
      next(error);
    }
  };
}
