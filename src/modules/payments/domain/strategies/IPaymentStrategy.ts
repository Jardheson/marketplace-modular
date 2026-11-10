import { Payment } from '../entities/Payment';

/**
 * Strategy Pattern (M1): define o contrato para os métodos de pagamento.
 * Cada método (PIX, Cartão de Crédito, Boleto) implementa seu fluxo próprio.
 */
export interface IPaymentStrategy {
  method: string;
  process(payment: Payment): Promise<{ transactionId: string; success: boolean }>;
}
