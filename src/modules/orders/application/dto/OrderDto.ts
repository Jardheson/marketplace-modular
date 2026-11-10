import { OrderStatus } from '../../domain/entities/OrderStatus';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerId: string;
  items: CreateOrderItemInput[];
}

export interface OrderItemOutput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderOutput {
  id: string;
  customerId: string;
  items: OrderItemOutput[];
  status: OrderStatus;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListOrdersInput {
  page: number;
  pageSize: number;
  customerId?: string;
  status?: OrderStatus;
}
