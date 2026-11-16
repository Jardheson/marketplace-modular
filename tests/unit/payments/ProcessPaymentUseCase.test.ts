import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessPaymentUseCase } from '../../../src/modules/payments/application/use-cases/ProcessPaymentUseCase';
import { PaymentStrategyResolver } from '../../../src/modules/payments/application/services/PaymentStrategyResolver';
import { PixStrategy } from '../../../src/modules/payments/domain/strategies/PixStrategy';
import { PaymentMethod } from '../../../src/modules/payments/domain/entities/PaymentStatus';
import { AppError } from '../../../src/shared/domain/AppError';
import { paymentsProcessedTotal } from '../../../src/infra/observability/metrics';

vi.mock('../../../src/infra/observability/metrics', () => ({
  paymentsProcessedTotal: { inc: vi.fn() },
}));

function makeCache() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    delByPattern: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ProcessPaymentUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve processar pagamento com sucesso via PIX', async () => {
    const paymentRepo = {
      findByOrderId: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((p) => p),
      delete: vi.fn(),
    };
    const strategyResolver = new PaymentStrategyResolver([new PixStrategy()]);
    const orderService = {
      getOrderTotal: vi.fn().mockResolvedValue(10000),
      confirmOrder: vi.fn().mockResolvedValue(undefined),
    };
    const cache = makeCache();

    const useCase = new ProcessPaymentUseCase(paymentRepo, strategyResolver, orderService, cache);
    const result = await useCase.execute({
      orderId: 'order-1',
      method: PaymentMethod.PIX,
    });

    expect(result.status).toBe('PAID');
    expect(result.method).toBe(PaymentMethod.PIX);
    expect(result.transactionId).toMatch(/^PIX_/);
    expect(orderService.confirmOrder).toHaveBeenCalledWith('order-1');
    expect(cache.delByPattern).toHaveBeenCalledWith('orders:*');
  });

  it('pagamento com status FAILED existente permite novo pagamento', async () => {
    const paymentRepo = {
      findByOrderId: vi.fn().mockResolvedValue({ id: 'pay-failed', status: 'FAILED' }),
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((p) => p),
      delete: vi.fn(),
    };
    const strategyResolver = new PaymentStrategyResolver([new PixStrategy()]);
    const orderService = {
      getOrderTotal: vi.fn().mockResolvedValue(10000),
      confirmOrder: vi.fn().mockResolvedValue(undefined),
    };
    const cache = makeCache();

    const useCase = new ProcessPaymentUseCase(paymentRepo, strategyResolver, orderService, cache);
    const result = await useCase.execute({
      orderId: 'order-1',
      method: PaymentMethod.PIX,
    });

    expect(result.status).toBe('PAID');
    expect(paymentRepo.save).toHaveBeenCalled();
    expect(orderService.confirmOrder).toHaveBeenCalledWith('order-1');
  });

  it('deve lançar erro se já existir pagamento não-falho para o pedido', async () => {
    const paymentRepo = {
      findByOrderId: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'PAID' }),
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const strategyResolver = new PaymentStrategyResolver([]);
    const orderService = { getOrderTotal: vi.fn(), confirmOrder: vi.fn() };
    const cache = makeCache();

    const useCase = new ProcessPaymentUseCase(paymentRepo, strategyResolver, orderService, cache);
    await expect(
      useCase.execute({ orderId: 'order-1', method: PaymentMethod.PIX }),
    ).rejects.toThrow(AppError);
  });

  it('deve lançar erro se pedido não for encontrado', async () => {
    const paymentRepo = {
      findByOrderId: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const strategyResolver = new PaymentStrategyResolver([]);
    const orderService = {
      getOrderTotal: vi.fn().mockResolvedValue(null),
      confirmOrder: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new ProcessPaymentUseCase(paymentRepo, strategyResolver, orderService, cache);
    await expect(
      useCase.execute({ orderId: 'order-inexistente', method: PaymentMethod.PIX }),
    ).rejects.toThrow(AppError);
  });

  it('deve marcar pagamento como FAILED quando estratégia retorna falha', async () => {
    const paymentRepo = {
      findByOrderId: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((p) => p),
      delete: vi.fn(),
    };
    const failingStrategy = {
      method: PaymentMethod.PIX,
      process: vi.fn().mockResolvedValue({ transactionId: 'fail-1', success: false }),
    };
    const strategyResolver = { resolve: vi.fn().mockReturnValue(failingStrategy) };
    const orderService = {
      getOrderTotal: vi.fn().mockResolvedValue(5000),
      confirmOrder: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new ProcessPaymentUseCase(
      paymentRepo,
      strategyResolver as unknown as PaymentStrategyResolver,
      orderService,
      cache,
    );
    const result = await useCase.execute({
      orderId: 'order-2',
      method: PaymentMethod.PIX,
    });

    expect(result.status).toBe('FAILED');
    expect(orderService.confirmOrder).not.toHaveBeenCalled();
    expect(cache.delByPattern).toHaveBeenCalledWith('orders:*');
  });

  it('paymentsProcessedTotal.inc é chamado com status "PAID" no sucesso', async () => {
    const paymentRepo = {
      findByOrderId: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((p) => p),
      delete: vi.fn(),
    };
    const strategyResolver = new PaymentStrategyResolver([new PixStrategy()]);
    const orderService = {
      getOrderTotal: vi.fn().mockResolvedValue(10000),
      confirmOrder: vi.fn().mockResolvedValue(undefined),
    };
    const cache = makeCache();

    const useCase = new ProcessPaymentUseCase(paymentRepo, strategyResolver, orderService, cache);
    await useCase.execute({
      orderId: 'order-1',
      method: PaymentMethod.PIX,
    });

    expect(paymentsProcessedTotal.inc).toHaveBeenCalledWith({ status: 'PAID' });
  });

  it('paymentsProcessedTotal.inc é chamado com status "FAILED" na falha', async () => {
    const paymentRepo = {
      findByOrderId: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((p) => p),
      delete: vi.fn(),
    };
    const failingStrategy = {
      method: PaymentMethod.PIX,
      process: vi.fn().mockResolvedValue({ transactionId: 'fail-1', success: false }),
    };
    const strategyResolver = { resolve: vi.fn().mockReturnValue(failingStrategy) };
    const orderService = {
      getOrderTotal: vi.fn().mockResolvedValue(5000),
      confirmOrder: vi.fn(),
    };
    const cache = makeCache();

    const useCase = new ProcessPaymentUseCase(
      paymentRepo,
      strategyResolver as unknown as PaymentStrategyResolver,
      orderService,
      cache,
    );
    await useCase.execute({
      orderId: 'order-2',
      method: PaymentMethod.PIX,
    });

    expect(paymentsProcessedTotal.inc).toHaveBeenCalledWith({ status: 'FAILED' });
  });

  it('cache.delByPattern("orders:*") é chamado após salvar no sucesso', async () => {
    const paymentRepo = {
      findByOrderId: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((p) => p),
      delete: vi.fn(),
    };
    const strategyResolver = new PaymentStrategyResolver([new PixStrategy()]);
    const orderService = {
      getOrderTotal: vi.fn().mockResolvedValue(10000),
      confirmOrder: vi.fn().mockResolvedValue(undefined),
    };
    const cache = makeCache();

    const useCase = new ProcessPaymentUseCase(paymentRepo, strategyResolver, orderService, cache);
    await useCase.execute({
      orderId: 'order-1',
      method: PaymentMethod.PIX,
    });

    expect(paymentRepo.save).toHaveBeenCalled();
    expect(cache.delByPattern).toHaveBeenCalledWith('orders:*');
  });
});
