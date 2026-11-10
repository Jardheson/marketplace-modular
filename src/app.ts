import 'express-async-errors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { DataSource } from 'typeorm';
import { metricsMiddleware } from './interface/http/middlewares/metricsMiddleware';
import { errorHandler } from './interface/http/middlewares/errorHandler';
import { metricsRegistry } from './infra/observability/metrics';
import { createCatalogModule } from './modules/catalog/catalog.module';
import { createOrdersModule } from './modules/orders/orders.module';
import { createPaymentsModule } from './modules/payments/payments.module';
import { AppDataSource } from './infra/database/data-source';

export function createApp(dataSource: DataSource = AppDataSource) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(metricsMiddleware);

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Métricas Prometheus
  app.get('/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.send(await metricsRegistry.metrics());
  });

  // OpenAPI / Swagger
  const openapiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
  const swaggerDocument = YAML.load(openapiPath);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Módulos
  const catalog = createCatalogModule(dataSource);
  const orders = createOrdersModule(dataSource, catalog.productRepo);
  const payments = createPaymentsModule(dataSource, orders.orderRepo);

  app.use('/api/v1', catalog.routes);
  app.use('/api/v1', orders.routes);
  app.use('/api/v1', payments.routes);

  // 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } });
  });

  app.use(errorHandler);

  return app;
}
