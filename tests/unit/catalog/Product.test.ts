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

  it('deve atualizar preço e updatedAt com updatePrice', async () => {
    const product = Product.create({
      name: 'Mouse',
      description: '',
      price: Money.fromBRL(50),
      stock: 5,
      categoryId: 'cat-1',
      sku: 'M-1',
    });
    const oldUpdatedAt = product.updatedAt;
    await new Promise((resolve) => setTimeout(resolve, 10));
    const newPrice = Money.fromBRL(75);

    product.updatePrice(newPrice);

    expect(product.price.toBRL()).toBe(75);
    expect(product.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
  });

  it('deve adicionar estoque com quantidade positiva', () => {
    const product = Product.create({
      name: 'Mouse',
      description: '',
      price: Money.fromBRL(50),
      stock: 5,
      categoryId: 'cat-1',
      sku: 'M-1',
    });

    product.addStock(10);

    expect(product.stock).toBe(15);
  });

  it('deve lançar erro ao adicionar estoque com quantidade <= 0', () => {
    const product = Product.create({
      name: 'Mouse',
      description: '',
      price: Money.fromBRL(50),
      stock: 5,
      categoryId: 'cat-1',
      sku: 'M-1',
    });

    expect(() => product.addStock(0)).toThrow(AppError);
    expect(() => product.addStock(-1)).toThrow(AppError);
  });

  it('deve lançar erro ao reservar estoque com quantidade <= 0', () => {
    const product = Product.create({
      name: 'Mouse',
      description: '',
      price: Money.fromBRL(50),
      stock: 5,
      categoryId: 'cat-1',
      sku: 'M-1',
    });

    expect(() => product.reserveStock(0)).toThrow(AppError);
    expect(() => product.reserveStock(-1)).toThrow(AppError);
  });

  it('deve desativar o produto com deactivate', () => {
    const product = Product.create({
      name: 'Mouse',
      description: '',
      price: Money.fromBRL(50),
      stock: 5,
      categoryId: 'cat-1',
      sku: 'M-1',
    });

    product.deactivate();

    expect(product.active).toBe(false);
  });

  it('deve restaurar produto com restore', () => {
    const props = {
      name: 'Notebook',
      description: 'Notebook 16GB',
      price: Money.fromBRL(3500),
      stock: 10,
      categoryId: 'cat-1',
      sku: 'NB-001',
      imageUrl: '',
      active: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const product = Product.restore(props, 'prod-123');

    expect(product.name).toBe('Notebook');
    expect(product.id).toBe('prod-123');
    expect(product.active).toBe(true);
    expect(product.createdAt).toEqual(new Date('2024-01-01'));
  });

  it('deve lançar erro ao criar produto com SKU vazio', () => {
    expect(() =>
      Product.create({
        name: 'Mouse',
        description: '',
        price: Money.fromBRL(50),
        stock: 5,
        categoryId: 'cat-1',
        sku: '',
      }),
    ).toThrow(AppError);
  });

  it('deve lançar erro ao criar produto com estoque negativo', () => {
    expect(() =>
      Product.create({
        name: 'Mouse',
        description: '',
        price: Money.fromBRL(50),
        stock: -1,
        categoryId: 'cat-1',
        sku: 'M-1',
      }),
    ).toThrow(AppError);
  });
});
