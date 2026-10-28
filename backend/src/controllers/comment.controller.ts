import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';
import { CacheService } from '../services/cache.service.js';
import { broadcastCommentUpdate } from '../config/socket.js';
import { createAndSendNotification } from './notification.controller.js';

import { sanitizeText } from '../utils/sanitize.js';

const commentSchema = z.object({
  content: z.string().min(2, 'Comment must be at least 2 characters long').max(1000, 'Comment is too long'),
  postId: z.string().min(1, 'Post ID is required'),
});

export class CommentController {
  // Public: List comments for a blog post (with Redis caching)
  static async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = String(req.params.postId);
      const cacheKey = `comments:post:${postId}`;

      const cached = await CacheService.get<any[]>(cacheKey);
      if (cached) {
        res.status(200).json({
          success: true,
          data: cached,
          fromCache: true,
        });
        return;
      }

      const comments = await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, avatar: true, role: true } },
        },
      });

      // Cache comments for 60 seconds
      await CacheService.set(cacheKey, comments, 60);

      res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: Add a comment
  static async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required to post a comment.' });
        return;
      }

      const data = commentSchema.parse(req.body);
      const cleanContent = sanitizeText(data.content);

      if (cleanContent.length < 2) {
        res.status(400).json({ success: false, message: 'Comment content cannot be empty after sanitization.' });
        return;
      }

      const post = await prisma.post.findUnique({
        where: { id: data.postId },
        select: { id: true, title: true, slug: true, authorId: true },
      });

      const comment = await prisma.comment.create({
        data: {
          content: cleanContent,
          postId: data.postId,
          authorId: req.user.id,
        },
        include: {
          author: { select: { id: true, name: true, avatar: true, role: true } },
        },
      });

      // Real-time WebSocket broadcast to all readers in the blog room
      broadcastCommentUpdate(data.postId, 'create', comment);

      // Notify post author if commenter is not author
      if (post && post.authorId && post.authorId !== req.user.id) {
        createAndSendNotification(post.authorId, {
          title: 'New Comment on Your Article',
          message: `${req.user.name || 'A reader'} commented on "${post.title}": "${cleanContent.slice(0, 60)}${cleanContent.length > 60 ? '...' : ''}"`,
          type: 'INFO',
          link: `/blogs/${post.slug}`,
        }).catch((err) => console.warn('Could not send comment notification:', err));
      }

      // Invalidate comments cache & blog count cache & user profile
      await CacheService.del(`comments:post:${data.postId}`);
      await CacheService.invalidateBlogCaches(undefined, data.postId);
      await CacheService.invalidateUserProfile(req.user.id);

      res.status(201).json({
        success: true,
        message: 'Comment posted successfully.',
        data: comment,
      });
    } catch (err) {
      next(err);
    }
  }

  // Author or Admin: Delete comment
  static async deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const id = String(req.params.id);
      const comment = await prisma.comment.findUnique({ where: { id } });

      if (!comment) {
        res.status(404).json({ success: false, message: 'Comment not found.' });
        return;
      }

      // Check if current user is comment author or admin
      if (comment.authorId !== req.user.id && req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
        return;
      }

      await prisma.comment.delete({ where: { id } });

      // Real-time WebSocket broadcast to remove comment
      broadcastCommentUpdate(comment.postId, 'delete', { id: comment.id });

      // Invalidate comments cache & user profile
      await CacheService.del(`comments:post:${comment.postId}`);
      await CacheService.invalidateBlogCaches(undefined, comment.postId);
      await CacheService.invalidateUserProfile(comment.authorId);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
