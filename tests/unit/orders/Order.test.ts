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

  it('deve restaurar um pedido via restore() com props e id', () => {
    const items = [
      OrderItem.create({
        productId: 'p1',
        productName: 'A',
        quantity: 1,
        unitPrice: Money.fromBRL(10),
      }),
    ];
    const createdAt = new Date('2024-01-01T00:00:00Z');
    const updatedAt = new Date('2024-01-02T00:00:00Z');

    const order = Order.restore(
      {
        customerId: 'c1',
        items,
        status: OrderStatus.CONFIRMED,
        total: Money.fromBRL(10),
        createdAt,
        updatedAt,
      },
      'order-id-123',
    );

    expect(order.id).toBe('order-id-123');
    expect(order.customerId).toBe('c1');
    expect(order.status).toBe(OrderStatus.CONFIRMED);
    expect(order.total.toBRL()).toBe(10);
    expect(order.createdAt).toBe(createdAt);
    expect(order.updatedAt).toBe(updatedAt);
  });

  it('canBePaid() retorna true quando status é CONFIRMED', () => {
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
    expect(order.canBePaid()).toBe(true);
  });

  it('canBePaid() retorna false quando status é PENDING', () => {
    const items = [
      OrderItem.create({
        productId: 'p1',
        productName: 'A',
        quantity: 1,
        unitPrice: Money.fromBRL(10),
      }),
    ];
    const order = Order.create({ customerId: 'c1', items });
    expect(order.canBePaid()).toBe(false);
  });

  it('deve expor getters para createdAt, updatedAt, customerId, items, total e status', () => {
    const items = [
      OrderItem.create({
        productId: 'p1',
        productName: 'A',
        quantity: 2,
        unitPrice: Money.fromBRL(10),
      }),
    ];
    const order = Order.create({ customerId: 'c1', items });

    expect(order.customerId).toBe('c1');
    expect(order.items).toHaveLength(1);
    expect(order.total.toBRL()).toBe(20);
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.updatedAt).toBeInstanceOf(Date);
  });

  it('deve retornar itens como cópia para preservar imutabilidade', () => {
    const items = [
      OrderItem.create({
        productId: 'p1',
        productName: 'A',
        quantity: 1,
        unitPrice: Money.fromBRL(10),
      }),
    ];
    const order = Order.create({ customerId: 'c1', items });

    const itemsRef1 = order.items;
    const itemsRef2 = order.items;

    expect(itemsRef1).not.toBe(itemsRef2);
    expect(itemsRef1).toEqual(itemsRef2);

    itemsRef1.pop();
    expect(order.items).toHaveLength(1);
  });
});
