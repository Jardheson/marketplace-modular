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
});
