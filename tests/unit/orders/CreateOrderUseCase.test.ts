import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AppError } from '../../../src/shared/domain/AppError';
import { Money } from '../../../src/shared/domain/Money';
import { ICache } from '../../../src/infra/cache/RedisCache';
import {
  ICatalogService,
  ProductInfo,
} from '../../../src/modules/orders/application/ports/ICatalogService';
import { CreateOrderUseCase } from '../../../src/modules/orders/application/use-cases/CreateOrderUseCase';
import { IOrderRepository } from '../../../src/modules/orders/domain/repositories/IOrderRepository';
import { OrderStatus } from '../../../src/modules/orders/domain/entities/OrderStatus';

const product: ProductInfo = {
  id: 'product-1',
  name: 'Teclado',
  price: Money.fromBRL(100),
  stock: 10,
  active: true,
};

const inactiveProduct: ProductInfo = {
  id: 'product-inactive',
  name: 'Produto Inativo',
  price: Money.fromBRL(50),
  stock: 5,
  active: false,
};

function makeCache() {
  return {
    delByPattern: vi.fn().mockResolvedValue(undefined),
  } as unknown as ICache;
}

describe('CreateOrderUseCase com novo checkout (prevalidateCheckout=true)', () => {
  let catalog: ICatalogService;
  let orderRepo: IOrderRepository;
  let cache: ICache;

  beforeEach(() => {
    catalog = {
      getProductInfo: vi.fn().mockResolvedValue(product),
      reserveStock: vi.fn().mockResolvedValue(undefined),
    };
    orderRepo = { save: vi.fn(async (order) => order) } as unknown as IOrderRepository;
    cache = makeCache();
  });

  it('busca produtos antes de criar itens na pré-validação', async () => {
    const useCase = new CreateOrderUseCase(orderRepo, catalog, cache, true);

    await useCase.execute({
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 2 }],
    });

    expect(catalog.getProductInfo).toHaveBeenCalledTimes(1);
    expect(catalog.getProductInfo).toHaveBeenCalledWith('product-1');
  });

  it('erro quando produto está inativo na pré-validação', async () => {
    catalog.getProductInfo = vi.fn().mockResolvedValue(inactiveProduct);
    const useCase = new CreateOrderUseCase(orderRepo, catalog, cache, true);

    await expect(
      useCase.execute({
        customerId: 'customer-1',
        items: [{ productId: 'product-inactive', quantity: 1 }],
      }),
    ).rejects.toThrow(AppError);

    expect(catalog.reserveStock).not.toHaveBeenCalled();
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('erro quando produto não existe na pré-validação', async () => {
    catalog.getProductInfo = vi.fn().mockResolvedValue(null);
    const useCase = new CreateOrderUseCase(orderRepo, catalog, cache, true);

    await expect(
      useCase.execute({
        customerId: 'customer-1',
        items: [{ productId: 'missing-product', quantity: 1 }],
      }),
    ).rejects.toThrow(AppError);

    expect(catalog.reserveStock).not.toHaveBeenCalled();
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('valida todos os produtos antes de reservar estoque', async () => {
    catalog.getProductInfo = vi.fn().mockResolvedValueOnce(product).mockResolvedValueOnce(null);
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

describe('CreateOrderUseCase erros e efeitos colaterais', () => {
  it('erro quando reserva de estoque falha (estoque insuficiente)', async () => {
    const catalog: ICatalogService = {
      getProductInfo: vi.fn().mockResolvedValue(product),
      reserveStock: vi.fn().mockRejectedValue(AppError.business('Estoque insuficiente.')),
    };
    const orderRepo = { save: vi.fn() } as unknown as IOrderRepository;
    const cache = makeCache();
    const useCase = new CreateOrderUseCase(orderRepo, catalog, cache, false);

    await expect(
      useCase.execute({
        customerId: 'customer-1',
        items: [{ productId: 'product-1', quantity: 999 }],
      }),
    ).rejects.toThrow(AppError);

    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('cache.delByPattern("orders:*") é chamado após salvar', async () => {
    const catalog: ICatalogService = {
      getProductInfo: vi.fn().mockResolvedValue(product),
      reserveStock: vi.fn().mockResolvedValue(undefined),
    };
    const orderRepo = { save: vi.fn(async (order) => order) } as unknown as IOrderRepository;
    const cache = makeCache();
    const useCase = new CreateOrderUseCase(orderRepo, catalog, cache, false);

    await useCase.execute({
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 1 }],
    });

    expect(cache.delByPattern).toHaveBeenCalledWith('orders:*');
    expect(orderRepo.save).toHaveBeenCalled();
  });

  it('toOutput retorna estrutura correta com todos os campos', async () => {
    const catalog: ICatalogService = {
      getProductInfo: vi.fn().mockResolvedValue(product),
      reserveStock: vi.fn().mockResolvedValue(undefined),
    };
    const orderRepo = { save: vi.fn(async (order) => order) } as unknown as IOrderRepository;
    const cache = makeCache();
    const useCase = new CreateOrderUseCase(orderRepo, catalog, cache, false);

    const result = await useCase.execute({
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 2 }],
    });

    expect(result).toMatchObject({
      customerId: 'customer-1',
      status: OrderStatus.PENDING,
      total: 200,
      currency: 'BRL',
    });
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      productId: 'product-1',
      productName: 'Teclado',
      quantity: 2,
      unitPrice: 100,
      subtotal: 200,
    });
  });
});
