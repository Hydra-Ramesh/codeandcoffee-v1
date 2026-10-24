import { Request, Response, NextFunction } from 'express';

/**
 * Global HTTP Request Timeout Middleware
 * Automatically terminates hanging connections after a threshold (default 15s)
 * preventing thread and connection pool starvation.
 */
export function requestTimeout(timeoutMs: number = 15000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip timeout for upload endpoints and static assets
    if (req.originalUrl?.includes('/upload') || req.path?.includes('/upload')) {
      return next();
    }

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`⏱️ [Timeout] Request timed out after ${timeoutMs}ms: ${req.method} ${req.originalUrl}`);
        res.status(504).json({
          success: false,
          message: 'Gateway Timeout: Request execution exceeded maximum allowable duration.',
          requestId: req.id,
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}
