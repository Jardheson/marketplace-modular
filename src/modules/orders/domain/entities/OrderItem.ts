import { ValueObject } from '../../../../shared/domain/ValueObject';
import { Money } from '../../../../shared/domain/Money';
import { AppError } from '../../../../shared/domain/AppError';

export interface OrderItemProps {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: Money;
}

export class OrderItem extends ValueObject<OrderItemProps> {
  private constructor(props: OrderItemProps) {
    super(props);
  }

  static create(input: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: Money;
  }): OrderItem {
    if (input.quantity <= 0) {
      throw AppError.validation('Quantidade do item deve ser positiva.');
    }
    return new OrderItem({
      productId: input.productId,
      productName: input.productName,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
    });
  }

  get productId(): string {
    return this.props.productId;
  }
  get productName(): string {
    return this.props.productName;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unitPrice(): Money {
    return this.props.unitPrice;
  }

  get subtotal(): Money {
    return Money.BRL(this.props.unitPrice.amount * this.props.quantity);
  }
}
