import { Repository } from '../../../../shared/domain/Repository';
import { Order } from '../entities/Order';
import { OrderStatus } from '../entities/OrderStatus';
import { Paginated, PaginationParams } from '../../../../shared/application/Pagination';

export interface OrderFilters {
  customerId?: string;
  status?: OrderStatus;
}

export interface IOrderRepository extends Repository<Order> {
  findByCustomerId(customerId: string): Promise<Order[]>;
  findPaginated(params: PaginationParams, filters?: OrderFilters): Promise<Paginated<Order>>;
}
