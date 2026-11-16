import { describe, it, expect } from 'vitest';
import {
  OrderStatus,
  ORDER_STATUS_FLOW,
} from '../../../src/modules/orders/domain/entities/OrderStatus';

describe('OrderStatus (enum)', () => {
  it('deve ter todos os valores do enum', () => {
    expect(OrderStatus.PENDING).toBe('PENDING');
    expect(OrderStatus.CONFIRMED).toBe('CONFIRMED');
    expect(OrderStatus.PAID).toBe('PAID');
    expect(OrderStatus.SHIPPED).toBe('SHIPPED');
    expect(OrderStatus.DELIVERED).toBe('DELIVERED');
    expect(OrderStatus.CANCELLED).toBe('CANCELLED');
  });
});

describe('ORDER_STATUS_FLOW', () => {
  it('deve permitir transição PENDING → CONFIRMED', () => {
    expect(ORDER_STATUS_FLOW[OrderStatus.PENDING]).toContain(OrderStatus.CONFIRMED);
  });

  it('deve permitir transição PENDING → CANCELLED', () => {
    expect(ORDER_STATUS_FLOW[OrderStatus.PENDING]).toContain(OrderStatus.CANCELLED);
  });

  it('não deve permitir transição PENDING → PAID (não está na lista)', () => {
    expect(ORDER_STATUS_FLOW[OrderStatus.PENDING]).not.toContain(OrderStatus.PAID);
  });

  it('deve permitir transição CONFIRMED → PAID', () => {
    expect(ORDER_STATUS_FLOW[OrderStatus.CONFIRMED]).toContain(OrderStatus.PAID);
  });

  it('deve permitir transição PAID → SHIPPED', () => {
    expect(ORDER_STATUS_FLOW[OrderStatus.PAID]).toContain(OrderStatus.SHIPPED);
  });

  it('deve permitir transição SHIPPED → DELIVERED', () => {
    expect(ORDER_STATUS_FLOW[OrderStatus.SHIPPED]).toContain(OrderStatus.DELIVERED);
  });

  it('DELIVERED não deve ter transições de saída', () => {
    expect(ORDER_STATUS_FLOW[OrderStatus.DELIVERED]).toEqual([]);
  });

  it('CANCELLED não deve ter transições de saída', () => {
    expect(ORDER_STATUS_FLOW[OrderStatus.CANCELLED]).toEqual([]);
  });
});
