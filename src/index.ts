import 'reflect-metadata';
import { createApp } from './app';
import { initializeDatabase } from './infra/database/data-source';
import { initTracing, shutdownTracing } from './infra/observability/tracing';
import { queueManager } from './infra/queue/QueueManager';
import { env } from './config/env';
import { logger } from './shared/infrastructure/logger';

async function main(): Promise<void> {
  try {
    initTracing();
    await initializeDatabase();
    logger.info('Banco de dados conectado.');

    const app = createApp();
    logger.info('Workers de fila registrados.');
    app.listen(env.port, () => {
      logger.info({ port: env.port, env: env.nodeEnv }, 'API iniciada.');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Encerrando aplicação...');
      await queueManager.closeAll();
      await shutdownTracing();
      process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error({ error }, 'Falha ao iniciar aplicação.');
    process.exit(1);
  }
}

main();
