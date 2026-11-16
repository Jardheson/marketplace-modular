import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryController } from '../../../src/modules/catalog/interface/http/CategoryController';
import { Request, Response } from 'express';

const mockCategory = {
  id: 'cat-1',
  name: 'Categoria',
  description: 'Desc',
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function makeMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('CategoryController', () => {
  let createUseCase: { execute: ReturnType<typeof vi.fn> };
  let controller: CategoryController;

  beforeEach(() => {
    createUseCase = { execute: vi.fn().mockResolvedValue(mockCategory) };
    controller = new CategoryController(createUseCase as never);
  });

  it('create deve retornar 201 com a categoria criada', async () => {
    const req = { body: { name: 'Categoria', description: 'Desc' } } as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockCategory);
  });

  it('create deve usar descrição vazia quando não informada', async () => {
    const req = { body: { name: 'Categoria' } } as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.create(req, res, next);
    expect(createUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ description: '' }),
    );
  });

  it('create deve passar erro para next', async () => {
    const erro = new Error('falha');
    createUseCase.execute.mockRejectedValue(erro);
    const req = { body: {} } as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.create(req, res, next);
    expect(next).toHaveBeenCalledWith(erro);
  });
});
