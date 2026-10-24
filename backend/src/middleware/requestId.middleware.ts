import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extend Express Request interface to include request ID
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Distributed Request Correlation ID Middleware
 * Assigns or propagates an X-Request-Id to track every HTTP transaction
 * through the server, database logs, and client error reports.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'] as string;
  const requestId = existingId && existingId.trim().length > 0 ? existingId.trim() : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}
