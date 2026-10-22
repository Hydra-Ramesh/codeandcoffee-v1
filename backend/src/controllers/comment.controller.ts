import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(2, 'Comment must be at least 2 characters long').max(1000, 'Comment is too long'),
  postId: z.string().min(1, 'Post ID is required'),
});

export class CommentController {
  // Public: List comments for a blog post
  static async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = String(req.params.postId);
      const comments = await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, avatar: true, role: true } },
        },
      });

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

      const comment = await prisma.comment.create({
        data: {
          content: data.content,
          postId: data.postId,
          authorId: req.user.id,
        },
        include: {
          author: { select: { id: true, name: true, avatar: true, role: true } },
        },
      });

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

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
