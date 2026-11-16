import { describe, it, expect, vi } from 'vitest';
import { ListProductsUseCase } from '../../../src/modules/catalog/application/use-cases/ListProductsUseCase';
import { Product } from '../../../src/modules/catalog/domain/entities/Product';
import { Money } from '../../../src/shared/domain/Money';
import { Category } from '../../../src/modules/catalog/domain/entities/Category';

const category = Category.create({ name: 'Eletrônicos', description: 'Tech' });

function makeProduct(overrides: Partial<Product> = {}): Product {
  return Product.create({
    name: 'Produto Teste',
    description: 'Descrição',
    price: Money.fromBRL(99.9),
    stock: 10,
    categoryId: category.id,
    sku: 'SKU-TEST',
    ...overrides,
  });
}

function makeCache() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    delByPattern: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ListProductsUseCase', () => {
  it('deve retornar produtos do cache se existirem', async () => {
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
    const cachedResult = { data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    cache.get.mockResolvedValue(cachedResult);

    const useCase = new ListProductsUseCase(productRepo, cache);
    const result = await useCase.execute({ page: 1, pageSize: 20 });

    expect(result).toEqual(cachedResult);
    expect(productRepo.findPaginated).not.toHaveBeenCalled();
    expect(cache.get).toHaveBeenCalled();
  });

  it('deve buscar no repositório e salvar no cache quando cache miss', async () => {
    const product = makeProduct();
    const productRepo = {
      findPaginated: vi.fn().mockResolvedValue({
        data: [product],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new ListProductsUseCase(productRepo, cache);
    const result = await useCase.execute({ page: 1, pageSize: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(productRepo.findPaginated).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalled();
  });

  it('deve aplicar filtros de categoria, active e search', async () => {
    const productRepo = {
      findPaginated: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new ListProductsUseCase(productRepo, cache);
    await useCase.execute({
      page: 1,
      pageSize: 20,
      categoryId: category.id,
      active: true,
      search: 'teste',
    });

    expect(productRepo.findPaginated).toHaveBeenCalledWith(
      { page: 1, pageSize: 20 },
      { categoryId: category.id, active: true, search: 'teste' },
    );
  });
});
