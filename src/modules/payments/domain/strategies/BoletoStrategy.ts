import { IPaymentStrategy } from './IPaymentStrategy';
import { Payment } from '../entities/Payment';
import { randomBytes } from 'node:crypto';
import { PaymentMethod } from '../entities/PaymentStatus';

export class BoletoStrategy implements IPaymentStrategy {
  readonly method = PaymentMethod.BOLETO;

  async process(_payment: Payment): Promise<{ transactionId: string; success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      transactionId: `BOL_${randomBytes(12).toString('hex')}`,
      success: true,
    };
  }
}
