import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis.js';
import { getActiveBlogReadersCount, getGlobalActiveStats } from '../config/socket.js';

export class ActiveReaderController {
  // Heartbeat endpoint: lightweight fallback for legacy or non-socket sessions
  static async heartbeat(req: Request, res: Response, next: NextFunction) {
    try {
      const { blogId, readerId } = req.body;

      if (!blogId || !readerId) {
        res.status(400).json({ success: false, message: 'blogId and readerId are required.' });
        return;
      }

      // Optional cluster-mode key marking with 30s auto-expiry
      if (process.env.REDIS_CLUSTER_MODE === 'true') {
        setImmediate(async () => {
          try {
            await redisClient.setex(`blog:reader:${blogId}:${readerId}`, 30, 'active');
            await redisClient.setex(`site:active:${readerId}`, 30, 'active');
          } catch {}
        });
      }

      // Get current instantaneous count from live WebSocket room state
      const count = getActiveBlogReadersCount(blogId);

      res.status(200).json({
        success: true,
        data: {
          blogId,
          activeReaders: Math.max(1, count),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Get current active readers for a specific blog (O(1) lookup)
  static async getActiveCount(req: Request, res: Response, next: NextFunction) {
    try {
      const blogId = String(req.params.blogId);
      const count = getActiveBlogReadersCount(blogId);

      res.status(200).json({
        success: true,
        data: {
          blogId,
          activeReaders: count,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Global platform reader metrics (for Hero banner & Admin dashboard, O(1) aggregation)
  static async getGlobalStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = getGlobalActiveStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }
}
