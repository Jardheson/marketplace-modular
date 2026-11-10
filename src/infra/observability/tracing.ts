import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { env } from '../../config/env';
import { logger } from '../../shared/infrastructure/logger';

let sdk: NodeSDK | null = null;

export function initTracing(): void {
  if (!env.otel.enabled) {
    logger.info('OTEL desativado. Tracing não iniciado.');
    return;
  }

  sdk = new NodeSDK({
    serviceName: env.otel.serviceName,
    traceExporter: new OTLPTraceExporter({ url: env.otel.otlpEndpoint }),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  });

  sdk.start();
  logger.info({ endpoint: env.otel.otlpEndpoint }, 'OTEL tracing iniciado.');
}

export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}
