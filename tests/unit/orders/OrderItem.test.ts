import { describe, it, expect } from 'vitest';
import { OrderItem } from '../../../src/modules/orders/domain/entities/OrderItem';
import { Money } from '../../../src/shared/domain/Money';
import { AppError } from '../../../src/shared/domain/AppError';

describe('OrderItem (domínio)', () => {
  it('deve criar um item de pedido válido com todos os campos', () => {
    const unitPrice = Money.BRL(1000);
    const item = OrderItem.create({
      productId: 'prod-123',
      productName: 'Cadeira Gamer',
      quantity: 2,
      unitPrice,
    });

    expect(item).toBeInstanceOf(OrderItem);
    expect(item.productId).toBe('prod-123');
    expect(item.productName).toBe('Cadeira Gamer');
    expect(item.quantity).toBe(2);
    expect(item.unitPrice).toBe(unitPrice);
  });

  it('deve lançar erro quando quantidade é 0', () => {
    expect(() =>
      OrderItem.create({
        productId: 'p1',
        productName: 'A',
        quantity: 0,
        unitPrice: Money.BRL(500),
      }),
    ).toThrow(AppError);
  });

  it('deve lançar erro quando quantidade é negativa', () => {
    expect(() =>
      OrderItem.create({
        productId: 'p1',
        productName: 'A',
        quantity: -3,
        unitPrice: Money.BRL(500),
      }),
    ).toThrow(AppError);
  });

  it('deve calcular o subtotal corretamente (quantity * unitPrice)', () => {
    const item = OrderItem.create({
      productId: 'p1',
      productName: 'A',
      quantity: 3,
      unitPrice: Money.BRL(1500),
    });

    expect(item.subtotal.amount).toBe(4500);
    expect(item.subtotal.toBRL()).toBe(45);
  });

  it('deve expor getters para productId, productName, quantity e unitPrice', () => {
    const unitPrice = Money.BRL(2000);
    const item = OrderItem.create({
      productId: 'p-xyz',
      productName: 'Mouse',
      quantity: 5,
      unitPrice,
    });

    expect(item.productId).toBe('p-xyz');
    expect(item.productName).toBe('Mouse');
    expect(item.quantity).toBe(5);
    expect(item.unitPrice).toBe(unitPrice);
  });
});
