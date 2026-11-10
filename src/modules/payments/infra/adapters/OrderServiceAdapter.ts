import { IOrderService } from '../../application/ports/IOrderService';
import { IOrderRepository } from '../../../orders/domain/repositories/IOrderRepository';
import { OrderStatus } from '../../../orders/domain/entities/OrderStatus';
import { AppError } from '../../../../shared/domain/AppError';

export class OrderServiceAdapter implements IOrderService {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async getOrderTotal(orderId: string): Promise<number> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return 0;
    return order.total.amount;
  }

  async confirmOrder(orderId: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw AppError.notFound(`Pedido ${orderId}`);
    order.changeStatus(OrderStatus.CONFIRMED);
    order.changeStatus(OrderStatus.PAID);
    await this.orderRepo.save(order);
  }
}
