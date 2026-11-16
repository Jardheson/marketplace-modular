import { describe, it, expect, vi } from 'vitest';
import { ListOrdersUseCase } from '../../../src/modules/orders/application/use-cases/ListOrdersUseCase';
import { Order } from '../../../src/modules/orders/domain/entities/Order';
import { OrderItem } from '../../../src/modules/orders/domain/entities/OrderItem';
import { Money } from '../../../src/shared/domain/Money';
import { OrderStatus } from '../../../src/modules/orders/domain/entities/OrderStatus';

const orderItem = OrderItem.create({
  productId: 'prod-1',
  productName: 'Produto',
  quantity: 1,
  unitPrice: Money.fromBRL(100),
});

const order = Order.create({
  customerId: 'cust-1',
  items: [orderItem],
});

function makeCache() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    delByPattern: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ListOrdersUseCase', () => {
  it('deve retornar lista do cache quando disponível', async () => {
    const orderRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn(),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();
    const cached = { data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    cache.get.mockResolvedValue(cached);

    const useCase = new ListOrdersUseCase(orderRepo, cache);
    const result = await useCase.execute({ page: 1, pageSize: 20 });

    expect(result).toEqual(cached);
    expect(orderRepo.findPaginated).not.toHaveBeenCalled();
  });

  it('deve buscar no repositório e salvar no cache', async () => {
    const orderRepo = {
      findPaginated: vi.fn().mockResolvedValue({
        data: [order],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
      findById: vi.fn(),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new ListOrdersUseCase(orderRepo, cache);
    const result = await useCase.execute({ page: 1, pageSize: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(cache.set).toHaveBeenCalled();
  });

  it('deve aplicar filtros de customerId e status', async () => {
    const orderRepo = {
      findPaginated: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
      findById: vi.fn(),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new ListOrdersUseCase(orderRepo, cache);
    await useCase.execute({
      page: 1,
      pageSize: 20,
      customerId: 'cust-1',
      status: OrderStatus.PENDING,
    });

    expect(orderRepo.findPaginated).toHaveBeenCalledWith(
      { page: 1, pageSize: 20 },
      { customerId: 'cust-1', status: OrderStatus.PENDING },
    );
  });
});
