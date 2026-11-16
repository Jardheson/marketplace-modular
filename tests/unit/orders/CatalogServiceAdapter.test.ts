import { describe, it, expect, vi } from 'vitest';
import { CatalogServiceAdapter } from '../../../src/modules/orders/infra/adapters/CatalogServiceAdapter';
import { Product } from '../../../src/modules/catalog/domain/entities/Product';
import { Money } from '../../../src/shared/domain/Money';
import { Category } from '../../../src/modules/catalog/domain/entities/Category';
import { AppError } from '../../../src/shared/domain/AppError';

const category = Category.create({ name: 'Cat', description: 'Desc' });

function makeProduct() {
  return Product.create({
    name: 'Produto',
    description: 'Desc',
    price: Money.fromBRL(100),
    stock: 10,
    categoryId: category.id,
    sku: 'SKU-1',
  });
}

describe('CatalogServiceAdapter', () => {
  it('getProductInfo deve retornar info do produto quando existe', async () => {
    const product = makeProduct();
    const productRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(product),
      findBySku: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const adapter = new CatalogServiceAdapter(productRepo);
    const result = await adapter.getProductInfo('prod-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe(product.id);
    expect(result?.name).toBe('Produto');
    expect(result?.stock).toBe(10);
  });

  it('getProductInfo deve retornar null quando produto não existe', async () => {
    const productRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findBySku: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const adapter = new CatalogServiceAdapter(productRepo);
    const result = await adapter.getProductInfo('inexistente');
    expect(result).toBeNull();
  });

  it('reserveStock deve decrementar estoque do produto', async () => {
    const product = makeProduct();
    const stockAntes = product.stock;
    const productRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(product),
      findBySku: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockResolvedValue(product),
      delete: vi.fn(),
    };

    const adapter = new CatalogServiceAdapter(productRepo);
    await adapter.reserveStock(product.id, 3);

    expect(product.stock).toBe(stockAntes - 3);
    expect(productRepo.save).toHaveBeenCalledWith(product);
  });

  it('reserveStock deve lançar erro quando produto não existe', async () => {
    const productRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findBySku: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const adapter = new CatalogServiceAdapter(productRepo);
    await expect(adapter.reserveStock('inexistente', 1)).rejects.toThrow(AppError);
  });
});
