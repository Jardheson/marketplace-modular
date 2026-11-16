import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../../../src/interface/http/middlewares/errorHandler';
import { AppError } from '../../../src/shared/domain/AppError';
import { Request, Response } from 'express';

function makeMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('errorHandler', () => {
  it('deve retornar status e mensagem corretos para AppError', () => {
    const err = AppError.notFound('Produto');
    const req = {} as Request;
    const res = makeMockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.objectContaining({
        code: 'NOT_FOUND',
        message: 'Produto não encontrado.',
      }),
    });
  });

  it('deve retornar 500 para erro genérico', () => {
    const err = new Error('erro inesperado');
    const req = {} as Request;
    const res = makeMockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    });
  });

  it('deve tratar erro que não é instância de Error', () => {
    const err = 'string de erro';
    const req = {} as Request;
    const res = makeMockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
