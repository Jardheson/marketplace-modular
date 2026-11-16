import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductController } from '../../../src/modules/catalog/interface/http/ProductController';
import { Request, Response } from 'express';

const mockProduct = {
  id: 'prod-1',
  name: 'Produto',
  description: 'Desc',
  price: 99.9,
  currency: 'BRL',
  stock: 10,
  categoryId: 'cat-1',
  sku: 'SKU-1',
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function makeMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('ProductController', () => {
  let createUseCase: { execute: ReturnType<typeof vi.fn> };
  let getByIdUseCase: { execute: ReturnType<typeof vi.fn> };
  let listUseCase: { execute: ReturnType<typeof vi.fn> };
  let controller: ProductController;

  beforeEach(() => {
    createUseCase = { execute: vi.fn().mockResolvedValue(mockProduct) };
    getByIdUseCase = { execute: vi.fn().mockResolvedValue(mockProduct) };
    listUseCase = {
      execute: vi.fn().mockResolvedValue({
        data: [mockProduct],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }),
    };
    controller = new ProductController(
      createUseCase as never,
      getByIdUseCase as never,
      listUseCase as never,
    );
  });

  it('create deve retornar 201 com o produto criado', async () => {
    const req = {
      body: {
        name: 'Produto',
        description: 'Desc',
        price: 99.9,
        stock: 10,
        categoryId: 'cat-1',
        sku: 'SKU-1',
      },
    } as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockProduct);
    expect(createUseCase.execute).toHaveBeenCalled();
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

  it('getById deve retornar 200 com o produto', async () => {
    const req = { params: { id: 'prod-1' } } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.getById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(getByIdUseCase.execute).toHaveBeenCalledWith('prod-1');
  });

  it('list deve retornar 200 com lista paginada', async () => {
    const req = {
      query: { page: '1', pageSize: '10', categoryId: 'cat-1', active: 'true', search: 'teste' },
    } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.list(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(listUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10, categoryId: 'cat-1', active: true }),
    );
  });

  it('list deve usar valores padrão quando query params ausentes', async () => {
    const req = { query: {} } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.list(req, res, next);
    expect(listUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 20 }),
    );
  });

  it('list deve limitar pageSize a 100', async () => {
    const req = { query: { pageSize: '999' } } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    await controller.list(req, res, next);
    expect(listUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 100 }));
  });
});
