import { describe, it, expect, vi } from 'vitest';
import { GetOrderByIdUseCase } from '../../../src/modules/orders/application/use-cases/GetOrderByIdUseCase';
import { Order } from '../../../src/modules/orders/domain/entities/Order';
import { OrderItem } from '../../../src/modules/orders/domain/entities/OrderItem';
import { Money } from '../../../src/shared/domain/Money';
import { AppError } from '../../../src/shared/domain/AppError';

const orderItem = OrderItem.create({
  productId: 'prod-1',
  productName: 'Produto',
  quantity: 2,
  unitPrice: Money.fromBRL(50),
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

describe('GetOrderByIdUseCase', () => {
  it('deve retornar pedido do cache quando disponível', async () => {
    const orderRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn(),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();
    const cached = { id: order.id, status: 'PENDING' };
    cache.get.mockResolvedValue(cached);

    const useCase = new GetOrderByIdUseCase(orderRepo, cache);
    const result = await useCase.execute(order.id);

    expect(result).toEqual(cached);
    expect(orderRepo.findById).not.toHaveBeenCalled();
  });

  it('deve buscar pedido no repositório e salvar no cache', async () => {
    const orderRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(order),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new GetOrderByIdUseCase(orderRepo, cache);
    const result = await useCase.execute(order.id);

    expect(result.id).toBe(order.id);
    expect(result.status).toBe('PENDING');
    expect(result.items).toHaveLength(1);
    expect(cache.set).toHaveBeenCalled();
  });

  it('deve lançar erro quando pedido não existe', async () => {
    const orderRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new GetOrderByIdUseCase(orderRepo, cache);
    await expect(useCase.execute('id-inexistente')).rejects.toThrow(AppError);
  });
});
