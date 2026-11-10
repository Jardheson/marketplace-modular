import { UseCase } from '../../../../shared/application/UseCase';
import { Order } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/entities/OrderItem';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { ICatalogService } from '../ports/ICatalogService';
import { AppError } from '../../../../shared/domain/AppError';
import { CreateOrderInput, OrderOutput } from '../dto/OrderDto';
import { ICache } from '../../../../infra/cache/RedisCache';

export class CreateOrderUseCase implements UseCase<CreateOrderInput, OrderOutput> {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly catalogService: ICatalogService,
    private readonly cache: ICache,
    private readonly prevalidateCheckout = false,
  ) {}

  async execute(input: CreateOrderInput): Promise<OrderOutput> {
    if (input.items.length === 0) {
      throw AppError.validation('Pedido deve ter ao menos um item.');
    }

    const products = this.prevalidateCheckout
      ? await Promise.all(
          input.items.map((item) => this.catalogService.getProductInfo(item.productId)),
        )
      : null;

    if (products) {
      for (const [index, product] of products.entries()) {
        if (!product) throw AppError.notFound(`Produto ${input.items[index].productId}`);
        if (!product.active) throw AppError.business(`Produto ${product.name} está inativo.`);
      }
    }

    const orderItems = [];
    for (const [index, item] of input.items.entries()) {
      const product =
        products?.[index] ?? (await this.catalogService.getProductInfo(item.productId));
      if (!product) throw AppError.notFound(`Produto ${item.productId}`);
      if (!product.active) throw AppError.business(`Produto ${product.name} está inativo.`);

      await this.catalogService.reserveStock(item.productId, item.quantity);

      orderItems.push(
        OrderItem.create({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
        }),
      );
    }

    const order = Order.create({
      customerId: input.customerId,
      items: orderItems,
    });

    const saved = await this.orderRepo.save(order);
    await this.cache.delByPattern('orders:*');
    return this.toOutput(saved);
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
