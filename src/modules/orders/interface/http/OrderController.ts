import { Request, Response, NextFunction } from 'express';
import { CreateOrderUseCase } from '../../application/use-cases/CreateOrderUseCase';
import { GetOrderByIdUseCase } from '../../application/use-cases/GetOrderByIdUseCase';
import { ListOrdersUseCase } from '../../application/use-cases/ListOrdersUseCase';
import { ordersCreatedTotal } from '../../../../infra/observability/metrics';
import { OrderStatus } from '../../domain/entities/OrderStatus';

export class OrderController {
  constructor(
    private readonly createUseCase: CreateOrderUseCase,
    private readonly getByIdUseCase: GetOrderByIdUseCase,
    private readonly listUseCase: ListOrdersUseCase,
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.createUseCase.execute(req.body);
      ordersCreatedTotal.inc();
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
        customerId: req.query.customerId ? String(req.query.customerId) : undefined,
        status: req.query.status as OrderStatus | undefined,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
