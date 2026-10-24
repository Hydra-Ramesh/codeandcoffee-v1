import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import mongoose from 'mongoose';
import { redisClient } from '../../config/redis.js';

const router = Router();

// In-memory counter tracking for Prometheus metrics
let totalHttpRequests = 0;
const statusCounts: Record<string, number> = {};

export function incrementHttpMetric(statusCode: number): void {
  totalHttpRequests++;
  const group = `${Math.floor(statusCode / 100)}xx`;
  statusCounts[group] = (statusCounts[group] || 0) + 1;
}

/**
 * @route   GET /api/v1/metrics
 * @desc    Prometheus OpenMetrics scrape endpoint & JSON telemetry
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const uptime = process.uptime();

  let dbConnected = 1;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbConnected = 0;
  }

  const mongoConnected = mongoose.connection.readyState === 1 ? 1 : 0;

  // Format as standard Prometheus 0.0.4 text output if not explicitly asking for JSON
  const isJson = req.headers.accept?.includes('application/json') || req.query.format === 'json';

  if (isJson) {
    res.status(200).json({
      uptimeSeconds: uptime,
      memory: {
        rssBytes: mem.rss,
        heapUsedBytes: mem.heapUsed,
        heapTotalBytes: mem.heapTotal,
      },
      http: {
        totalRequests: totalHttpRequests,
        statusGroups: statusCounts,
      },
      dependencies: {
        postgresConnected: dbConnected === 1,
        mongoConnected: mongoConnected === 1,
      },
    });
    return;
  }

  const metricsLines = [
    '# HELP process_uptime_seconds The uptime of the Node.js server in seconds.',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${uptime.toFixed(2)}`,
    '',
    '# HELP process_resident_memory_bytes Resident memory size in bytes.',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${mem.rss}`,
    '',
    '# HELP nodejs_heap_size_used_bytes Process heap size used in bytes.',
    '# TYPE nodejs_heap_size_used_bytes gauge',
    `nodejs_heap_size_used_bytes ${mem.heapUsed}`,
    '',
    '# HELP nodejs_heap_size_total_bytes Process heap size total allocated in bytes.',
    '# TYPE nodejs_heap_size_total_bytes gauge',
    `nodejs_heap_size_total_bytes ${mem.heapTotal}`,
    '',
    '# HELP http_requests_total Total number of HTTP requests received by Code & Coffee API.',
    '# TYPE http_requests_total counter',
    `http_requests_total ${totalHttpRequests}`,
    '',
    '# HELP database_connection_state Neon PostgreSQL connection health (1 = connected, 0 = disconnected).',
    '# TYPE database_connection_state gauge',
    `database_connection_state ${dbConnected}`,
    '',
    '# HELP mongodb_connection_state MongoDB Atlas connection health (1 = connected, 0 = disconnected).',
    '# TYPE mongodb_connection_state gauge',
    `mongodb_connection_state ${mongoConnected}`,
  ];

  for (const [group, count] of Object.entries(statusCounts)) {
    metricsLines.push(`http_requests_by_status_total{code_group="${group}"} ${count}`);
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.status(200).send(metricsLines.join('\n') + '\n');
});

export default router;
