import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import v1Routes from './routes/v1/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';
import { idempotency } from './middleware/idempotency.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { requestTimeout } from './middleware/timeout.middleware.js';
import { config } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Distributed correlation ID assignment
  app.use(requestIdMiddleware);

  // Request latency and access logger
  app.use(requestLogger);

  // Global HTTP connection timeout protection (15s)
  app.use(requestTimeout(15000));

  // Helmet for security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  // Dynamic and resilient CORS origin resolution
  const rawClientOrigins = config.allowedClientOrigins || [config.clientUrl];
  const staticOrigins = new Set([
    ...rawClientOrigins,
    'https://codeandcoffee.live',
    'https://www.codeandcoffee.live',
    'https://codeandcoffee-v1.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ]);

  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!requestOrigin) return callback(null, true);
        if (staticOrigins.has(requestOrigin)) return callback(null, true);

        try {
          const parsed = new URL(requestOrigin);
          if (
            parsed.hostname === 'codeandcoffee.live' ||
            parsed.hostname.endsWith('.codeandcoffee.live') ||
            parsed.hostname.endsWith('.vercel.app') ||
            parsed.hostname.endsWith('rameshdas.online') ||
            parsed.hostname === 'localhost' ||
            parsed.hostname === '127.0.0.1'
          ) {
            return callback(null, true);
          }
        } catch {
          // If URL parsing fails, reject by default
        }

        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Idempotency-Key',
        'idempotency-key',
        'X-Request-Id',
        'x-request-id',
        'Accept',
        'Cache-Control',
        'X-Requested-With',
      ],
      exposedHeaders: [
        'X-Request-Id',
        'X-Response-Time',
        'Idempotency-Replayed',
      ],
    })
  );

  // Cookie parser for secure HttpOnly session tokens
  app.use(cookieParser());

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads directory for blog banners and inline photos
  const uploadsPath = path.join(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Global rate limiter
  app.use('/api/', apiLimiter);

  // Global Idempotency protection for mutations & transactions
  app.use('/api/', idempotency);

  // Root route
  app.get('/', (req, res) => {
    res.json({
      name: 'Code & Coffee API',
      status: 'online',
      version: 'v1',
      documentation: '/api/v1/health',
    });
  });

  // Mount API version 1
  app.use('/api/v1', v1Routes);

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Resource not found on Code & Coffee API: ${req.method} ${req.originalUrl}`,
      requestId: req.id,
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
