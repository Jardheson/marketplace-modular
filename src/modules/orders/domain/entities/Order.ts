import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { Money } from '../../../../shared/domain/Money';
import { AppError } from '../../../../shared/domain/AppError';
import { OrderStatus, ORDER_STATUS_FLOW } from './OrderStatus';
import { OrderItem } from './OrderItem';

export interface OrderProps {
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: Money;
  createdAt: Date;
  updatedAt: Date;
}

export class Order extends AggregateRoot<OrderProps> {
  private constructor(props: OrderProps, id?: string) {
    super(props, id);
  }

  static create(input: { customerId: string; items: OrderItem[] }): Order {
    if (!input.customerId) throw AppError.validation('Cliente é obrigatório.');
    if (input.items.length === 0) throw AppError.validation('Pedido deve ter ao menos um item.');

    const total = input.items.reduce((sum, item) => sum.add(item.subtotal), Money.BRL(0));

    const now = new Date();
    return new Order({
      customerId: input.customerId,
      items: input.items,
      status: OrderStatus.PENDING,
      total,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: OrderProps, id: string): Order {
    return new Order(props, id);
  }

  get customerId(): string {
    return this.props.customerId;
  }
  get items(): OrderItem[] {
    return [...this.props.items];
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get total(): Money {
    return this.props.total;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  changeStatus(newStatus: OrderStatus): void {
    const allowed = ORDER_STATUS_FLOW[this.props.status];
    if (!allowed.includes(newStatus)) {
      throw AppError.business(`Transição de status inválida: ${this.props.status} → ${newStatus}`);
    }
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  canBePaid(): boolean {
    return this.props.status === OrderStatus.CONFIRMED;
  }
}
