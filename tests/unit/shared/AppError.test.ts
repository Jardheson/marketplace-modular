import { describe, it, expect } from 'vitest';
import { AppError } from '../../../src/shared/domain/AppError';

describe('AppError', () => {
  it('notFound deve criar erro com status 404', () => {
    const err = AppError.notFound('Produto');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toContain('Produto');
  });

  it('conflict deve criar erro com status 409', () => {
    const err = AppError.conflict('Já existe');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('validation deve criar erro com status 400', () => {
    const err = AppError.validation('Campo inválido');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('deve incluir detalhes quando fornecidos', () => {
    const details = { field: 'nome', message: 'obrigatório' };
    const err = AppError.validation('Erro de validação', details);
    expect(err.details).toEqual(details);
  });

  it('business deve criar erro com status 422', () => {
    const err = AppError.business('Regra violada');
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('BUSINESS_RULE');
  });

  it('unauthorized deve criar erro com status 401', () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Não autorizado.');
  });

  it('unauthorized deve aceitar mensagem customizada', () => {
    const err = AppError.unauthorized('Token expirado');
    expect(err.message).toBe('Token expirado');
    expect(err.statusCode).toBe(401);
  });

  it('deve ter nome "AppError"', () => {
    const err = AppError.notFound('Recurso');
    expect(err.name).toBe('AppError');
  });

  it('deve ser instância de Error', () => {
    const err = AppError.validation('erro');
    expect(err).toBeInstanceOf(Error);
  });
});
