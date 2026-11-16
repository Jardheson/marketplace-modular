import { describe, it, expect } from 'vitest';
import { Money } from '../../../src/shared/domain/Money';
import { AppError } from '../../../src/shared/domain/AppError';

describe('Money (value object)', () => {
  it('deve criar valor em BRL corretamente', () => {
    const money = Money.fromBRL(19.9);
    expect(money.toBRL()).toBe(19.9);
    expect(money.currency).toBe('BRL');
    expect(money.amount).toBe(1990);
  });

  it('deve somar valores iguais', () => {
    const a = Money.fromBRL(10);
    const b = Money.fromBRL(5.5);
    expect(a.add(b).toBRL()).toBe(15.5);
  });

  it('deve lançar erro ao criar valor negativo', () => {
    expect(() => Money.fromBRL(-1)).toThrow(AppError);
  });

  it('deve formatar como moeda brasileira', () => {
    const money = Money.fromBRL(1234.56);
    expect(money.format()).toContain('1.234,56');
  });

  it('deve subtrair valores válidos', () => {
    const a = Money.fromBRL(20);
    const b = Money.fromBRL(5.5);
    expect(a.subtract(b).toBRL()).toBe(14.5);
  });

  it('deve lançar erro ao subtrair moedas diferentes', () => {
    const a = Money.fromBRL(10);
    const b = new (Money as any)({ amount: 500, currency: 'USD' });
    expect(() => a.subtract(b)).toThrow(AppError);
  });

  it('deve lançar erro ao somar moedas diferentes', () => {
    const a = Money.fromBRL(10);
    const b = new (Money as any)({ amount: 500, currency: 'USD' });
    expect(() => a.add(b)).toThrow(AppError);
  });

  it('deve converter fromBRL corretamente para centavos', () => {
    const money = Money.fromBRL(10.5);
    expect(money.amount).toBe(1050);
    expect(money.currency).toBe('BRL');
  });

  it('deve retornar string formatada em BRL com format()', () => {
    const money = Money.fromBRL(99.9);
    const formatted = money.format();
    expect(formatted).toContain('99,90');
    expect(formatted).toContain('R$');
  });

  it('deve lançar erro ao criar Money.BRL com valor negativo', () => {
    expect(() => (Money as any).BRL(-100)).toThrow(AppError);
  });
});
