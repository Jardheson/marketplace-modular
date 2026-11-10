import 'dotenv/config';

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    logging: boolean;
  };
  redis: {
    host: string;
    port: number;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cacheTtlSeconds: number;
  otel: {
    enabled: boolean;
    serviceName: string;
    otlpEndpoint: string;
  };
  logLevel: string;
  featureFlags: {
    newCheckout: boolean;
  };
}

function toBool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

function toInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? '', 10);
  return Number.isNaN(n) ? fallback : n;
}

function getOtlpEndpoint(): string {
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  }

  const legacyEndpoint = process.env.OTEL_EXPORTER_JAEGER_ENDPOINT;
  if (legacyEndpoint) {
    try {
      const endpoint = new URL(legacyEndpoint);
      endpoint.port = '4318';
      endpoint.pathname = '/v1/traces';
      return endpoint.toString();
    } catch {
      throw new Error('OTEL_EXPORTER_JAEGER_ENDPOINT precisa ser uma URL válida.');
    }
  }

  return 'http://localhost:4318/v1/traces';
}

export const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.PORT, 3000),
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: toInt(process.env.DB_PORT, 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'marketplace',
    logging: toBool(process.env.DB_LOGGING, false),
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: toInt(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'supersecret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  cacheTtlSeconds: toInt(process.env.CACHE_TTL_SECONDS, 300),
  otel: {
    enabled: toBool(process.env.OTEL_ENABLED, false),
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'marketplace-api',
    otlpEndpoint: getOtlpEndpoint(),
  },
  logLevel: process.env.LOG_LEVEL ?? 'info',
  featureFlags: {
    newCheckout: toBool(process.env.FF_NEW_CHECKOUT, false),
  },
};

export function isProduction(): boolean {
  return env.nodeEnv === 'production';
}
