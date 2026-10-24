import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { redisClient } from '../../config/redis.js';
import mongoose from 'mongoose';
import { config } from '../../config/env.js';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Shallow liveness check for load balancers and orchestrators (fast, zero-overhead)
 * @access  Public
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: config.nodeEnv,
    service: 'Code & Coffee API',
  });
});

/**
 * @route   GET /api/v1/health/deep
 * @desc    Deep readiness probe inspecting live PostgreSQL, Redis, MongoDB, and memory metrics
 * @access  Public
 */
router.get('/deep', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks: Record<string, { status: 'healthy' | 'degraded' | 'unhealthy'; latencyMs?: number; details?: string }> = {};

  // 1. PostgreSQL (Neon) Ping
  try {
    const pgStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = {
      status: 'healthy',
      latencyMs: Date.now() - pgStart,
      details: 'Connected to primary relational database',
    };
  } catch (error) {
    checks.postgres = {
      status: 'unhealthy',
      details: (error as Error).message,
    };
  }

  // 2. Redis Cache Ping
  try {
    const redisStart = Date.now();
    const testKey = `health_ping_${Date.now()}`;
    await redisClient.set(testKey, 'ok', 'EX', 5);
    const readVal = await redisClient.get(testKey);
    await redisClient.del(testKey);

    if (readVal === 'ok') {
      checks.redis = {
        status: 'healthy',
        latencyMs: Date.now() - redisStart,
        details: 'Cache layer read/write verification succeeded',
      };
    } else {
      checks.redis = {
        status: 'degraded',
        latencyMs: Date.now() - redisStart,
        details: 'Cache responded but value did not match',
      };
    }
  } catch (error) {
    checks.redis = {
      status: 'degraded',
      details: `Operating in fallback mode: ${(error as Error).message}`,
    };
  }

  // 3. MongoDB State (for revisions / drafts)
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const currentMongoState = mongoStates[mongoose.connection.readyState] || 'unknown';
  checks.mongodb = {
    status: currentMongoState === 'connected' ? 'healthy' : 'degraded',
    details: `Mongoose connection state: ${currentMongoState}`,
  };

  // 4. Memory Utilization
  const mem = process.memoryUsage();
  const memoryMetrics = {
    rssMb: +(mem.rss / 1024 / 1024).toFixed(2),
    heapUsedMb: +(mem.heapUsed / 1024 / 1024).toFixed(2),
    heapTotalMb: +(mem.heapTotal / 1024 / 1024).toFixed(2),
  };

  const isHealthy = checks.postgres.status === 'healthy';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
    uptimeSeconds: Math.floor(process.uptime()),
    checks,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: memoryMetrics,
    },
  });
});

export default router;
