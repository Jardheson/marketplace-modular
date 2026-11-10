import { Repository, DataSource } from 'typeorm';
import { IPaymentRepository } from '../../../../domain/repositories/IPaymentRepository';
import { Payment } from '../../../../domain/entities/Payment';
import { PaymentMethod, PaymentStatus } from '../../../../domain/entities/PaymentStatus';
import { Money } from '../../../../../../shared/domain/Money';
import { PaymentEntity } from '../entities/Payment.entity';

export class PaymentTypeOrmRepository implements IPaymentRepository {
  private repo: Repository<PaymentEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(PaymentEntity);
  }

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Payment[]> {
    const entities = await this.repo.find({ order: { createdAt: 'DESC' } });
    return entities.map((e) => this.toDomain(e));
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const entity = await this.repo.findOne({ where: { orderId } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(payment: Payment): Promise<Payment> {
    const entity = new PaymentEntity();
    entity.id = payment.id;
    entity.orderId = payment.orderId;
    entity.amountCents = payment.amount.amount;
    entity.currency = payment.amount.currency;
    entity.method = payment.method;
    entity.status = payment.status;
    entity.transactionId = payment.transactionId ?? null;
    entity.paidAt = payment.paidAt ?? null;
    entity.createdAt = payment.createdAt;
    entity.updatedAt = payment.updatedAt;
    await this.repo.save(entity);
    return payment;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toDomain(entity: PaymentEntity): Payment {
    return Payment.restore(
      {
        orderId: entity.orderId,
        amount: Money.BRL(Number(entity.amountCents)),
        method: entity.method as PaymentMethod,
        status: entity.status as PaymentStatus,
        transactionId: entity.transactionId ?? undefined,
        paidAt: entity.paidAt ?? undefined,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      entity.id,
    );
  }
}
