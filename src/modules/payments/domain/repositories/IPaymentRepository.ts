import { Repository } from '../../../../shared/domain/Repository';
import { Payment } from '../entities/Payment';

export interface IPaymentRepository extends Repository<Payment> {
  findByOrderId(orderId: string): Promise<Payment | null>;
}
