import { describe, it, expect } from 'vitest';
import { ProductMapper } from '../../../src/modules/catalog/infra/persistence/typeorm/mappers/ProductMapper';
import { Product } from '../../../src/modules/catalog/domain/entities/Product';
import { Money } from '../../../src/shared/domain/Money';
import { ProductEntity } from '../../../src/modules/catalog/infra/persistence/typeorm/entities/Product.entity';

describe('ProductMapper', () => {
  const entity: ProductEntity = {
    id: 'prod-1',
    name: 'Produto',
    description: 'Desc',
    priceCents: 9990,
    currency: 'BRL',
    stock: 10,
    categoryId: 'cat-1',
    sku: 'SKU-1',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  } as ProductEntity;

  it('toDomain deve converter entity para Product', () => {
    const product = ProductMapper.toDomain(entity);

    expect(product).toBeInstanceOf(Product);
    expect(product.id).toBe('prod-1');
    expect(product.name).toBe('Produto');
    expect(product.price.amount).toBe(9990);
    expect(product.price.currency).toBe('BRL');
    expect(product.stock).toBe(10);
    expect(product.sku).toBe('SKU-1');
    expect(product.active).toBe(true);
  });

  it('toEntity deve converter Product para entity', () => {
    const product = Product.create({
      name: 'Produto Novo',
      description: 'Desc nova',
      price: Money.fromBRL(49.9),
      stock: 5,
      categoryId: 'cat-2',
      sku: 'SKU-NOVO',
    });

    const result = ProductMapper.toEntity(product);

    expect(result.id).toBe(product.id);
    expect(result.name).toBe('Produto Novo');
    expect(result.priceCents).toBe(4990);
    expect(result.currency).toBe('BRL');
    expect(result.stock).toBe(5);
    expect(result.sku).toBe('SKU-NOVO');
    expect(result.categoryId).toBe('cat-2');
  });

  it('conversão bidirecional deve preservar dados', () => {
    const product = ProductMapper.toDomain(entity);
    const resultEntity = ProductMapper.toEntity(product);

    expect(resultEntity.id).toBe(entity.id);
    expect(resultEntity.name).toBe(entity.name);
    expect(resultEntity.priceCents).toBe(entity.priceCents);
    expect(resultEntity.sku).toBe(entity.sku);
  });
});
