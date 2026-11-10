import { describe, expect, it } from 'vitest';
import { Category } from '../../../src/modules/catalog/domain/entities/Category';
import { AppError } from '../../../src/shared/domain/AppError';
import { Money } from '../../../src/shared/domain/Money';
import { fail, ok } from '../../../src/shared/domain/Result';

describe('Category', () => {
  it('normaliza o nome e cria valores padrão', () => {
    const category = Category.create({ name: '  Eletrônicos  ' });
    const restored = Category.restore(
      {
        name: category.name,
        description: category.description,
        active: category.active,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      category.id,
    );

    expect(category.name).toBe('Eletrônicos');
    expect(category.description).toBe('');
    expect(category.active).toBe(true);
    expect(category.equals(category)).toBe(true);
    expect(category.equals(restored)).toBe(true);
    expect(category.equals(Category.create({ name: 'Outra' }))).toBe(false);
    expect(category.equals(null as unknown as Category)).toBe(false);
  });

  it('rejeita nome vazio ou composto apenas por espaços', () => {
    expect(() => Category.create({ name: '' })).toThrow(AppError);
    expect(() => Category.create({ name: '   ' })).toThrow(AppError);
  });
});

describe('AppError', () => {
  it.each([
    ['NOT_FOUND', 404],
    ['VALIDATION_ERROR', 400],
    ['CONFLICT', 409],
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
    ['BUSINESS_RULE', 422],
    ['INTERNAL_ERROR', 500],
  ] as const)('mapeia %s para HTTP %i', (code, status) => {
    expect(new AppError(code, 'erro').statusCode).toBe(status);
  });

  it('mantém factories, mensagens e detalhes de domínio', () => {
    expect(AppError.notFound('Pedido').message).toContain('Pedido');
    expect(AppError.validation('inválido', { field: 'name' }).details).toEqual({
      field: 'name',
    });
    expect(AppError.conflict('duplicado').statusCode).toBe(409);
    expect(AppError.business('regra').statusCode).toBe(422);
    expect(AppError.unauthorized().message).toBe('Não autorizado.');
  });
});

describe('ValueObject e Result', () => {
  it('compara valor e moeda, e rejeita moedas incompatíveis', () => {
    const amount = Money.BRL(500);

    expect(amount.equals(Money.BRL(500))).toBe(true);
    expect(amount.equals(Money.BRL(600))).toBe(false);
    expect(amount.equals(null as unknown as Money)).toBe(false);
    expect(() => amount.add(new Money({ amount: 100, currency: 'USD' }))).toThrow(AppError);
    expect(() => amount.subtract(new Money({ amount: 100, currency: 'USD' }))).toThrow(AppError);
  });

  it('representa resultados de sucesso e falha sem esconder o erro', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
    expect(fail({ message: 'indisponível', code: 'UPSTREAM' })).toEqual({
      ok: false,
      error: { message: 'indisponível', code: 'UPSTREAM' },
    });
  });
});
