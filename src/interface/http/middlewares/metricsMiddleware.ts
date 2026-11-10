import { Request, Response, NextFunction } from 'express';
import {
  httpRequestsTotal,
  httpRequestDurationMs,
  httpErrorsTotal,
} from '../../../infra/observability/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const route = req.route?.path ?? req.path;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const labels = { method: req.method, route, status: res.statusCode.toString() };
    httpRequestsTotal.inc(labels);
    httpRequestDurationMs.observe(labels, duration);
    if (res.statusCode >= 400) httpErrorsTotal.inc(labels);
  });

  next();
}
