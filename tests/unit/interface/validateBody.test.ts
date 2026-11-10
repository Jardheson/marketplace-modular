import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { validateBody } from '../../../src/interface/http/middlewares/validateBody';
import { errorHandler } from '../../../src/interface/http/middlewares/errorHandler';
import { CreateProductRequest } from '../../../src/modules/catalog/interface/http/dto/CreateProductRequest';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/products', validateBody(CreateProductRequest), (req, res) => {
    res.status(201).json({ receivedPrice: req.body.price });
  });
  app.get('/boom', () => {
    throw new Error('falha inesperada');
  });
  app.use(errorHandler);
  return app;
}

describe('validateBody', () => {
  it('deixa passar um corpo válido e converte para a instância do DTO', async () => {
    const res = await request(buildApp()).post('/products').send({
      name: 'Teclado',
      price: 199,
      stock: 5,
      categoryId: '11111111-1111-4111-8111-111111111111',
      sku: 'TEC-001',
    });

    expect(res.status).toBe(201);
    expect(res.body.receivedPrice).toBe(199);
  });

  it('rejeita corpo inválido com 400 antes de chegar ao caso de uso', async () => {
    const res = await request(buildApp()).post('/products').send({
      name: 'A',
      price: 0,
      stock: -1,
      categoryId: 'nao-uuid',
      sku: '',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'name' })]),
    );
  });

  it('traduz erros não mapeados para 500 sem vazar detalhes internos', async () => {
    const res = await request(buildApp()).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe('Erro interno do servidor.');
  });
});
