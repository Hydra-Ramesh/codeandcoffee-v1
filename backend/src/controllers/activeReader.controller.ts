import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis.js';

export class ActiveReaderController {
  // Heartbeat endpoint: sent every 10-15s while user is on a blog page
  static async heartbeat(req: Request, res: Response, next: NextFunction) {
    try {
      const { blogId, readerId } = req.body;

      if (!blogId || !readerId) {
        res.status(400).json({ success: false, message: 'blogId and readerId are required.' });
        return;
      }

      // Set key with 25s TTL in Redis (auto-expires if user closes tab)
      const key = `blog:reader:${blogId}:${readerId}`;
      await redisClient.setex(key, 25, 'active');

      // Also mark in global site active set
      await redisClient.setex(`site:active:${readerId}`, 25, 'active');

      // Get current count for this blog
      const blogKeys = await redisClient.keys(`blog:reader:${blogId}:*`);

      res.status(200).json({
        success: true,
        data: {
          blogId,
          activeReaders: Math.max(1, blogKeys.length),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Get current active readers for a specific blog
  static async getActiveCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { blogId } = req.params;
      const keys = await redisClient.keys(`blog:reader:${blogId}:*`);

      res.status(200).json({
        success: true,
        data: {
          blogId,
          activeReaders: keys.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Global platform reader metrics (for Hero banner & Admin dashboard)
  static async getGlobalStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [blogReaderKeys, siteReaderKeys] = await Promise.all([
        redisClient.keys('blog:reader:*'),
        redisClient.keys('site:active:*'),
      ]);

      const totalActiveBlogReaders = blogReaderKeys.length;
      const totalActiveSiteVisitors = Math.max(totalActiveBlogReaders, siteReaderKeys.length);

      res.status(200).json({
        success: true,
        data: {
          totalActiveBlogReaders,
          totalActiveSiteVisitors: Math.max(1, totalActiveSiteVisitors),
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
