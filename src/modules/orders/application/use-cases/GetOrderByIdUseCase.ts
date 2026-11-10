import { UseCase } from '../../../../shared/application/UseCase';
import { Order } from '../../domain/entities/Order';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { AppError } from '../../../../shared/domain/AppError';
import { OrderOutput } from '../dto/OrderDto';
import { ICache } from '../../../../infra/cache/RedisCache';

export class GetOrderByIdUseCase implements UseCase<string, OrderOutput> {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cache: ICache,
  ) {}

  async execute(id: string): Promise<OrderOutput> {
    const cacheKey = `orders:${id}`;
    const cached = await this.cache.get<OrderOutput>(cacheKey);
    if (cached) return cached;

    const order = await this.orderRepo.findById(id);
    if (!order) throw AppError.notFound('Pedido');

    const output = this.toOutput(order);
    await this.cache.set(cacheKey, output);
    return output;
  }

  private toOutput(order: Order): OrderOutput {
    return {
      id: order.id,
      customerId: order.customerId,
      items: order.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toBRL(),
        subtotal: i.subtotal.toBRL(),
      })),
      status: order.status,
      total: order.total.toBRL(),
      currency: order.total.currency,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
