import { describe, it, expect } from 'vitest';
import { sanitizeHost } from '../../../src/shared/infrastructure/logger';

describe('logger - sanitizeHost', () => {
  it('deve extrair hostname de string simples', () => {
    expect(sanitizeHost('localhost')).toBe('localhost');
  });

  it('deve extrair hostname de URL com protocolo', () => {
    expect(sanitizeHost('tcp://redis.example.com:6379')).toBe('redis.example.com');
  });

  it('deve retornar unknown para entrada vazia', () => {
    expect(sanitizeHost('')).toBe('unknown');
  });

  it('deve retornar invalid para entrada malformada', () => {
    expect(sanitizeHost('://invalid')).toBe('invalid');
  });
});
