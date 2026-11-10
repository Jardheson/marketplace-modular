import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../src/shared/domain/AppError';
import { Money } from '../../../src/shared/domain/Money';
import { ICache } from '../../../src/infra/cache/RedisCache';
import {
  ICatalogService,
  ProductInfo,
} from '../../../src/modules/orders/application/ports/ICatalogService';
import { CreateOrderUseCase } from '../../../src/modules/orders/application/use-cases/CreateOrderUseCase';
import { IOrderRepository } from '../../../src/modules/orders/domain/repositories/IOrderRepository';

const product: ProductInfo = {
  id: 'product-1',
  name: 'Teclado',
  price: Money.fromBRL(100),
  stock: 10,
  active: true,
};

const cache = {
  delByPattern: vi.fn().mockResolvedValue(undefined),
} as unknown as ICache;

describe('CreateOrderUseCase com novo checkout', () => {
  it('valida todos os produtos antes de reservar estoque', async () => {
    const catalog: ICatalogService = {
      getProductInfo: vi.fn().mockResolvedValueOnce(product).mockResolvedValueOnce(null),
      reserveStock: vi.fn(),
    };
    const orderRepo = { save: vi.fn() } as unknown as IOrderRepository;
    const useCase = new CreateOrderUseCase(orderRepo, catalog, cache, true);

    await expect(
      useCase.execute({
        customerId: 'customer-1',
        items: [
          { productId: 'product-1', quantity: 1 },
          { productId: 'missing-product', quantity: 1 },
        ],
      }),
    ).rejects.toThrow(AppError);

    expect(catalog.reserveStock).not.toHaveBeenCalled();
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('usa os produtos pré-validados para criar e reservar o pedido', async () => {
    const catalog: ICatalogService = {
      getProductInfo: vi.fn().mockResolvedValue(product),
      reserveStock: vi.fn().mockResolvedValue(undefined),
    };
    const orderRepo = { save: vi.fn(async (order) => order) } as unknown as IOrderRepository;
    const useCase = new CreateOrderUseCase(orderRepo, catalog, cache, true);

    const result = await useCase.execute({
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 2 }],
    });

    expect(result.total).toBe(200);
    expect(catalog.getProductInfo).toHaveBeenCalledTimes(1);
    expect(catalog.reserveStock).toHaveBeenCalledWith('product-1', 2);
    expect(orderRepo.save).toHaveBeenCalledOnce();
  });
});
