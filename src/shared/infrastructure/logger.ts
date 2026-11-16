import pino from 'pino';
import { env } from '../../config/env';

const isProd = env.nodeEnv === 'production';

export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: ['*.password', '*.token', '*.authorization', 'req.headers.authorization'],
    remove: true,
  },
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }),
});

export function sanitizeHost(host: string): string {
  try {
    const url = new URL(host.includes('://') ? host : `tcp://${host}`);
    return url.hostname || 'unknown';
  } catch {
    return 'invalid';
  }
}
