import { describe, it, expect } from 'vitest';
import { PixStrategy } from '../../../src/modules/payments/domain/strategies/PixStrategy';
import { CreditCardStrategy } from '../../../src/modules/payments/domain/strategies/CreditCardStrategy';
import { BoletoStrategy } from '../../../src/modules/payments/domain/strategies/BoletoStrategy';
import { PaymentMethod } from '../../../src/modules/payments/domain/entities/PaymentStatus';
import { Payment } from '../../../src/modules/payments/domain/entities/Payment';
import { Money } from '../../../src/shared/domain/Money';

const payment = Payment.create({
  orderId: 'order-1',
  amount: Money.fromBRL(100),
  method: PaymentMethod.PIX,
});

describe('Payment Strategies', () => {
  describe('PixStrategy', () => {
    it('deve ter método PIX e retornar sucesso', async () => {
      const strategy = new PixStrategy();
      expect(strategy.method).toBe(PaymentMethod.PIX);

      const result = await strategy.process(payment);
      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^PIX_[0-9a-f]{24}$/);
    });
  });

  describe('CreditCardStrategy', () => {
    it('deve ter método CREDIT_CARD e retornar sucesso', async () => {
      const strategy = new CreditCardStrategy();
      expect(strategy.method).toBe(PaymentMethod.CREDIT_CARD);

      const result = await strategy.process(payment);
      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^CC_[0-9a-f]{24}$/);
    });
  });

  describe('BoletoStrategy', () => {
    it('deve ter método BOLETO e retornar sucesso', async () => {
      const strategy = new BoletoStrategy();
      expect(strategy.method).toBe(PaymentMethod.BOLETO);

      const result = await strategy.process(payment);
      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^BOL_[0-9a-f]{24}$/);
    });
  });
});
