import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockStart = vi.fn();
const mockShutdown = vi.fn();

function MockNodeSDK() {
  return {
    start: mockStart,
    shutdown: mockShutdown,
  };
}
const mockNodeSDK = vi.fn(MockNodeSDK);

vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: mockNodeSDK,
}));

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: vi.fn(),
}));

vi.mock('@opentelemetry/instrumentation-http', () => ({
  HttpInstrumentation: vi.fn(),
}));

vi.mock('@opentelemetry/instrumentation-express', () => ({
  ExpressInstrumentation: vi.fn(),
}));

vi.mock('@opentelemetry/instrumentation-pg', () => ({
  PgInstrumentation: vi.fn(),
}));

vi.mock('../../../src/shared/infrastructure/logger', () => ({
  logger: { info: vi.fn() },
}));

describe('tracing', () => {
  beforeEach(() => {
    vi.resetModules();
    mockNodeSDK.mockClear();
    mockStart.mockClear();
    mockShutdown.mockClear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('quando OTEL está desativado, initTracing() não cria NodeSDK', async () => {
    vi.doMock('../../../src/config/env', () => ({
      env: {
        otel: {
          enabled: false,
          serviceName: 'test-service',
          otlpEndpoint: 'http://localhost:4318/v1/traces',
        },
      },
    }));

    const { initTracing } = await import('../../../src/infra/observability/tracing');
    initTracing();

    expect(mockNodeSDK).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('quando OTEL está ativado, initTracing() cria NodeSDK e chama start()', async () => {
    vi.doMock('../../../src/config/env', () => ({
      env: {
        otel: {
          enabled: true,
          serviceName: 'test-service',
          otlpEndpoint: 'http://collector:4318/v1/traces',
        },
      },
    }));

    const { initTracing } = await import('../../../src/infra/observability/tracing');
    initTracing();

    expect(mockNodeSDK).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('shutdownTracing() chama sdk.shutdown() quando o SDK foi inicializado', async () => {
    vi.doMock('../../../src/config/env', () => ({
      env: {
        otel: {
          enabled: true,
          serviceName: 'test-service',
          otlpEndpoint: 'http://localhost:4318/v1/traces',
        },
      },
    }));

    const { initTracing, shutdownTracing } =
      await import('../../../src/infra/observability/tracing');

    initTracing();
    await shutdownTracing();

    expect(mockShutdown).toHaveBeenCalledTimes(1);
  });

  it('shutdownTracing() não faz nada se o SDK não foi inicializado', async () => {
    vi.doMock('../../../src/config/env', () => ({
      env: {
        otel: {
          enabled: false,
          serviceName: 'test-service',
          otlpEndpoint: 'http://localhost:4318/v1/traces',
        },
      },
    }));

    const { initTracing, shutdownTracing } =
      await import('../../../src/infra/observability/tracing');

    initTracing();
    await shutdownTracing();

    expect(mockShutdown).not.toHaveBeenCalled();
  });
});
