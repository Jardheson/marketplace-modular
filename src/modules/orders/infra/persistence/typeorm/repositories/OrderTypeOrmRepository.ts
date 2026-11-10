import { Repository, DataSource } from 'typeorm';
import { IOrderRepository, OrderFilters } from '../../../../domain/repositories/IOrderRepository';
import { Order } from '../../../../domain/entities/Order';
import { OrderItem } from '../../../../domain/entities/OrderItem';
import { OrderStatus } from '../../../../domain/entities/OrderStatus';
import { Money } from '../../../../../../shared/domain/Money';
import { OrderEntity } from '../entities/Order.entity';
import { OrderItemEntity } from '../entities/OrderItem.entity';
import { Paginated, PaginationParams } from '../../../../../../shared/application/Pagination';
import { randomUUID } from 'node:crypto';

export class OrderTypeOrmRepository implements IOrderRepository {
  private repo: Repository<OrderEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(OrderEntity);
  }

  async findById(id: string): Promise<Order | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['items'] });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Order[]> {
    const entities = await this.repo.find({ relations: ['items'], order: { createdAt: 'DESC' } });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const entities = await this.repo.find({
      where: { customerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findPaginated(params: PaginationParams, filters?: OrderFilters): Promise<Paginated<Order>> {
    const where: Record<string, unknown> = {};
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.status) where.status = filters.status;

    const [entities, total] = await this.repo.findAndCount({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    });

    return {
      data: entities.map((e) => this.toDomain(e)),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize) || 1,
    };
  }

  async save(order: Order): Promise<Order> {
    const exists = await this.repo.findOne({ where: { id: order.id } });

    if (exists) {
      // Atualização: altera apenas status e updatedAt (não recria itens)
      exists.status = order.status;
      exists.updatedAt = order.updatedAt;
      await this.repo.save(exists);
      return order;
    }

    // Criação: insere pedido + itens
    const entity = new OrderEntity();
    entity.id = order.id;
    entity.customerId = order.customerId;
    entity.totalCents = order.total.amount;
    entity.currency = order.total.currency;
    entity.status = order.status;
    entity.createdAt = order.createdAt;
    entity.updatedAt = order.updatedAt;
    entity.items = order.items.map((i) => {
      const item = new OrderItemEntity();
      item.id = randomUUID();
      item.order = entity;
      item.orderId = order.id;
      item.productId = i.productId;
      item.productName = i.productName;
      item.quantity = i.quantity;
      item.unitPriceCents = i.unitPrice.amount;
      item.subtotalCents = i.subtotal.amount;
      return item;
    });

    await this.repo.save(entity);
    return order;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toDomain(entity: OrderEntity): Order {
    const items = (entity.items ?? []).map((i) =>
      OrderItem.create({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Money.BRL(Number(i.unitPriceCents)),
      }),
    );
    return Order.restore(
      {
        customerId: entity.customerId,
        items,
        status: entity.status as OrderStatus,
        total: Money.BRL(Number(entity.totalCents)),
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      entity.id,
    );
  }
}
