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

  it('deve marcar pagamento como falho com markAsFailed', () => {
    const payment = Payment.create({
      orderId: 'o1',
      amount: Money.fromBRL(100),
      method: PaymentMethod.PIX,
    });

    payment.markAsFailed();

    expect(payment.status).toBe(PaymentStatus.FAILED);
  });

  it('deve restaurar pagamento com restore', () => {
    const props = {
      orderId: 'o1',
      amount: Money.fromBRL(100),
      method: PaymentMethod.PIX,
      status: PaymentStatus.PAID,
      transactionId: 'tx-123',
      paidAt: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const payment = Payment.restore(props, 'pay-456');

    expect(payment.id).toBe('pay-456');
    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(payment.transactionId).toBe('tx-123');
  });

  it('deve lançar erro ao criar pagamento com orderId vazio', () => {
    expect(() =>
      Payment.create({
        orderId: '',
        amount: Money.fromBRL(100),
        method: PaymentMethod.PIX,
      }),
    ).toThrow(AppError);
  });

  it('deve lançar erro ao criar pagamento com método inválido', () => {
    expect(() =>
      Payment.create({
        orderId: 'o1',
        amount: Money.fromBRL(100),
        method: 'INVALID' as PaymentMethod,
      }),
    ).toThrow(AppError);
  });

  it('deve expor getters corretamente', () => {
    const payment = Payment.create({
      orderId: 'o1',
      amount: Money.fromBRL(100),
      method: PaymentMethod.PIX,
    });

    expect(payment.orderId).toBe('o1');
    expect(payment.amount.toBRL()).toBe(100);
    expect(payment.method).toBe(PaymentMethod.PIX);
    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(payment.transactionId).toBeUndefined();
    expect(payment.paidAt).toBeUndefined();
    expect(payment.createdAt).toBeInstanceOf(Date);
    expect(payment.updatedAt).toBeInstanceOf(Date);
  });
});
