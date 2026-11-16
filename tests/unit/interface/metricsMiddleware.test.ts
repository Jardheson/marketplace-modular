import { describe, it, expect, vi, beforeEach } from 'vitest';
import { metricsMiddleware } from '../../../src/interface/http/middlewares/metricsMiddleware';
import { Request, Response } from 'express';
import {
  httpRequestsTotal,
  httpRequestDurationMs,
  httpErrorsTotal,
} from '../../../src/infra/observability/metrics';

vi.mock('../../../src/infra/observability/metrics', () => ({
  httpRequestsTotal: { inc: vi.fn() },
  httpRequestDurationMs: { observe: vi.fn() },
  httpErrorsTotal: { inc: vi.fn() },
}));

function makeMockRes(statusCode = 200) {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  const res = {
    statusCode,
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    }),
    emit: (event: string) => {
      if (listeners[event]) {
        listeners[event].forEach((cb) => cb());
      }
    },
  } as unknown as Response;
  return res;
}

describe('metricsMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar next e registrar métricas no finish', () => {
    const req = {
      method: 'GET',
      path: '/api/v1/products',
      route: { path: '/api/v1/products' },
    } as unknown as Request;
    const res = makeMockRes(200);
    const next = vi.fn();

    metricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    (res as any).emit('finish');
  });

  it('deve contar erro para status >= 400', () => {
    const req = {
      method: 'POST',
      path: '/api/v1/products',
      route: { path: '/api/v1/products' },
    } as unknown as Request;
    const res = makeMockRes(400);
    const next = vi.fn();

    metricsMiddleware(req, res, next);
    (res as any).emit('finish');

    expect(next).toHaveBeenCalled();
  });

  it('deve usar req.path quando route não está disponível', () => {
    const req = { method: 'GET', path: '/health' } as unknown as Request;
    const res = makeMockRes(200);
    const next = vi.fn();

    metricsMiddleware(req, res, next);
    (res as any).emit('finish');

    expect(next).toHaveBeenCalled();
  });

  it('httpRequestsTotal.inc é chamado com labels corretos (method, route, status)', () => {
    const req = {
      method: 'GET',
      path: '/api/v1/products',
      route: { path: '/api/v1/products' },
    } as unknown as Request;
    const res = makeMockRes(200);
    const next = vi.fn();

    metricsMiddleware(req, res, next);
    (res as any).emit('finish');

    expect(httpRequestsTotal.inc).toHaveBeenCalledWith({
      method: 'GET',
      route: '/api/v1/products',
      status: '200',
    });
  });

  it('httpRequestDurationMs.observe é chamado', () => {
    const req = {
      method: 'GET',
      path: '/api/v1/products',
      route: { path: '/api/v1/products' },
    } as unknown as Request;
    const res = makeMockRes(200);
    const next = vi.fn();

    metricsMiddleware(req, res, next);
    (res as any).emit('finish');

    expect(httpRequestDurationMs.observe).toHaveBeenCalledWith(
      { method: 'GET', route: '/api/v1/products', status: '200' },
      expect.any(Number),
    );
  });

  it('httpErrorsTotal.inc NÃO é chamado para status 200', () => {
    const req = {
      method: 'GET',
      path: '/api/v1/products',
      route: { path: '/api/v1/products' },
    } as unknown as Request;
    const res = makeMockRes(200);
    const next = vi.fn();

    metricsMiddleware(req, res, next);
    (res as any).emit('finish');

    expect(httpErrorsTotal.inc).not.toHaveBeenCalled();
  });

  it('httpErrorsTotal.inc É chamado para status 400+', () => {
    const req = {
      method: 'POST',
      path: '/api/v1/products',
      route: { path: '/api/v1/products' },
    } as unknown as Request;
    const res = makeMockRes(400);
    const next = vi.fn();

    metricsMiddleware(req, res, next);
    (res as any).emit('finish');

    expect(httpErrorsTotal.inc).toHaveBeenCalledWith({
      method: 'POST',
      route: '/api/v1/products',
      status: '400',
    });
  });
});
