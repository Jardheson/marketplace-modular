import { Request, Response, NextFunction } from 'express';
import { CreateProductUseCase } from '../../application/use-cases/CreateProductUseCase';
import { GetProductByIdUseCase } from '../../application/use-cases/GetProductByIdUseCase';
import { ListProductsUseCase } from '../../application/use-cases/ListProductsUseCase';
import { CreateProductRequest } from './dto/CreateProductRequest';

export class ProductController {
  constructor(
    private readonly createUseCase: CreateProductUseCase,
    private readonly getByIdUseCase: GetProductByIdUseCase,
    private readonly listUseCase: ListProductsUseCase,
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateProductRequest;
      const result = await this.createUseCase.execute({
        name: input.name,
        description: input.description ?? '',
        price: Number(input.price),
        stock: Number(input.stock),
        categoryId: String(input.categoryId),
        sku: String(input.sku),
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getByIdUseCase.execute(String(req.params.id));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
      const result = await this.listUseCase.execute({
        page,
        pageSize,
        categoryId: req.query.categoryId as string | undefined,
        active: req.query.active !== undefined ? String(req.query.active) === 'true' : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
