import { UseCase } from '../../../../shared/application/UseCase';
import { Payment } from '../../domain/entities/Payment';
import { Money } from '../../../../shared/domain/Money';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { PaymentStrategyResolver } from '../services/PaymentStrategyResolver';
import { IOrderService } from '../ports/IOrderService';
import { AppError } from '../../../../shared/domain/AppError';
import { ProcessPaymentInput, PaymentOutput } from '../dto/PaymentDto';
import { paymentsProcessedTotal } from '../../../../infra/observability/metrics';
import { ICache } from '../../../../infra/cache/RedisCache';

export class ProcessPaymentUseCase implements UseCase<ProcessPaymentInput, PaymentOutput> {
  constructor(
    private readonly paymentRepo: IPaymentRepository,
    private readonly strategyResolver: PaymentStrategyResolver,
    private readonly orderService: IOrderService,
    private readonly cache: ICache,
  ) {}

  async execute(input: ProcessPaymentInput): Promise<PaymentOutput> {
    const existing = await this.paymentRepo.findByOrderId(input.orderId);
    if (existing && existing.status !== 'FAILED') {
      throw AppError.conflict('Já existe um pagamento para este pedido.');
    }

    const totalCents = await this.orderService.getOrderTotal(input.orderId);
    if (!totalCents) throw AppError.notFound(`Pedido ${input.orderId}`);

    const payment = Payment.create({
      orderId: input.orderId,
      amount: Money.BRL(totalCents),
      method: input.method,
    });

    const strategy = this.strategyResolver.resolve(input.method);
    const result = await strategy.process(payment);

    if (result.success) {
      payment.markAsPaid(result.transactionId);
      await this.orderService.confirmOrder(input.orderId);
      paymentsProcessedTotal.inc({ status: 'PAID' });
    } else {
      payment.markAsFailed();
      paymentsProcessedTotal.inc({ status: 'FAILED' });
    }

    const saved = await this.paymentRepo.save(payment);
    await this.cache.delByPattern('orders:*');
    return this.toOutput(saved);
  }

  private toOutput(payment: Payment): PaymentOutput {
    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount.toBRL(),
      currency: payment.amount.currency,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}
