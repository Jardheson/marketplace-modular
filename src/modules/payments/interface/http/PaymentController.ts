import { createHash } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { PaymentMethod } from '../../domain/entities/PaymentStatus';
import { AppError } from '../../../../shared/domain/AppError';
import { PaymentOutput, ProcessPaymentInput } from '../../application/dto/PaymentDto';

export class PaymentController {
  constructor(
    private readonly enqueuePayment: (
      input: ProcessPaymentInput,
      idempotencyKey: string,
    ) => Promise<PaymentOutput>,
  ) {}

  async process(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const method = req.body.method as PaymentMethod;
      if (!Object.values(PaymentMethod).includes(method)) {
        throw AppError.validation('Método de pagamento inválido.');
      }
      const input = {
        orderId: req.body.orderId,
        method,
      };
      const clientKey = req.get('Idempotency-Key')?.trim() ?? '';
      const idempotencyKey = `payment-${createHash('sha256')
        .update(`${input.orderId}|${method}|${clientKey}`)
        .digest('hex')}`;
      const result = await this.enqueuePayment(input, idempotencyKey);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
