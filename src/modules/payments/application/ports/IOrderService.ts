export interface IOrderService {
  confirmOrder(orderId: string): Promise<void>;
  getOrderTotal(orderId: string): Promise<number>; // centavos
}
