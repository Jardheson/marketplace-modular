import { describe, it, expect } from 'vitest';
import { Order } from '../../../src/modules/orders/domain/entities/Order';
import { OrderItem } from '../../../src/modules/orders/domain/entities/OrderItem';
import { OrderStatus } from '../../../src/modules/orders/domain/entities/OrderStatus';
import { Money } from '../../../src/shared/domain/Money';
import { AppError } from '../../../src/shared/domain/AppError';

describe('Order (domínio)', () => {
  it('deve criar um pedido com itens e calcular total', () => {
    const items = [
      OrderItem.create({
        productId: 'p1',
        productName: 'A',
        quantity: 2,
        unitPrice: Money.fromBRL(10),
      }),
      OrderItem.create({
        productId: 'p2',
        productName: 'B',
        quantity: 1,
        unitPrice: Money.fromBRL(20),
      }),
    ];

    const order = Order.create({ customerId: 'c1', items });
    expect(order.total.toBRL()).toBe(40);
    expect(order.items.length).toBe(2);
  });

  it('deve lançar erro sem itens', () => {
    expect(() => Order.create({ customerId: 'c1', items: [] })).toThrow(AppError);
  });

  it('deve transitar status válido', () => {
    const items = [
      OrderItem.create({
        productId: 'p1',
        productName: 'A',
        quantity: 1,
        unitPrice: Money.fromBRL(10),
      }),
    ];
    const order = Order.create({ customerId: 'c1', items });
    order.changeStatus(OrderStatus.CONFIRMED);
    expect(order.status).toBe(OrderStatus.CONFIRMED);
  });

  it('deve bloquear transição de status inválida', () => {
    const items = [
      OrderItem.create({
        productId: 'p1',
        productName: 'A',
        quantity: 1,
        unitPrice: Money.fromBRL(10),
      }),
    ];
    const order = Order.create({ customerId: 'c1', items });
    expect(() => order.changeStatus(OrderStatus.DELIVERED)).toThrow(AppError);
  });
});
