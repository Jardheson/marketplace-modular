import { DataSource } from 'typeorm';
import { ProductTypeOrmRepository } from './infra/persistence/typeorm/repositories/ProductTypeOrmRepository';
import { CategoryTypeOrmRepository } from './infra/persistence/typeorm/repositories/CategoryTypeOrmRepository';
import { CreateProductUseCase } from './application/use-cases/CreateProductUseCase';
import { CreateCategoryUseCase } from './application/use-cases/CreateCategoryUseCase';
import { GetProductByIdUseCase } from './application/use-cases/GetProductByIdUseCase';
import { ListProductsUseCase } from './application/use-cases/ListProductsUseCase';
import { ProductController } from './interface/http/ProductController';
import { CategoryController } from './interface/http/CategoryController';
import { catalogRoutes } from './interface/http/routes';
import { cache } from '../../infra/cache/RedisCache';

export function createCatalogModule(dataSource: DataSource) {
  const productRepo = new ProductTypeOrmRepository(dataSource);
  const categoryRepo = new CategoryTypeOrmRepository(dataSource);

  const createUseCase = new CreateProductUseCase(productRepo, categoryRepo, cache);
  const getByIdUseCase = new GetProductByIdUseCase(productRepo, cache);
  const listUseCase = new ListProductsUseCase(productRepo, cache);
  const createCategoryUseCase = new CreateCategoryUseCase(categoryRepo);

  const controller = new ProductController(createUseCase, getByIdUseCase, listUseCase);
  const categoryController = new CategoryController(createCategoryUseCase);

  return {
    productRepo,
    categoryRepo,
    routes: catalogRoutes(controller, categoryController),
  };
}
