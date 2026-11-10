import 'reflect-metadata';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { initializeDatabase, AppDataSource } from '../src/infra/database/data-source';
import { CategoryEntity } from '../src/modules/catalog/infra/persistence/typeorm/entities/Category.entity';
import { ProductEntity } from '../src/modules/catalog/infra/persistence/typeorm/entities/Product.entity';
import { OrderEntity } from '../src/modules/orders/infra/persistence/typeorm/entities/Order.entity';
import { OrderItemEntity } from '../src/modules/orders/infra/persistence/typeorm/entities/OrderItem.entity';
import { PaymentEntity } from '../src/modules/payments/infra/persistence/typeorm/entities/Payment.entity';
import { logger } from '../src/shared/infrastructure/logger';

const TOTAL_ORDERS = 100_000;
const BATCH_SIZE = 1_000;
const TOTAL_CATEGORIES = 20;
const TOTAL_PRODUCTS = 500;

async function seed() {
  await initializeDatabase();
  logger.info('Iniciando seed de dados sintéticos...');

  const catRepo = AppDataSource.getRepository(CategoryEntity);
  const prodRepo = AppDataSource.getRepository(ProductEntity);
  const orderRepo = AppDataSource.getRepository(OrderEntity);
  const itemRepo = AppDataSource.getRepository(OrderItemEntity);
  const payRepo = AppDataSource.getRepository(PaymentEntity);

  // Limpa tabelas (CASCADE por causa das FKs)
  await AppDataSource.query(
    'TRUNCATE TABLE payments, order_items, orders, products, categories RESTART IDENTITY CASCADE',
  );

  // Categorias
  const categories: CategoryEntity[] = [];
  for (let i = 0; i < TOTAL_CATEGORIES; i++) {
    categories.push({
      id: faker.string.uuid(),
      name: faker.commerce.department(),
      description: faker.lorem.sentence(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CategoryEntity);
  }
  await catRepo.save(categories, { chunk: 500 });
  logger.info({ total: categories.length }, 'Categorias criadas.');

  // Produtos
  const products: ProductEntity[] = [];
  for (let i = 0; i < TOTAL_PRODUCTS; i++) {
    const priceCents = Math.round(faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }) * 100);
    products.push({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      priceCents,
      currency: 'BRL',
      stock: faker.number.int({ min: 0, max: 1000 }),
      categoryId: faker.helpers.arrayElement(categories).id,
      sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      active: true,
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: new Date(),
    } as ProductEntity);
  }
  await prodRepo.save(products, { chunk: 500 });
  logger.info({ total: products.length }, 'Produtos criados.');

  const statuses = ['PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const methods = ['PIX', 'CREDIT_CARD', 'BOLETO'];
  const payStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

  // Pedidos em lotes
  for (let batch = 0; batch < TOTAL_ORDERS; batch += BATCH_SIZE) {
    const orders: OrderEntity[] = [];
    const items: OrderItemEntity[] = [];
    const payments: PaymentEntity[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const orderId = faker.string.uuid();
      const numItems = faker.number.int({ min: 1, max: 5 });
      const orderProducts = faker.helpers.arrayElements(products, numItems);
      let totalCents = 0;

      for (const p of orderProducts) {
        const qty = faker.number.int({ min: 1, max: 3 });
        const subtotal = Number(p.priceCents) * qty;
        totalCents += subtotal;
        items.push({
          id: faker.string.uuid(),
          orderId,
          productId: p.id,
          productName: p.name,
          quantity: qty,
          unitPriceCents: Number(p.priceCents),
          subtotalCents: subtotal,
        } as OrderItemEntity);
      }

      const status = faker.helpers.arrayElement(statuses);
      const createdAt = faker.date.past({ years: 1 });
      orders.push({
        id: orderId,
        customerId: faker.string.uuid(),
        totalCents,
        currency: 'BRL',
        status,
        items: [],
        createdAt,
        updatedAt: createdAt,
      } as OrderEntity);

      payments.push({
        id: faker.string.uuid(),
        orderId,
        amountCents: totalCents,
        currency: 'BRL',
        method: faker.helpers.arrayElement(methods),
        status: status === 'PAID' || status === 'SHIPPED' || status === 'DELIVERED'
          ? 'PAID'
          : faker.helpers.arrayElement(payStatuses),
        transactionId: faker.string.alphanumeric(20),
        paidAt: status === 'PAID' ? createdAt : null,
        createdAt,
        updatedAt: createdAt,
      } as PaymentEntity);
    }

    await orderRepo.save(orders, { chunk: 500 });
    await itemRepo.save(items, { chunk: 1000 });
    await payRepo.save(payments, { chunk: 500 });

    const progress = Math.min(batch + BATCH_SIZE, TOTAL_ORDERS);
    logger.info({ progress, total: TOTAL_ORDERS }, 'Pedidos processados.');
  }

  logger.info({ total: TOTAL_ORDERS }, 'Seed concluído com sucesso!');
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, 'Erro no seed.');
  process.exit(1);
});
