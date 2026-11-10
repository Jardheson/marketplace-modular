import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DataSource } from 'typeorm';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { PaymentTypeOrmRepository } from '../../../src/modules/payments/infra/persistence/typeorm/repositories/PaymentTypeOrmRepository';
import { PaymentEntity } from '../../../src/modules/payments/infra/persistence/typeorm/entities/Payment.entity';
import { Payment } from '../../../src/modules/payments/domain/entities/Payment';
import {
  PaymentMethod,
  PaymentStatus,
} from '../../../src/modules/payments/domain/entities/PaymentStatus';
import { Money } from '../../../src/shared/domain/Money';
import { InitialSchema1700000000000 } from '../../../src/infra/database/migrations/1700000000000-InitialSchema';

function buildPayment(orderId = crypto.randomUUID()): Payment {
  return Payment.create({
    orderId,
    amount: Money.fromBRL(199.9),
    method: PaymentMethod.PIX,
  });
}

describe('PaymentTypeOrmRepository (integração)', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;
  let paymentRepo: PaymentTypeOrmRepository;

  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'payments_db',
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
      database: 'payments_db',
      entities: [PaymentEntity],
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

    paymentRepo = new PaymentTypeOrmRepository(dataSource);
  }, 120000);

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  it('persiste e recupera por id e por pedido', async () => {
    const payment = buildPayment();
    await paymentRepo.save(payment);

    const byId = await paymentRepo.findById(payment.id);
    const byOrderId = await paymentRepo.findByOrderId(payment.orderId);

    expect(byId).not.toBeNull();
    expect(byId!.amount.toBRL()).toBe(199.9);
    expect(byOrderId!.id).toBe(payment.id);
    expect(byOrderId!.status).toBe(PaymentStatus.PENDING);
  });

  it('retorna null quando o pedido não possui pagamento', async () => {
    expect(await paymentRepo.findByOrderId(crypto.randomUUID())).toBeNull();
  });

  it('marca o pagamento como pago com transação e data', async () => {
    const payment = buildPayment();
    await paymentRepo.save(payment);

    payment.markAsPaid('TX-INTEGRACAO-1');
    await paymentRepo.save(payment);

    const found = await paymentRepo.findById(payment.id);
    expect(found!.status).toBe(PaymentStatus.PAID);
    expect(found!.transactionId).toBe('TX-INTEGRACAO-1');
    expect(found!.paidAt).toBeInstanceOf(Date);
  });

  it('lista os pagamentos criados e remove por id', async () => {
    const first = buildPayment();
    const second = buildPayment();
    await paymentRepo.save(first);
    await paymentRepo.save(second);

    const all = await paymentRepo.findAll();
    const ids = all.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining([first.id, second.id]));

    await paymentRepo.delete(first.id);
    expect(await paymentRepo.findById(first.id)).toBeNull();
  });
});
