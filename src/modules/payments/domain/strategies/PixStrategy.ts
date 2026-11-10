import { IPaymentStrategy } from './IPaymentStrategy';
import { Payment } from '../entities/Payment';
import { randomBytes } from 'node:crypto';
import { PaymentMethod } from '../entities/PaymentStatus';

export class PixStrategy implements IPaymentStrategy {
  readonly method = PaymentMethod.PIX;

  async process(_payment: Payment): Promise<{ transactionId: string; success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      transactionId: `PIX_${randomBytes(12).toString('hex')}`,
      success: true,
    };
  }
}
