import { describe, it, expect, vi } from 'vitest';
import { CreateProductUseCase } from '../../../src/modules/catalog/application/use-cases/CreateProductUseCase';
import { Category } from '../../../src/modules/catalog/domain/entities/Category';
import { AppError } from '../../../src/shared/domain/AppError';

const category = Category.create({ name: 'Cat', description: 'Desc' });

function makeCache() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    delByPattern: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CreateProductUseCase', () => {
  it('deve criar produto com dados válidos', async () => {
    const productRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn().mockResolvedValue(null),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((p) => p),
      delete: vi.fn(),
    };
    const categoryRepo = {
      findById: vi.fn().mockResolvedValue(category),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new CreateProductUseCase(productRepo, categoryRepo, cache);
    const result = await useCase.execute({
      name: 'Novo Produto',
      description: 'Descrição',
      price: 99.9,
      stock: 10,
      categoryId: category.id,
      sku: 'SKU-NOVO',
    });

    expect(result.name).toBe('Novo Produto');
    expect(result.sku).toBe('SKU-NOVO');
    expect(result.price).toBe(99.9);
    expect(productRepo.save).toHaveBeenCalled();
    expect(cache.delByPattern).toHaveBeenCalledWith('products:*');
  });

  it('deve lançar erro se SKU já existir', async () => {
    const productRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn().mockResolvedValue({ id: '1', sku: 'SKU-EXISTE' }),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const categoryRepo = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), delete: vi.fn() };
    const cache = makeCache();

    const useCase = new CreateProductUseCase(productRepo, categoryRepo, cache);
    await expect(
      useCase.execute({
        name: 'Produto',
        description: 'Desc',
        price: 10,
        stock: 1,
        categoryId: category.id,
        sku: 'SKU-EXISTE',
      }),
    ).rejects.toThrow(AppError);
  });

  it('deve lançar erro se categoria não existir', async () => {
    const productRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn().mockResolvedValue(null),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const categoryRepo = {
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new CreateProductUseCase(productRepo, categoryRepo, cache);
    await expect(
      useCase.execute({
        name: 'Produto',
        description: 'Desc',
        price: 10,
        stock: 1,
        categoryId: 'cat-inexistente',
        sku: 'SKU-1',
      }),
    ).rejects.toThrow(AppError);
  });
});
