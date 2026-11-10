import { describe, it, expect } from 'vitest';
import { Payment } from '../../../src/modules/payments/domain/entities/Payment';
import { Money } from '../../../src/shared/domain/Money';
import {
  PaymentMethod,
  PaymentStatus,
} from '../../../src/modules/payments/domain/entities/PaymentStatus';
import { AppError } from '../../../src/shared/domain/AppError';

describe('Payment (domínio)', () => {
  it('deve criar pagamento pendente', () => {
    const payment = Payment.create({
      orderId: 'o1',
      amount: Money.fromBRL(100),
      method: PaymentMethod.PIX,
    });
    expect(payment.status).toBe(PaymentStatus.PENDING);
  });

  it('deve marcar como pago', () => {
    const payment = Payment.create({
      orderId: 'o1',
      amount: Money.fromBRL(100),
      method: PaymentMethod.PIX,
    });
    payment.markAsPaid('tx-123');
    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(payment.transactionId).toBe('tx-123');
  });

  it('deve bloquear marcar como pago se não estiver pendente', () => {
    const payment = Payment.create({
      orderId: 'o1',
      amount: Money.fromBRL(100),
      method: PaymentMethod.PIX,
    });
    payment.markAsPaid('tx-1');
    expect(() => payment.markAsPaid('tx-2')).toThrow(AppError);
  });
});
