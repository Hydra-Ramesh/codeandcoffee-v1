import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendEmail } from '../config/email.js';

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
      const count = await prisma.contributorApplication.count({
        where: { status: 'PENDING' },
      });

      res.status(200).json({
        success: true,
        data: { pendingCount: count },
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

        // Send congratulatory email
        try {
          await sendEmail({
            to: application.email,
            subject: '🎉 Congratulations! You are now a Contributor on Code & Coffee',
            text: `Hi ${application.user.name},\n\nGreat news! Your application to become a publisher/contributor on Code & Coffee has been approved by the editorial staff.\n\nYou can now log in and access the Author Studio to write, draft, and publish your own technical articles.\n\nVisit: http://localhost:3000/admin/blogs/new\n\nHappy Writing,\nThe Code & Coffee Engineering Staff`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f19; color: #f3f4f6; border-radius: 16px; padding: 32px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 28px; font-weight: 800; color: #f59e0b;">☕ Code &amp; Coffee</span>
                  <div style="font-size: 12px; letter-spacing: 2px; color: #9ca3af; margin-top: 4px;">AUTHOR GUILD</div>
                </div>
                <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-bottom: 12px;">🎉 Welcome to the Author Guild, ${application.user.name}!</h2>
                <p style="font-size: 14px; color: #d1d5db; line-height: 1.6; margin-bottom: 20px;">
                  Your contributor application has been reviewed and <strong style="color: #10b981;">approved</strong> by the administrator.
                </p>
                <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; color: #fde68a;">
                    You can now draft, format, and publish your original deep-dives in the Code &amp; Coffee Author Studio!
                  </p>
                </div>
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="http://localhost:3000/admin/blogs/new" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #030712; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
                    Open Author Studio &rarr;
                  </a>
                </div>
                <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
                  Code &amp; Coffee • Khejuri, East Medinipur, West Bengal, India, 721430
                </p>
              </div>
            `,
          });
        } catch (mailErr) {
          console.warn('Contributor approval email notice:', (mailErr as Error).message);
        }
      }

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
