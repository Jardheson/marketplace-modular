import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderController } from '../../../src/modules/orders/interface/http/OrderController';
import { Request, Response } from 'express';
import { ordersCreatedTotal } from '../../../src/infra/observability/metrics';
import { OrderStatus } from '../../../src/modules/orders/domain/entities/OrderStatus';

vi.mock('../../../src/infra/observability/metrics', () => ({
  ordersCreatedTotal: { inc: vi.fn() },
}));

const mockOrder = {
  id: 'order-1',
  customerId: 'cust-1',
  items: [],
  status: 'PENDING',
  total: 100,
  currency: 'BRL',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function makeMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('OrderController', () => {
  let createUseCase: { execute: ReturnType<typeof vi.fn> };
  let getByIdUseCase: { execute: ReturnType<typeof vi.fn> };
  let listUseCase: { execute: ReturnType<typeof vi.fn> };
  let controller: OrderController;

  beforeEach(() => {
    vi.clearAllMocks();
    createUseCase = { execute: vi.fn().mockResolvedValue(mockOrder) };
    getByIdUseCase = { execute: vi.fn().mockResolvedValue(mockOrder) };
    listUseCase = {
      execute: vi.fn().mockResolvedValue({
        data: [mockOrder],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }),
    };
    controller = new OrderController(
      createUseCase as never,
      getByIdUseCase as never,
      listUseCase as never,
    );
  });

  it('create deve retornar 201 e incrementar métrica', async () => {
    const req = { body: { customerId: 'cust-1', items: [] } } as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(createUseCase.execute).toHaveBeenCalled();
    expect(ordersCreatedTotal.inc).toHaveBeenCalled();
  });

  it('ordersCreatedTotal.inc() é chamado após criação bem-sucedida', async () => {
    const req = { body: { customerId: 'cust-1', items: [] } } as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.create(req, res, next);

    expect(ordersCreatedTotal.inc).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('getById deve retornar 200 com o pedido', async () => {
    const req = { params: { id: 'order-1' } } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.getById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(getByIdUseCase.execute).toHaveBeenCalledWith('order-1');
  });

  it('getById com erro chama next(error)', async () => {
    const erro = new Error('pedido não encontrado');
    getByIdUseCase.execute.mockRejectedValue(erro);
    const req = { params: { id: 'order-999' } } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.getById(req, res, next);
    expect(next).toHaveBeenCalledWith(erro);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('list deve retornar 200 com lista paginada', async () => {
    const req = {
      query: { page: '2', pageSize: '10', customerId: 'cust-1', status: 'PENDING' },
    } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.list(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(listUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 10, customerId: 'cust-1' }),
    );
  });

  it('list com filtros customerId e status', async () => {
    const req = {
      query: { customerId: 'cust-42', status: OrderStatus.PAID },
    } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.list(req, res, next);

    expect(listUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-42',
        status: OrderStatus.PAID,
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('list com erro chama next(error)', async () => {
    const erro = new Error('falha na listagem');
    listUseCase.execute.mockRejectedValue(erro);
    const req = { query: {} } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.list(req, res, next);
    expect(next).toHaveBeenCalledWith(erro);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('create deve passar erro para next', async () => {
    const erro = new Error('falha');
    createUseCase.execute.mockRejectedValue(erro);
    const req = { body: {} } as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.create(req, res, next);
    expect(next).toHaveBeenCalledWith(erro);
    expect(ordersCreatedTotal.inc).not.toHaveBeenCalled();
  });
});
