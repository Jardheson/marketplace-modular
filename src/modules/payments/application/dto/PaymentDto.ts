import { PaymentMethod, PaymentStatus } from '../../domain/entities/PaymentStatus';

export interface ProcessPaymentInput {
  orderId: string;
  method: PaymentMethod;
}

export interface PaymentOutput {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
