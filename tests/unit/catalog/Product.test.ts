import { describe, it, expect } from 'vitest';
import { Product } from '../../../src/modules/catalog/domain/entities/Product';
import { Money } from '../../../src/shared/domain/Money';
import { AppError } from '../../../src/shared/domain/AppError';

describe('Product (domínio)', () => {
  it('deve criar um produto válido', () => {
    const product = Product.create({
      name: 'Notebook',
      description: 'Notebook 16GB',
      price: Money.fromBRL(3500),
      stock: 10,
      categoryId: 'cat-1',
      sku: 'NB-001',
    });

    expect(product.name).toBe('Notebook');
    expect(product.price.toBRL()).toBe(3500);
    expect(product.stock).toBe(10);
    expect(product.active).toBe(true);
  });

  it('deve lançar erro ao criar produto sem nome', () => {
    expect(() =>
      Product.create({
        name: '',
        description: '',
        price: Money.fromBRL(10),
        stock: 1,
        categoryId: 'cat-1',
        sku: 'X',
      }),
    ).toThrow(AppError);
  });

  it('deve reservar estoque corretamente', () => {
    const product = Product.create({
      name: 'Mouse',
      description: '',
      price: Money.fromBRL(50),
      stock: 5,
      categoryId: 'cat-1',
      sku: 'M-1',
    });

    product.reserveStock(3);
    expect(product.stock).toBe(2);
  });

  it('deve lançar erro ao reservar mais estoque que o disponível', () => {
    const product = Product.create({
      name: 'Teclado',
      description: '',
      price: Money.fromBRL(100),
      stock: 2,
      categoryId: 'cat-1',
      sku: 'T-1',
    });

    expect(() => product.reserveStock(5)).toThrow(AppError);
  });
});
