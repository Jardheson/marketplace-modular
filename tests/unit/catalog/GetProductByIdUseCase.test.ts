import { describe, it, expect, vi } from 'vitest';
import { GetProductByIdUseCase } from '../../../src/modules/catalog/application/use-cases/GetProductByIdUseCase';
import { Product } from '../../../src/modules/catalog/domain/entities/Product';
import { Money } from '../../../src/shared/domain/Money';
import { Category } from '../../../src/modules/catalog/domain/entities/Category';
import { AppError } from '../../../src/shared/domain/AppError';

const category = Category.create({ name: 'Cat', description: 'Desc' });
const product = Product.create({
  name: 'Produto',
  description: 'Desc',
  price: Money.fromBRL(50),
  stock: 5,
  categoryId: category.id,
  sku: 'SKU-1',
});

function makeCache() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    delByPattern: vi.fn().mockResolvedValue(undefined),
  };
}

describe('GetProductByIdUseCase', () => {
  it('deve retornar do cache quando disponível', async () => {
    const productRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();
    const cached = { id: product.id, name: 'Produto' };
    cache.get.mockResolvedValue(cached);

    const useCase = new GetProductByIdUseCase(productRepo, cache);
    const result = await useCase.execute(product.id);

    expect(result).toEqual(cached);
    expect(productRepo.findById).not.toHaveBeenCalled();
  });

  it('deve buscar no repositório e salvar no cache', async () => {
    const productRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(product),
      findBySku: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new GetProductByIdUseCase(productRepo, cache);
    const result = await useCase.execute(product.id);

    expect(result.id).toBe(product.id);
    expect(result.sku).toBe('SKU-1');
    expect(cache.set).toHaveBeenCalled();
  });

  it('deve lançar erro quando produto não existe', async () => {
    const productRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findBySku: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new GetProductByIdUseCase(productRepo, cache);
    await expect(useCase.execute('id-inexistente')).rejects.toThrow(AppError);
  });
});
