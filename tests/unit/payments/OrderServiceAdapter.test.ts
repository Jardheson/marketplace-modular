import { describe, it, expect, vi } from 'vitest';
import { OrderServiceAdapter } from '../../../src/modules/payments/infra/adapters/OrderServiceAdapter';
import { Order } from '../../../src/modules/orders/domain/entities/Order';
import { OrderItem } from '../../../src/modules/orders/domain/entities/OrderItem';
import { Money } from '../../../src/shared/domain/Money';
import { OrderStatus } from '../../../src/modules/orders/domain/entities/OrderStatus';
import { AppError } from '../../../src/shared/domain/AppError';

function makeOrder() {
  const item = OrderItem.create({
    productId: 'prod-1',
    productName: 'Produto',
    quantity: 2,
    unitPrice: Money.fromBRL(50),
  });
  return Order.create({ customerId: 'cust-1', items: [item] });
}

function makeOrderWithStatus(status: OrderStatus) {
  const item = OrderItem.create({
    productId: 'prod-1',
    productName: 'Produto',
    quantity: 2,
    unitPrice: Money.fromBRL(50),
  });
  const order = Order.create({ customerId: 'cust-1', items: [item] });

  if (status === OrderStatus.CANCELLED) {
    order.changeStatus(OrderStatus.CANCELLED);
    return order;
  }

  if (status === OrderStatus.PENDING) return order;

  order.changeStatus(OrderStatus.CONFIRMED);
  if (status === OrderStatus.CONFIRMED) return order;

  order.changeStatus(OrderStatus.PAID);
  if (status === OrderStatus.PAID) return order;

  order.changeStatus(OrderStatus.SHIPPED);
  if (status === OrderStatus.SHIPPED) return order;

  if (status === OrderStatus.DELIVERED) {
    order.changeStatus(OrderStatus.DELIVERED);
  }

  return order;
}

describe('OrderServiceAdapter', () => {
  it('getOrderTotal deve retornar o valor total em centavos', async () => {
    const order = makeOrder();
    const orderRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(order),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const adapter = new OrderServiceAdapter(orderRepo);
    const total = await adapter.getOrderTotal(order.id);

    expect(total).toBe(order.total.amount);
    expect(total).toBe(10000);
  });

  it('getOrderTotal deve retornar 0 quando pedido não existe', async () => {
    const orderRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const adapter = new OrderServiceAdapter(orderRepo);
    const total = await adapter.getOrderTotal('inexistente');
    expect(total).toBe(0);
  });

  it('confirmOrder deve mudar status para CONFIRMED e PAID', async () => {
    const order = makeOrder();
    const orderRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(order),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockResolvedValue(order),
      delete: vi.fn(),
    };

    const adapter = new OrderServiceAdapter(orderRepo);
    await adapter.confirmOrder(order.id);

    expect(order.status).toBe(OrderStatus.PAID);
    expect(orderRepo.save).toHaveBeenCalledWith(order);
  });

  it('confirmOrder com pedido inexistente lança erro notFound', async () => {
    const orderRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const adapter = new OrderServiceAdapter(orderRepo);
    await expect(adapter.confirmOrder('inexistente')).rejects.toThrow(AppError);
  });

  it('confirmOrder com pedido em status que não permite transição lança erro', async () => {
    const order = makeOrderWithStatus(OrderStatus.DELIVERED);
    const orderRepo = {
      findPaginated: vi.fn(),
      findById: vi.fn().mockResolvedValue(order),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const adapter = new OrderServiceAdapter(orderRepo);
    await expect(adapter.confirmOrder(order.id)).rejects.toThrow(AppError);
    expect(orderRepo.save).not.toHaveBeenCalled();
  });
});
