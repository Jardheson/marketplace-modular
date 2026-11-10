import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { DataSource, DataSourceOptions } from 'typeorm';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { dataSourceOptions } from '../../src/infra/database/data-source';
import { createApp } from '../../src/app';
import { queueManager } from '../../src/infra/queue/QueueManager';
import { cache } from '../../src/infra/cache/RedisCache';
import { InitialSchema1700000000000 } from '../../src/infra/database/migrations/1700000000000-InitialSchema';

describe('API Contract - Catálogo', () => {
  let container: StartedTestContainer;
  let app: ReturnType<typeof createApp>;
  let dataSource: DataSource;
  let productId: string;

  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'contract_db',
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/))
      .start();

    dataSource = new DataSource({
      ...(dataSourceOptions as unknown as Record<string, unknown>),
      type: 'postgres',
      host: container.getHost(),
      port: container.getMappedPort(5432),
      username: 'test',
      password: 'test',
      database: 'contract_db',
      migrations: [InitialSchema1700000000000],
      migrationsRun: true,
      synchronize: false,
      logging: false,
    } as DataSourceOptions);

    // Retry para lidar com o restart do postgres após o log de "ready"
    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        await dataSource.initialize();
        break;
      } catch (e) {
        if (attempt === 10) throw e;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    app = createApp(dataSource);
  }, 120000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      try {
        await new InitialSchema1700000000000().down(queryRunner);
      } finally {
        await queryRunner.release();
      }
    }
    if (dataSource && dataSource.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
    await queueManager.closeAll();
    cache.getClient().disconnect();
  });

  it('GET /api/v1/products deve retornar estrutura paginada', async () => {
    const res = await request(app).get('/api/v1/products?page=1&pageSize=10');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('pageSize');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('totalPages');
  });

  it('GET /api/v1/products/:id inexistente deve retornar 404', async () => {
    const res = await request(app).get('/api/v1/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/v1/products com body válido deve retornar 201', async () => {
    await dataSource.query(
      `INSERT INTO categories (id, name, description, active, created_at, updated_at)
       VALUES ($1, $2, $3, true, NOW(), NOW())`,
      ['11111111-1111-4111-8111-111111111111', 'Teste', ''],
    );

    const res = await request(app).post('/api/v1/products').send({
      name: 'Produto Teste',
      description: 'Descrição',
      price: 99,
      stock: 10,
      categoryId: '11111111-1111-4111-8111-111111111111',
      sku: 'TEST-001',
    });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Produto Teste');
    expect(res.body.price).toBe(99);
    productId = res.body.id;

    const productById = await request(app).get(`/api/v1/products/${productId}`);
    expect(productById.status).toBe(200);
    expect(productById.body.name).toBe('Produto Teste');
  });

  it('POST /orders deve criar pedido e permitir pagamento PIX', async () => {
    const orderResponse = await request(app)
      .post('/api/v1/orders')
      .send({
        customerId: '22222222-2222-4222-8222-222222222222',
        items: [{ productId, quantity: 2 }],
      });

    expect(orderResponse.status).toBe(201);
    expect(orderResponse.body.total).toBe(198);

    const orderBeforePayment = await request(app).get(`/api/v1/orders/${orderResponse.body.id}`);
    expect(orderBeforePayment.body.status).toBe('PENDING');

    const paymentResponse = await request(app)
      .post('/api/v1/payments')
      .set('Idempotency-Key', 'contract-payment-1')
      .send({ orderId: orderResponse.body.id, method: 'PIX' });

    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.status).toBe('PAID');

    const retriedPayment = await request(app)
      .post('/api/v1/payments')
      .set('Idempotency-Key', 'contract-payment-1')
      .send({ orderId: orderResponse.body.id, method: 'PIX' });

    expect(retriedPayment.status).toBe(201);
    expect(retriedPayment.body.id).toBe(paymentResponse.body.id);

    const orderAfterPayment = await request(app).get(`/api/v1/orders/${orderResponse.body.id}`);
    expect(orderAfterPayment.body.status).toBe('PAID');

    const orders = await request(app).get(
      '/api/v1/orders?customerId=22222222-2222-4222-8222-222222222222',
    );
    expect(orders.status).toBe(200);
    expect(orders.body.data).toHaveLength(1);
  });
});
