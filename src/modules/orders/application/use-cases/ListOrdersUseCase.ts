import { UseCase } from '../../../../shared/application/UseCase';
import { Order } from '../../domain/entities/Order';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { ListOrdersInput, OrderOutput } from '../dto/OrderDto';
import { Paginated, paginate } from '../../../../shared/application/Pagination';
import { ICache } from '../../../../infra/cache/RedisCache';

export class ListOrdersUseCase implements UseCase<ListOrdersInput, Paginated<OrderOutput>> {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cache: ICache,
  ) {}

  async execute(input: ListOrdersInput): Promise<Paginated<OrderOutput>> {
    const cacheKey = `orders:list:${JSON.stringify(input)}`;
    const cached = await this.cache.get<Paginated<OrderOutput>>(cacheKey);
    if (cached) return cached;

    const result = await this.orderRepo.findPaginated(
      { page: input.page, pageSize: input.pageSize },
      { customerId: input.customerId, status: input.status },
    );

    const output = paginate(
      result.data.map((o) => this.toOutput(o)),
      result.total,
      result.page,
      result.pageSize,
    );
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
