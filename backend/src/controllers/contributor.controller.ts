import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { queueContributorApprovedEmail } from '../config/queues.js';
import { CacheService } from '../services/cache.service.js';
import {
  broadcastPendingContributorCount,
  broadcastNewContributorApplication,
} from '../config/socket.js';

const applySchema = z.object({
  reason: z.string().min(10, 'Please provide at least 10 characters explaining your interest and experience.'),
  resumeUrl: z.string().optional(),
});

export class ContributorController {
  /**
   * Authenticated user applies to become a contributor
   */
  static async applyForContributor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required. Please sign in or register first.' });
        return;
      }

      // If user is already a contributor or admin
      if (req.user.role === 'CONTRIBUTOR' || req.user.role === 'ADMIN') {
        res.status(400).json({
          success: false,
          message: `Your account already possesses ${req.user.role} publishing privileges.`,
        });
        return;
      }

      const { reason, resumeUrl } = applySchema.parse(req.body);

      // Check if user already has an application
      const existing = await prisma.contributorApplication.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (existing && existing.status === 'PENDING') {
        // Update existing pending application
        const updated = await prisma.contributorApplication.update({
          where: { id: existing.id },
          data: {
            reason,
            resumeUrl: resumeUrl || existing.resumeUrl,
            updatedAt: new Date(),
          },
        });

        res.status(200).json({
          success: true,
          message: 'Your pending contributor application has been updated.',
          data: updated,
        });
        return;
      }

      // Create new application
      const application = await prisma.contributorApplication.create({
        data: {
          userId: req.user.id,
          email: req.user.email,
          reason,
          resumeUrl,
          status: 'PENDING',
        },
      });

      // Invalidate admin contributor badge cache
      await CacheService.del('admin:badge:contributors');

      // Real-time notification broadcast to Admin Console
      setImmediate(async () => {
        try {
          const pendingCount = await prisma.contributorApplication.count({
            where: { status: 'PENDING' },
          });
          broadcastPendingContributorCount(pendingCount);
          broadcastNewContributorApplication(application);
        } catch (e) {
          console.warn('Real-time contributor broadcast note:', e);
        }
      });

      res.status(201).json({
        success: true,
        message: 'Your application to become a publisher/contributor has been successfully submitted! Administrators have been notified.',
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get the logged-in user's latest contributor application status
   */
  static async getMyApplication(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const application = await prisma.contributorApplication.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * ADMIN ONLY: Get all contributor applications
   */
  static async listApplications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string;
      const where: any = {};
      if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
        where.status = status.toUpperCase();
      }

      const applications = await prisma.contributorApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              createdAt: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: applications,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * ADMIN ONLY: Count pending contributor applications for notification badge
   */
  static async getPendingCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cacheKey = 'admin:badge:contributors';
      const cached = await CacheService.get<{ pendingCount: number }>(cacheKey);
      if (cached) {
        res.status(200).json({
          success: true,
          data: cached,
          fromCache: true,
        });
        return;
      }

      const count = await prisma.contributorApplication.count({
        where: { status: 'PENDING' },
      });

      const responsePayload = { pendingCount: count };
      await CacheService.set(cacheKey, responsePayload, 60);

      res.status(200).json({
        success: true,
        data: responsePayload,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * ADMIN ONLY: Approve or Reject a contributor application
   */
  static async updateApplicationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;

      if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status. Must be APPROVED or REJECTED.' });
        return;
      }

      const application = await prisma.contributorApplication.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!application) {
        res.status(404).json({ success: false, message: 'Contributor application not found.' });
        return;
      }

      // Update application status
      const updated = await prisma.contributorApplication.update({
        where: { id },
        data: { status },
      });

      // If approved, update user's role to CONTRIBUTOR
      if (status === 'APPROVED') {
        await prisma.user.update({
          where: { id: application.userId },
          data: { role: 'CONTRIBUTOR' },
        });

        // Invalidate cached user profile so new CONTRIBUTOR role is immediately visible
        await CacheService.invalidateUserProfile(application.userId);
        await CacheService.invalidateAdminAnalytics();

        // Queue congratulatory email asynchronously via BullMQ
        queueContributorApprovedEmail(application.email, application.user.name);
      }

      // Invalidate admin contributor badge cache
      await CacheService.del('admin:badge:contributors');

      // Real-time notification update to Admin Console
      setImmediate(async () => {
        try {
          const pendingCount = await prisma.contributorApplication.count({
            where: { status: 'PENDING' },
          });
          broadcastPendingContributorCount(pendingCount);
        } catch (e) {
          console.warn('Real-time contributor count update note:', e);
        }
      });

      res.status(200).json({
        success: true,
        message: `Application ${status.toLowerCase()} successfully.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
