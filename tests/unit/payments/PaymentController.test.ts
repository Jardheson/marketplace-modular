import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentController } from '../../../src/modules/payments/interface/http/PaymentController';
import { PaymentMethod } from '../../../src/modules/payments/domain/entities/PaymentStatus';
import { Request, Response } from 'express';
import type {
  ProcessPaymentInput,
  PaymentOutput,
} from '../../../src/modules/payments/application/dto/PaymentDto';

const mockPayment = {
  id: 'pay-1',
  orderId: 'order-1',
  amount: 100,
  currency: 'BRL',
  method: PaymentMethod.PIX,
  status: 'PAID',
  transactionId: 'PIX_abc123',
  paidAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function makeMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('PaymentController', () => {
  let enqueuePayment: (
    input: ProcessPaymentInput,
    idempotencyKey: string,
  ) => Promise<PaymentOutput>;
  let controller: PaymentController;

  beforeEach(() => {
    enqueuePayment = vi.fn().mockResolvedValue(mockPayment as unknown as PaymentOutput);
    controller = new PaymentController(enqueuePayment);
  });

  it('process deve retornar 201 com pagamento processado', async () => {
    const req = {
      body: { orderId: 'order-1', method: PaymentMethod.PIX },
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.process(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(enqueuePayment).toHaveBeenCalled();
  });

  it('process deve usar Idempotency-Key do header', async () => {
    const req = {
      body: { orderId: 'order-1', method: PaymentMethod.PIX },
      get: vi.fn().mockReturnValue('chave-unica-123'),
    } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.process(req, res, next);
    expect(enqueuePayment).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-1' }),
      expect.stringContaining('payment-'),
    );
  });

  it('process deve lançar erro para método inválido', async () => {
    const req = {
      body: { orderId: 'order-1', method: 'METODO_INVALIDO' },
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.process(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(enqueuePayment).not.toHaveBeenCalled();
  });
});
