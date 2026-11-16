import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisCache } from '../../../src/infra/cache/RedisCache';

class MockRedis {
  private data = new Map<string, string>();
  on = vi.fn();
  get = vi.fn((key: string) => Promise.resolve(this.data.get(key) ?? null));
  set = vi.fn((key: string, value: string, _mode: string, _ttl: number) => {
    this.data.set(key, value);
    return Promise.resolve('OK');
  });
  del = vi.fn((...keys: string[]) => {
    let count = 0;
    for (const k of keys) {
      if (this.data.delete(k)) count++;
    }
    return Promise.resolve(count);
  });
  scanStream = vi.fn(function* () {
    yield [];
  });
}

describe('RedisCache', () => {
  let mockRedis: MockRedis;
  let cache: RedisCache;

  beforeEach(() => {
    mockRedis = new MockRedis();
    cache = new RedisCache(mockRedis as unknown as ConstructorParameters<typeof RedisCache>[0]);
  });

  it('deve retornar null quando chave não existe', async () => {
    const result = await cache.get('nao-existe');
    expect(result).toBeNull();
  });

  it('deve salvar e recuperar valor do cache', async () => {
    const value = { nome: 'teste', valor: 42 };
    await cache.set('chave-teste', value);
    const result = await cache.get('chave-teste');
    expect(result).toEqual(value);
  });

  it('deve excluir chave do cache', async () => {
    await cache.set('para-excluir', { foo: 'bar' });
    await cache.del('para-excluir');
    const result = await cache.get('para-excluir');
    expect(result).toBeNull();
  });

  it('deve retornar null em caso de erro no get (cache tolerante a falhas)', async () => {
    const failingRedis = {
      on: vi.fn(),
      get: vi.fn().mockRejectedValue(new Error('redis down')),
      set: vi.fn(),
      del: vi.fn(),
      scanStream: vi.fn(),
    };
    const failingCache = new RedisCache(
      failingRedis as unknown as ConstructorParameters<typeof RedisCache>[0],
    );

    const result = await failingCache.get('qualquer');
    expect(result).toBeNull();
  });

  it('deve ignorar erro no set sem lançar exceção', async () => {
    const failingRedis = {
      on: vi.fn(),
      get: vi.fn(),
      set: vi.fn().mockRejectedValue(new Error('redis down')),
      del: vi.fn(),
      scanStream: vi.fn(),
    };
    const failingCache = new RedisCache(
      failingRedis as unknown as ConstructorParameters<typeof RedisCache>[0],
    );

    await expect(failingCache.set('chave', { valor: 1 })).resolves.not.toThrow();
  });

  it('deve ignorar erro no del sem lançar exceção', async () => {
    const failingRedis = {
      on: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn().mockRejectedValue(new Error('redis down')),
      scanStream: vi.fn(),
    };
    const failingCache = new RedisCache(
      failingRedis as unknown as ConstructorParameters<typeof RedisCache>[0],
    );

    await expect(failingCache.del('chave')).resolves.not.toThrow();
  });

  it('deve usar TTL padrão quando não informado', async () => {
    await cache.set('com-ttl', { valor: 1 });
    expect(mockRedis.set).toHaveBeenCalledWith(
      'com-ttl',
      JSON.stringify({ valor: 1 }),
      'EX',
      expect.any(Number),
    );
  });

  it('deve excluir chaves por padrão com delByPattern', async () => {
    // Simula scanStream retornando as chaves que batem com o padrão
    const mockRedis = {
      on: vi.fn(),
      get: vi.fn((_key: string) => Promise.resolve(null)),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(2),
      scanStream: vi.fn(function* () {
        yield ['orders:1', 'orders:2'];
      }),
    };

    const patternCache = new RedisCache(
      mockRedis as unknown as ConstructorParameters<typeof RedisCache>[0],
    );
    await patternCache.delByPattern('orders:*');

    expect(mockRedis.del).toHaveBeenCalledWith(['orders:1', 'orders:2']);
  });

  it('não deve fazer nada quando delByPattern não encontra chaves', async () => {
    const mockRedis = {
      on: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      scanStream: vi.fn(function* () {
        yield [];
      }),
    };
    const failingCache = new RedisCache(
      mockRedis as unknown as ConstructorParameters<typeof RedisCache>[0],
    );

    await failingCache.delByPattern('nenhuma:*');
    expect(mockRedis.del).not.toHaveBeenCalled();
  });

  it('deve ignorar erro no delByPattern sem lançar exceção', async () => {
    const failingRedis = {
      on: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      scanStream: vi.fn(() => {
        throw new Error('redis down');
      }),
    };
    const failingCache = new RedisCache(
      failingRedis as unknown as ConstructorParameters<typeof RedisCache>[0],
    );

    await expect(failingCache.delByPattern('padrao:*')).resolves.not.toThrow();
  });

  it('deve retornar o cliente Redis via getClient', () => {
    expect(cache.getClient()).toBe(mockRedis);
  });
});
