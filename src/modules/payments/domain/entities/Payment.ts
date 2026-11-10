import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { Money } from '../../../../shared/domain/Money';
import { PaymentStatus, PaymentMethod } from './PaymentStatus';
import { AppError } from '../../../../shared/domain/AppError';

export interface PaymentProps {
  orderId: string;
  amount: Money;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment extends AggregateRoot<PaymentProps> {
  private constructor(props: PaymentProps, id?: string) {
    super(props, id);
  }

  static create(input: { orderId: string; amount: Money; method: PaymentMethod }): Payment {
    if (!input.orderId) throw AppError.validation('Pedido é obrigatório.');
    if (!Object.values(PaymentMethod).includes(input.method)) {
      throw AppError.validation('Método de pagamento inválido.');
    }
    const now = new Date();
    return new Payment({
      orderId: input.orderId,
      amount: input.amount,
      method: input.method,
      status: PaymentStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: PaymentProps, id: string): Payment {
    return new Payment(props, id);
  }

  get orderId(): string {
    return this.props.orderId;
  }
  get amount(): Money {
    return this.props.amount;
  }
  get method(): PaymentMethod {
    return this.props.method;
  }
  get status(): PaymentStatus {
    return this.props.status;
  }
  get transactionId(): string | undefined {
    return this.props.transactionId;
  }
  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markAsPaid(transactionId: string): void {
    if (this.props.status !== PaymentStatus.PENDING) {
      throw AppError.business('Pagamento não está pendente.');
    }
    this.props.status = PaymentStatus.PAID;
    this.props.transactionId = transactionId;
    this.props.paidAt = new Date();
    this.props.updatedAt = new Date();
  }

  markAsFailed(): void {
    this.props.status = PaymentStatus.FAILED;
    this.props.updatedAt = new Date();
  }
}
