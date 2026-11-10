import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('dotenv/config', () => ({}));

const originalEnv = { ...process.env };
const managedKeys = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_LOGGING',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_PASSWORD',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CACHE_TTL_SECONDS',
  'OTEL_ENABLED',
  'OTEL_SERVICE_NAME',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
  'OTEL_EXPORTER_JAEGER_ENDPOINT',
  'LOG_LEVEL',
  'FF_NEW_CHECKOUT',
];

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
  for (const key of managedKeys) delete process.env[key];
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe('configuração de ambiente', () => {
  it('aplica os defaults de desenvolvimento quando variáveis não foram definidas', async () => {
    const { env, isProduction } = await import('../../../src/config/env');

    expect(env.nodeEnv).toBe('development');
    expect(env.port).toBe(3000);
    expect(env.db.port).toBe(5432);
    expect(env.redis.port).toBe(6379);
    expect(env.otel.otlpEndpoint).toBe('http://localhost:4318/v1/traces');
    expect(env.featureFlags.newCheckout).toBe(false);
    expect(isProduction()).toBe(false);
  });

  it('lê valores explícitos e prefere o endpoint OTLP atual', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '3200';
    process.env.DB_LOGGING = '1';
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector:4318/v1/traces';
    process.env.FF_NEW_CHECKOUT = 'true';

    const { env, isProduction } = await import('../../../src/config/env');

    expect(env.port).toBe(3200);
    expect(env.db.logging).toBe(true);
    expect(env.otel.enabled).toBe(true);
    expect(env.otel.otlpEndpoint).toBe('http://collector:4318/v1/traces');
    expect(env.featureFlags.newCheckout).toBe(true);
    expect(isProduction()).toBe(true);
  });

  it('migra o endpoint Jaeger legado para OTLP HTTP', async () => {
    process.env.OTEL_EXPORTER_JAEGER_ENDPOINT = 'http://jaeger:14268/api/traces';

    const { env } = await import('../../../src/config/env');

    expect(env.otel.otlpEndpoint).toBe('http://jaeger:4318/v1/traces');
  });

  it('falha alto quando a URL legada do tracing é inválida', async () => {
    process.env.OTEL_EXPORTER_JAEGER_ENDPOINT = 'não é uma URL';

    await expect(import('../../../src/config/env')).rejects.toThrow(
      'OTEL_EXPORTER_JAEGER_ENDPOINT precisa ser uma URL válida.',
    );
  });

  it('usa defaults para números inválidos e interpreta false explicitamente', async () => {
    process.env.PORT = 'invalid';
    process.env.OTEL_ENABLED = 'false';
    process.env.FF_NEW_CHECKOUT = 'false';

    const { env } = await import('../../../src/config/env');

    expect(env.port).toBe(3000);
    expect(env.otel.enabled).toBe(false);
    expect(env.featureFlags.newCheckout).toBe(false);
  });
});
