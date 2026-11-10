import { DataSource } from 'typeorm';
import { PaymentTypeOrmRepository } from './infra/persistence/typeorm/repositories/PaymentTypeOrmRepository';
import { OrderServiceAdapter } from './infra/adapters/OrderServiceAdapter';
import { PixStrategy } from './domain/strategies/PixStrategy';
import { CreditCardStrategy } from './domain/strategies/CreditCardStrategy';
import { BoletoStrategy } from './domain/strategies/BoletoStrategy';
import { PaymentStrategyResolver } from './application/services/PaymentStrategyResolver';
import { ProcessPaymentUseCase } from './application/use-cases/ProcessPaymentUseCase';
import { PaymentController } from './interface/http/PaymentController';
import { paymentRoutes } from './interface/http/routes';
import { IOrderRepository } from '../orders/domain/repositories/IOrderRepository';
import { cache } from '../../infra/cache/RedisCache';
import { queueManager } from '../../infra/queue/QueueManager';
import { registerPaymentWorker, QUEUE_NAME } from './infra/queue/paymentWorker';
import { PaymentOutput, ProcessPaymentInput } from './application/dto/PaymentDto';

export function createPaymentsModule(dataSource: DataSource, orderRepo: IOrderRepository) {
  const paymentRepo = new PaymentTypeOrmRepository(dataSource);
  const orderService = new OrderServiceAdapter(orderRepo);

  const strategies = [new PixStrategy(), new CreditCardStrategy(), new BoletoStrategy()];
  const strategyResolver = new PaymentStrategyResolver(strategies);

  const processUseCase = new ProcessPaymentUseCase(
    paymentRepo,
    strategyResolver,
    orderService,
    cache,
  );

  registerPaymentWorker((input) => processUseCase.execute(input));
  const controller = new PaymentController((input, idempotencyKey) =>
    queueManager.enqueue<ProcessPaymentInput, PaymentOutput>(QUEUE_NAME, {
      idempotencyKey,
      data: input,
    }),
  );

  return {
    paymentRepo,
    routes: paymentRoutes(controller),
  };
}
