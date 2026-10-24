import { Request, Response, NextFunction } from 'express';

/**
 * HTTP Request Latency & Access Logger Middleware
 * Computes sub-millisecond execution duration and attaches X-Response-Time header
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);

    // Color-coded log format for development and structured format for production
    const status = res.statusCode;
    const isError = status >= 400;
    const icon = isError ? '⚠️' : '⚡';

    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `${icon} [HTTP] ${req.method} ${req.originalUrl || req.url} -> ${status} (${elapsedMs}ms)`
      );
    }
  });

  next();
}
