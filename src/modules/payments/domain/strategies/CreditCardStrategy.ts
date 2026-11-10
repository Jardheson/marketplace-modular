import { IPaymentStrategy } from './IPaymentStrategy';
import { Payment } from '../entities/Payment';
import { randomBytes } from 'node:crypto';
import { PaymentMethod } from '../entities/PaymentStatus';

export class CreditCardStrategy implements IPaymentStrategy {
  readonly method = PaymentMethod.CREDIT_CARD;

  async process(_payment: Payment): Promise<{ transactionId: string; success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      transactionId: `CC_${randomBytes(12).toString('hex')}`,
      success: true,
    };
  }
}
