import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(300).optional(),
  avatar: z.string().url().optional().or(z.string().length(0)),
});

export class UserController {
  // ADMIN ONLY: List all users with filters and search
  static async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admin privileges required.' });
        return;
      }

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 15;
      const search = (req.query.search as string) || '';
      const role = (req.query.role as string) || '';
      const status = (req.query.status as string) || ''; // 'banned' or 'active'

      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role && (role === 'ADMIN' || role === 'USER')) {
        where.role = role;
      }

      if (status === 'banned') {
        where.isBanned = true;
      } else if (status === 'active') {
        where.isBanned = false;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBanned: true,
            avatar: true,
            bio: true,
            oauthProvider: true,
            createdAt: true,
            _count: {
              select: { posts: true, comments: true, likes: true },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // ADMIN ONLY: Toggle ban status (Ban or Unban)
  static async toggleBanUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admin privileges required.' });
        return;
      }

      const id = String(req.params.id);

      if (id === req.user.id) {
        res.status(400).json({ success: false, message: 'You cannot ban your own administrator account.' });
        return;
      }

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isBanned: !target.isBanned },
        select: { id: true, name: true, email: true, role: true, isBanned: true },
      });

      res.status(200).json({
        success: true,
        message: `User ${updated.email} has been ${updated.isBanned ? 'suspended' : 'reactivated'} successfully.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  // ADMIN ONLY: Change User Role (Promote to ADMIN or Demote to USER)
  static async changeUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admin privileges required.' });
        return;
      }

      const id = String(req.params.id);
      const { role } = req.body;

      if (role !== 'ADMIN' && role !== 'CONTRIBUTOR' && role !== 'USER') {
        res.status(400).json({ success: false, message: 'Invalid role. Must be USER, CONTRIBUTOR, or ADMIN.' });
        return;
      }

      if (id === req.user.id && role !== 'ADMIN') {
        res.status(400).json({ success: false, message: 'You cannot remove your own administrator status.' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, role: true, isBanned: true },
      });

      res.status(200).json({
        success: true,
        message: `User role updated to ${role}.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  // ADMIN ONLY: Delete user
  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admin privileges required.' });
        return;
      }

      const id = String(req.params.id);
      if (id === req.user.id) {
        res.status(400).json({ success: false, message: 'You cannot delete your own administrator account.' });
        return;
      }

      await prisma.user.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: 'User removed permanently from the database.',
      });
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: Get personal profile & stats
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          oauthProvider: true,
          createdAt: true,
          likes: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              post: {
                select: { id: true, title: true, slug: true, bannerImage: true, category: true, createdAt: true },
              },
            },
          },
          comments: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              post: { select: { title: true, slug: true } },
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: Update profile
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const data = updateProfileSchema.parse(req.body);

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
