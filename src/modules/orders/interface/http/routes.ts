import { Router } from 'express';
import { OrderController } from './OrderController';
import { validateBody } from '../../../../interface/http/middlewares/validateBody';
import { CreateOrderRequest } from './dto/CreateOrderRequest';

export function orderRoutes(controller: OrderController): Router {
  const router = Router();
  router.post('/orders', validateBody(CreateOrderRequest), (req, res, next) =>
    controller.create(req, res, next),
  );
  router.get('/orders', (req, res, next) => controller.list(req, res, next));
  router.get('/orders/:id', (req, res, next) => controller.getById(req, res, next));
  return router;
}
