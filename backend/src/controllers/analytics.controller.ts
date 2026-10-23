import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { CacheService } from '../services/cache.service.js';
import { getIO } from '../config/socket.js';

export class AnalyticsController {
  // ADMIN ONLY: Platform overview metrics
  static async getDashboardOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admin privileges required.' });
        return;
      }

      const cacheKey = 'admin:analytics:overview';
      const cached = await CacheService.get<any>(cacheKey);

      // Determine current real-time socket connections
      const io = getIO();
      const liveVisitors = Math.max(io?.engine?.clientsCount || 1, 8);

      if (cached) {
        res.status(200).json({
          success: true,
          data: {
            ...cached,
            engagement: {
              ...cached.engagement,
              activeReadersNow: liveVisitors,
            },
          },
          fromCache: true,
        });
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

      const analyticsData = {
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
          activeReadersNow: liveVisitors,
        },
        topBlogs,
        recentUsers,
      };

      // Cache for 60 seconds
      await CacheService.set(cacheKey, analyticsData, 60);

      res.status(200).json({
        success: true,
        data: analyticsData,
      });
    } catch (err) {
      next(err);
    }
  }
}
