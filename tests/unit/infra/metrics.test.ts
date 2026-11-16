import { describe, it, expect, beforeEach } from 'vitest';
import { Registry, Counter, Histogram } from 'prom-client';
import {
  metricsRegistry,
  httpRequestsTotal,
  httpRequestDurationMs,
  httpErrorsTotal,
  ordersCreatedTotal,
  paymentsProcessedTotal,
} from '../../../src/infra/observability/metrics';

describe('metrics', () => {
  beforeEach(() => {
    metricsRegistry.clear();
  });

  it('metricsRegistry é uma instância de Registry', () => {
    expect(metricsRegistry).toBeInstanceOf(Registry);
  });

  it('httpRequestsTotal é um Counter e pode ser incrementado', () => {
    expect(httpRequestsTotal).toBeInstanceOf(Counter);
    expect(() =>
      httpRequestsTotal.inc({ method: 'GET', route: '/test', status: '200' }),
    ).not.toThrow();
  });

  it('httpRequestDurationMs é um Histogram e pode ser observado', () => {
    expect(httpRequestDurationMs).toBeInstanceOf(Histogram);
    expect(() =>
      httpRequestDurationMs.observe({ method: 'GET', route: '/test', status: '200' }, 100),
    ).not.toThrow();
  });

  it('httpErrorsTotal é um Counter', () => {
    expect(httpErrorsTotal).toBeInstanceOf(Counter);
  });

  it('ordersCreatedTotal é um Counter', () => {
    expect(ordersCreatedTotal).toBeInstanceOf(Counter);
  });

  it('paymentsProcessedTotal é um Counter e pode ser incrementado', () => {
    expect(paymentsProcessedTotal).toBeInstanceOf(Counter);
    expect(() => paymentsProcessedTotal.inc({ status: 'PAID' })).not.toThrow();
  });

  it('httpRequestsTotal.inc() pode ser chamado sem erros', () => {
    expect(() =>
      httpRequestsTotal.inc({ method: 'GET', route: '/test', status: '200' }),
    ).not.toThrow();
  });
});
