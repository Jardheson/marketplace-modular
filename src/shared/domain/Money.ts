import { ValueObject } from './ValueObject';
import { AppError } from './AppError';

export interface MoneyProps {
  amount: number; // centavos
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  static BRL(amountInCents: number): Money {
    if (amountInCents < 0) {
      throw AppError.validation('Valor monetário não pode ser negativo.');
    }
    return new Money({ amount: Math.round(amountInCents), currency: 'BRL' });
  }

  static fromBRL(amount: number): Money {
    return Money.BRL(Math.round(amount * 100));
  }

  toBRL(): number {
    return this.amount / 100;
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw AppError.validation('Moedas diferentes não podem ser somadas.');
    }
    return Money.BRL(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    if (other.currency !== this.currency) {
      throw AppError.validation('Moedas diferentes não podem ser subtraídas.');
    }
    return Money.BRL(this.amount - other.amount);
  }

  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.toBRL());
  }
}
