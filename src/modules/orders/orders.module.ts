import { DataSource } from 'typeorm';
import { OrderTypeOrmRepository } from './infra/persistence/typeorm/repositories/OrderTypeOrmRepository';
import { CatalogServiceAdapter } from './infra/adapters/CatalogServiceAdapter';
import { CreateOrderUseCase } from './application/use-cases/CreateOrderUseCase';
import { GetOrderByIdUseCase } from './application/use-cases/GetOrderByIdUseCase';
import { ListOrdersUseCase } from './application/use-cases/ListOrdersUseCase';
import { OrderController } from './interface/http/OrderController';
import { orderRoutes } from './interface/http/routes';
import { IProductRepository } from '../catalog/domain/repositories/IProductRepository';
import { cache } from '../../infra/cache/RedisCache';
import { isFeatureEnabled } from '../../shared/infrastructure/feature-flags';

export function createOrdersModule(dataSource: DataSource, productRepo: IProductRepository) {
  const orderRepo = new OrderTypeOrmRepository(dataSource);
  const catalogService = new CatalogServiceAdapter(productRepo);

  const createUseCase = new CreateOrderUseCase(
    orderRepo,
    catalogService,
    cache,
    isFeatureEnabled('newCheckout'),
  );
  const getByIdUseCase = new GetOrderByIdUseCase(orderRepo, cache);
  const listUseCase = new ListOrdersUseCase(orderRepo, cache);

  const controller = new OrderController(createUseCase, getByIdUseCase, listUseCase);

  return {
    orderRepo,
    catalogService,
    routes: orderRoutes(controller),
  };
}
