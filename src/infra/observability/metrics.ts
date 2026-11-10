import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

// Métricas RED (Rate, Errors, Duration)
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status'],
  registers: [metricsRegistry],
});

export const httpRequestDurationMs = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duração das requisições HTTP em milissegundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [5, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [metricsRegistry],
});

export const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total de erros HTTP (4xx e 5xx)',
  labelNames: ['method', 'route', 'status'],
  registers: [metricsRegistry],
});

export const ordersCreatedTotal = new Counter({
  name: 'orders_created_total',
  help: 'Total de pedidos criados',
  registers: [metricsRegistry],
});

export const paymentsProcessedTotal = new Counter({
  name: 'payments_processed_total',
  help: 'Total de pagamentos processados',
  labelNames: ['status'],
  registers: [metricsRegistry],
});
