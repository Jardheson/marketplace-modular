import { Router } from 'express';
import { PaymentController } from './PaymentController';
import { validateBody } from '../../../../interface/http/middlewares/validateBody';
import { ProcessPaymentRequest } from './dto/ProcessPaymentRequest';

export function paymentRoutes(controller: PaymentController): Router {
  const router = Router();
  router.post('/payments', validateBody(ProcessPaymentRequest), (req, res, next) =>
    controller.process(req, res, next),
  );
  return router;
}
