import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { redisClient } from '../config/redis.js';

export class AnalyticsController {
  // ADMIN ONLY: Platform overview metrics
  static async getDashboardOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admin privileges required.' });
        return;
      }

      const [
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalUsers,
        adminCount,
        bannedCount,
        totalComments,
        totalLikes,
        totalDislikes,
        topBlogs,
        recentUsers,
      ] = await Promise.all([
        prisma.post.count(),
        prisma.post.count({ where: { isPublished: true } }),
        prisma.post.count({ where: { isPublished: false } }),
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { isBanned: true } }),
        prisma.comment.count(),
        prisma.like.count(),
        prisma.dislike.count(),
        prisma.post.findMany({
          take: 5,
          orderBy: { views: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            views: true,
            category: true,
            _count: { select: { likes: true, comments: true } },
          },
        }),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBanned: true,
            createdAt: true,
          },
        }),
      ]);

      // Count live active readers right now from Redis
      const readerKeys = await redisClient.keys('blog:reader:*');
      const activeReadersCount = Math.max(0, readerKeys.length);

      res.status(200).json({
        success: true,
        data: {
          blogs: {
            total: totalBlogs,
            published: publishedBlogs,
            drafts: draftBlogs,
          },
          users: {
            total: totalUsers,
            admins: adminCount,
            banned: bannedCount,
            active: totalUsers - bannedCount,
          },
          engagement: {
            totalComments,
            totalLikes,
            totalDislikes,
            activeReadersNow: activeReadersCount,
          },
          topBlogs,
          recentUsers,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
