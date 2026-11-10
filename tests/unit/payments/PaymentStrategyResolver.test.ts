import { describe, it, expect } from 'vitest';
import { PaymentStrategyResolver } from '../../../src/modules/payments/application/services/PaymentStrategyResolver';
import { PixStrategy } from '../../../src/modules/payments/domain/strategies/PixStrategy';
import { CreditCardStrategy } from '../../../src/modules/payments/domain/strategies/CreditCardStrategy';
import { BoletoStrategy } from '../../../src/modules/payments/domain/strategies/BoletoStrategy';
import { PaymentMethod } from '../../../src/modules/payments/domain/entities/PaymentStatus';
import { AppError } from '../../../src/shared/domain/AppError';

describe('PaymentStrategyResolver (Strategy Pattern)', () => {
  const resolver = new PaymentStrategyResolver([
    new PixStrategy(),
    new CreditCardStrategy(),
    new BoletoStrategy(),
  ]);

  it('deve resolver a estratégia PIX', () => {
    const strategy = resolver.resolve(PaymentMethod.PIX);
    expect(strategy.method).toBe('PIX');
  });

  it('deve resolver a estratégia CREDIT_CARD', () => {
    const strategy = resolver.resolve(PaymentMethod.CREDIT_CARD);
    expect(strategy.method).toBe('CREDIT_CARD');
  });

  it('deve lançar erro para método não suportado', () => {
    expect(() => resolver.resolve('CRYPTO' as unknown as PaymentMethod)).toThrow(AppError);
  });
});
