import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis.js';

interface CachedIdempotentResponse {
  status: 'PENDING' | 'COMPLETED';
  statusCode?: number;
  body?: any;
  timestamp: number;
}

/**
 * Universal Idempotency Middleware for Database Mutations & Transactions
 * Prevents duplicate transactions, double-charges, and duplicated records caused by network retries.
 * Supports `Idempotency-Key` or `X-Idempotency-Key` headers.
 */
export async function idempotency(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const method = req.method.toUpperCase();
  // Only state-mutating requests require idempotency protection
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string;
  if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
    return next();
  }

  const cleanKey = idempotencyKey.trim();
  const cacheKey = `idempotency:${req.baseUrl || ''}${req.path}:${cleanKey}`;

  try {
    const existing = await redisClient.get(cacheKey);

    if (existing) {
      const parsed: CachedIdempotentResponse =
        typeof existing === 'string' ? JSON.parse(existing) : (existing as CachedIdempotentResponse);

      if (parsed.status === 'PENDING') {
        res.status(409).json({
          success: false,
          message: 'An identical request is currently being processed. Please wait for completion before retrying.',
        });
        return;
      }

      if (parsed.status === 'COMPLETED') {
        // Replay cached idempotent response without touching the database
        res.setHeader('Idempotent-Replay', 'true');
        res.status(parsed.statusCode || 200).json(parsed.body);
        return;
      }
    }

    // Acquire 30-second concurrency lock
    const pendingPayload: CachedIdempotentResponse = {
      status: 'PENDING',
      timestamp: Date.now(),
    };
    await redisClient.setex(cacheKey, 30, JSON.stringify(pendingPayload));

    // Intercept response methods to cache final result
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    let responseSaved = false;
    const saveResponse = async (body: any) => {
      if (responseSaved) return;
      responseSaved = true;

      try {
        if (res.statusCode < 500) {
          // Cache successful or client-error mutation result for 5 minutes (300 seconds)
          const completedPayload: CachedIdempotentResponse = {
            status: 'COMPLETED',
            statusCode: res.statusCode,
            body,
            timestamp: Date.now(),
          };
          await redisClient.setex(cacheKey, 300, JSON.stringify(completedPayload));
        } else {
          // If server error occurred (5xx), release lock so client can safely retry
          await redisClient.del(cacheKey);
        }
      } catch (err) {
        console.warn('[Idempotency] Failed to cache idempotent response:', err);
      }
    };

    res.json = (body: any): Response => {
      saveResponse(body);
      return originalJson(body);
    };

    res.send = (body: any): Response => {
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        saveResponse(parsed);
      } catch {
        saveResponse(body);
      }
      return originalSend(body);
    };

    next();
  } catch (err) {
    console.warn('[Idempotency] Middleware bypassed due to error:', err);
    next();
  }
}
