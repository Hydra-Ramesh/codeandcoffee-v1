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
import { config } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Request latency and access logger
  app.use(requestLogger);

  // Helmet for security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
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
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
