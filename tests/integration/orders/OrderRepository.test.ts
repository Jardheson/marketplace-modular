import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DataSource } from 'typeorm';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { OrderTypeOrmRepository } from '../../../src/modules/orders/infra/persistence/typeorm/repositories/OrderTypeOrmRepository';
import { OrderEntity } from '../../../src/modules/orders/infra/persistence/typeorm/entities/Order.entity';
import { OrderItemEntity } from '../../../src/modules/orders/infra/persistence/typeorm/entities/OrderItem.entity';
import { Order } from '../../../src/modules/orders/domain/entities/Order';
import { OrderItem } from '../../../src/modules/orders/domain/entities/OrderItem';
import { OrderStatus } from '../../../src/modules/orders/domain/entities/OrderStatus';
import { Money } from '../../../src/shared/domain/Money';
import { InitialSchema1700000000000 } from '../../../src/infra/database/migrations/1700000000000-InitialSchema';

const PRODUCT_ID = '33333333-3333-3333-3333-333333333333';

function buildOrder(customerId: string, quantity = 2): Order {
  return Order.create({
    customerId,
    items: [
      OrderItem.create({
        productId: PRODUCT_ID,
        productName: 'Teclado Mecânico',
        quantity,
        unitPrice: Money.fromBRL(150),
      }),
    ],
  });
}

describe('OrderTypeOrmRepository (integração)', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;
  let orderRepo: OrderTypeOrmRepository;

  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'orders_db',
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/))
      .start();

    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getMappedPort(5432),
      username: 'test',
      password: 'test',
      database: 'orders_db',
      entities: [OrderEntity, OrderItemEntity],
      migrations: [InitialSchema1700000000000],
      migrationsRun: true,
      synchronize: false,
      logging: false,
    });

    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        await dataSource.initialize();
        break;
      } catch (e) {
        if (attempt === 10) throw e;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    orderRepo = new OrderTypeOrmRepository(dataSource);
  }, 120000);

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  it('persiste e recupera o agregado com itens e total calculado', async () => {
    const order = buildOrder(crypto.randomUUID(), 2);
    await orderRepo.save(order);

    const found = await orderRepo.findById(order.id);

    expect(found).not.toBeNull();
    expect(found!.items).toHaveLength(1);
    expect(found!.total.toBRL()).toBe(300);
    expect(found!.status).toBe(OrderStatus.PENDING);
  });

  it('recupera todos os pedidos de um cliente', async () => {
    const customerId = crypto.randomUUID();
    const first = buildOrder(customerId, 1);
    const second = buildOrder(customerId, 3);
    await orderRepo.save(first);
    await orderRepo.save(second);

    const found = await orderRepo.findByCustomerId(customerId);
    const ids = found.map((o) => o.id);

    expect(found).toHaveLength(2);
    expect(ids).toEqual(expect.arrayContaining([first.id, second.id]));
  });

  it('paginada filtra por cliente e status', async () => {
    const customerId = crypto.randomUUID();
    const order = buildOrder(customerId, 1);
    await orderRepo.save(order);

    order.changeStatus(OrderStatus.CONFIRMED);
    await orderRepo.save(order);

    const result = await orderRepo.findPaginated(
      { page: 1, pageSize: 10 },
      { customerId, status: OrderStatus.CONFIRMED },
    );

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe(OrderStatus.CONFIRMED);
  });

  it('atualiza o status sem duplicar os itens do pedido', async () => {
    const customerId = crypto.randomUUID();
    const order = buildOrder(customerId, 2);
    await orderRepo.save(order);

    const fetched = await orderRepo.findById(order.id);
    fetched!.changeStatus(OrderStatus.CONFIRMED);
    await orderRepo.save(fetched!);

    const updated = await orderRepo.findById(order.id);
    expect(updated!.status).toBe(OrderStatus.CONFIRMED);
    expect(updated!.items).toHaveLength(1);

    const [row] = await dataSource.query(
      'SELECT COUNT(*)::int AS total FROM order_items WHERE order_id = $1',
      [order.id],
    );
    expect(row.total).toBe(1);
  });

  it('remove um pedido', async () => {
    const order = buildOrder(crypto.randomUUID(), 1);
    await orderRepo.save(order);

    await orderRepo.delete(order.id);

    expect(await orderRepo.findById(order.id)).toBeNull();
  });
});
