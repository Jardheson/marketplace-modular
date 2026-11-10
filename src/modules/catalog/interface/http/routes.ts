import { Router } from 'express';
import { ProductController } from './ProductController';
import { validateBody } from '../../../../interface/http/middlewares/validateBody';
import { CreateProductRequest } from './dto/CreateProductRequest';

export function catalogRoutes(controller: ProductController): Router {
  const router = Router();

  router.post('/products', validateBody(CreateProductRequest), (req, res, next) =>
    controller.create(req, res, next),
  );
  router.get('/products', (req, res, next) => controller.list(req, res, next));
  router.get('/products/:id', (req, res, next) => controller.getById(req, res, next));

  return router;
}
