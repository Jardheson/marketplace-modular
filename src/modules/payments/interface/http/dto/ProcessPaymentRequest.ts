import { IsEnum, IsUUID } from 'class-validator';
import { PaymentMethod } from '../../../domain/entities/PaymentStatus';

export class ProcessPaymentRequest {
  @IsUUID()
  orderId!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}
