import { Router } from 'express';
import { ProductController } from './ProductController';
import { CategoryController } from './CategoryController';
import { validateBody } from '../../../../interface/http/middlewares/validateBody';
import { CreateProductRequest } from './dto/CreateProductRequest';
import { CreateCategoryRequest } from './dto/CreateCategoryRequest';

export function catalogRoutes(
  controller: ProductController,
  categoryController: CategoryController,
): Router {
  const router = Router();

  router.post('/products', validateBody(CreateProductRequest), (req, res, next) =>
    controller.create(req, res, next),
  );
  router.get('/products', (req, res, next) => controller.list(req, res, next));
  router.get('/products/:id', (req, res, next) => controller.getById(req, res, next));

  router.post('/categories', validateBody(CreateCategoryRequest), (req, res, next) =>
    categoryController.create(req, res, next),
  );

  return router;
}
