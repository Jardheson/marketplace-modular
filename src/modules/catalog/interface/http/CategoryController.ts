import { Request, Response, NextFunction } from 'express';
import { CreateCategoryUseCase } from '../../application/use-cases/CreateCategoryUseCase';
import { CreateCategoryRequest } from './dto/CreateCategoryRequest';

export class CategoryController {
  constructor(private readonly createUseCase: CreateCategoryUseCase) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateCategoryRequest;
      const result = await this.createUseCase.execute({
        name: input.name,
        description: input.description ?? '',
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
