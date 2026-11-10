import { IPaymentStrategy } from '../../domain/strategies/IPaymentStrategy';
import { PaymentMethod } from '../../domain/entities/PaymentStatus';
import { AppError } from '../../../../shared/domain/AppError';

export class PaymentStrategyResolver {
  private strategies = new Map<string, IPaymentStrategy>();

  constructor(strategies: IPaymentStrategy[]) {
    for (const strategy of strategies) {
      this.strategies.set(strategy.method, strategy);
    }
  }

  resolve(method: PaymentMethod): IPaymentStrategy {
    const strategy = this.strategies.get(method);
    if (!strategy) {
      throw AppError.validation(`Método de pagamento não suportado: ${method}`);
    }
    return strategy;
  }
}
