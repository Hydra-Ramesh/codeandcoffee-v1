import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { CacheService } from '../services/cache.service.js';
import { SessionService } from '../services/session.service.js';
import { AuthService } from '../services/auth.service.js';
import { config } from '../config/env.js';
import {
  sendPasswordResetDirectEmail,
  sendAccountDeletionScheduledEmail,
  sendAccountRecoveredEmail,
} from '../config/email.js';
import { z } from 'zod';
import { sanitizeText } from '../utils/sanitize.js';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  avatar: z.string().optional().or(z.string().length(0)),
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

      if (role && (role === 'ADMIN' || role === 'USER' || role === 'CONTRIBUTOR')) {
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

      // Invalidate session cache immediately so bans take effect instantly
      await CacheService.invalidateUserSession(id);

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

      // Invalidate session cache immediately so role changes apply instantly
      await CacheService.invalidateUserSession(id);

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
      await CacheService.invalidateUserSession(id);

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

      const cacheKey = `user:profile:${req.user.id}`;
      const cached = await CacheService.get<any>(cacheKey);
      if (cached) {
        res.status(200).json({
          success: true,
          data: cached,
          fromCache: true,
        });
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
          deletionRequestedAt: true,
          deletionScheduledAt: true,
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

      let isPendingDeletion = false;
      let daysRemaining = null;
      if (user?.deletionScheduledAt) {
        if (new Date(user.deletionScheduledAt) > new Date()) {
          isPendingDeletion = true;
          daysRemaining = Math.max(0, Math.ceil((new Date(user.deletionScheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        }
      }

      const responseData = user
        ? {
            ...user,
            isPendingDeletion,
            daysRemaining,
          }
        : null;

      // Cache user profile for 120 seconds
      if (responseData) {
        await CacheService.set(cacheKey, responseData, 120);
      }

      res.status(200).json({
        success: true,
        data: responseData,
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

      const updatePayload: any = {};
      if (data.name !== undefined) updatePayload.name = sanitizeText(data.name);
      if (data.bio !== undefined) updatePayload.bio = sanitizeText(data.bio);
      if (data.avatar !== undefined) updatePayload.avatar = data.avatar;

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: updatePayload,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          role: true,
        },
      });

      // Invalidate cached profile
      await CacheService.invalidateUserProfile(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: List all active devices and sessions
  static async getUserSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const sessionId = req.cookies?.sessionId;
      const sessions = await SessionService.getUserSessions(req.user.id, sessionId, req);

      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: Revoke / log out specific device session
  static async revokeSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const sessionId = String(req.params.id);
      const result = await SessionService.revokeSession(req.user.id, sessionId);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: Revoke all other device sessions
  static async revokeOtherSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const sessionId = req.cookies?.sessionId;
      const result = await SessionService.revokeOtherSessions(req.user.id, sessionId, req);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: Request password reset directly to profile email
  static async requestDirectPasswordReset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const otp = AuthService.generateOtp(6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate existing unused codes
      await prisma.otpVerification.updateMany({
        where: { email: user.email, isUsed: false },
        data: { isUsed: true },
      });

      await prisma.otpVerification.create({
        data: {
          email: user.email,
          otp,
          purpose: 'DIRECT_RESET_PASSWORD',
          expiresAt,
        },
      });

      const resetUrl = `${config.clientUrl}/auth/forgot-password?email=${encodeURIComponent(user.email)}&otp=${otp}`;

      // Dispatch direct branded email
      await sendPasswordResetDirectEmail({
        toEmail: user.email,
        name: user.name,
        otpCode: otp,
        resetUrl,
      });

      res.status(200).json({
        success: true,
        message: `Password reset verification email has been dispatched to ${user.email}. Check your inbox.`,
        email: user.email,
      });
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: Request account deletion with 15-day cool-off period
  static async requestAccountDeletion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      // Safeguard against deleting primary platform administrator
      if (user.email.toLowerCase() === config.initialAdmin.email.toLowerCase()) {
        res.status(400).json({
          success: false,
          message: 'The primary system administrator account cannot be scheduled for deletion.',
        });
        return;
      }

      // Schedule permanent deletion 15 days from now
      const scheduledDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          deletionRequestedAt: new Date(),
          deletionScheduledAt: scheduledDate,
        },
      });

      await CacheService.invalidateUserProfile(user.id);

      // Asynchronously send confirmation email with recovery instructions
      sendAccountDeletionScheduledEmail({
        toEmail: user.email,
        name: user.name,
        scheduledDate,
      }).catch((e) => console.warn('Could not dispatch deletion scheduled email:', e));

      res.status(200).json({
        success: true,
        message: 'Account deletion scheduled. A 15-day cool-off period has begun during which you can recover your account anytime.',
        deletionScheduledAt: scheduledDate,
        daysRemaining: 15,
      });
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: Cancel account deletion & restore account
  static async cancelAccountDeletion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      if (!user.deletionScheduledAt) {
        res.status(400).json({
          success: false,
          message: 'This account does not have a pending deletion schedule.',
        });
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          deletionRequestedAt: null,
          deletionScheduledAt: null,
        },
      });

      await CacheService.invalidateUserProfile(user.id);

      // Asynchronously send confirmation email
      sendAccountRecoveredEmail({
        toEmail: user.email,
        name: user.name,
      }).catch((e) => console.warn('Could not dispatch recovery confirmation email:', e));

      res.status(200).json({
        success: true,
        message: 'Account deletion request cancelled successfully! Your account and content remain active.',
      });
    } catch (err) {
      next(err);
    }
  }
}
