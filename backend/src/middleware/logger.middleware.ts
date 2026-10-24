import { Request, Response, NextFunction } from 'express';
import { incrementHttpMetric } from '../routes/v1/metrics.routes.js';

/**
 * HTTP Request Latency & Access Logger Middleware
 * Computes sub-millisecond execution duration and attaches X-Response-Time header
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startHrTime = process.hrtime();

  // Intercept writeHead to inject X-Response-Time before headers are dispatched
  const originalWriteHead = res.writeHead;
  res.writeHead = function (this: Response, statusCode: any, ...args: any[]) {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);
    if (!this.headersSent) {
      this.setHeader('X-Response-Time', `${elapsedMs}ms`);
    }
    return (originalWriteHead as any).apply(this, [statusCode, ...args]);
  };

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);

    const status = res.statusCode;
    const isError = status >= 400;
    const icon = isError ? '⚠️' : '⚡';

    // Record metric for Prometheus / Grafana observability
    incrementHttpMetric(status);

    if (process.env.NODE_ENV !== 'test') {
      const trace = req.id ? ` [${req.id.substring(0, 8)}]` : '';
      console.log(
        `${icon} [HTTP]${trace} ${req.method} ${req.originalUrl || req.url} -> ${status} (${elapsedMs}ms)`
      );
    }
  });

  next();
}
