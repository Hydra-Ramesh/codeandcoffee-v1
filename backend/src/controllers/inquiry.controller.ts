import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  sendAdminNewInquiryNotificationEmail,
  sendInquiryResolvedUserEmail,
} from '../config/email.js';
import {
  broadcastPendingInquiryCount,
  broadcastNewInquiry,
  broadcastInquiryUpdated,
  broadcastInquiryDeleted,
} from '../config/socket.js';
import { CacheService } from '../services/cache.service.js';

const submitInquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please provide a valid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters long'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
  honeypot: z.string().optional(),
});

const resolveInquirySchema = z.object({
  adminReply: z.string().min(5, 'Response message must be at least 5 characters long'),
});

export class InquiryController {
  /**
   * Public: Submit a new inquiry from the Contact Us page
   */
  static async submitInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = submitInquirySchema.parse(req.body);

      // Anti-bot honeypot check: if filled, silently succeed
      if (data.honeypot && data.honeypot.trim().length > 0) {
        console.warn('🤖 Automated bot trapped in inquiry honeypot field. Suppressing.');
        res.status(201).json({
          success: true,
          message: 'Your inquiry has been transmitted to our engineering team.',
        });
        return;
      }

      const inquiry = await prisma.inquiry.create({
        data: {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          subject: data.subject.trim(),
          message: data.message.trim(),
          status: 'PENDING',
        },
      });

      // Dispatch async email notification to the Admin
      sendAdminNewInquiryNotificationEmail({
        id: inquiry.id,
        name: inquiry.name,
        email: inquiry.email,
        subject: inquiry.subject,
        message: inquiry.message,
        createdAt: inquiry.createdAt,
      }).catch((err) => {
        console.error('Failed sending admin inquiry email notification:', err.message);
      });

      // Invalidate admin inquiries badge cache
      await CacheService.del('admin:badge:inquiries');

      // Real-time broadcast to Admin Dashboard
      try {
        const pendingCount = await prisma.inquiry.count({
          where: { status: 'PENDING' },
        });
        broadcastPendingInquiryCount(pendingCount);
        broadcastNewInquiry(inquiry);
      } catch (err) {
        console.warn('Could not broadcast inquiry event via socket:', (err as Error).message);
      }

      res.status(201).json({
        success: true,
        message: 'Your inquiry has been received. Our team will review it and reply via email.',
        data: { id: inquiry.id },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin only: List all inquiries with filtering & pagination
   */
  static async getInquiries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const statusParam = (req.query.status as string)?.toUpperCase();
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.max(1, Math.min(50, parseInt((req.query.limit as string) || '20', 10)));
      const search = (req.query.search as string)?.trim();

      const whereClause: any = {};
      if (statusParam === 'PENDING' || statusParam === 'RESOLVED') {
        whereClause.status = statusParam;
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [inquiries, total, pendingCount] = await Promise.all([
        prisma.inquiry.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.inquiry.count({ where: whereClause }),
        prisma.inquiry.count({ where: { status: 'PENDING' } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          inquiries,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          pendingCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin only: Get single inquiry detail
   */
  static async getInquiryById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const inquiry = await prisma.inquiry.findUnique({
        where: { id },
      });

      if (!inquiry) {
        res.status(404).json({ success: false, message: 'Inquiry not found.' });
        return;
      }

      res.status(200).json({ success: true, data: inquiry });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin only: Get current pending inquiry count for sidebar badges
   */
  static async getPendingCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cacheKey = 'admin:badge:inquiries';
      const cached = await CacheService.get<{ pendingCount: number }>(cacheKey);
      if (cached) {
        res.status(200).json({
          success: true,
          data: cached,
          fromCache: true,
        });
        return;
      }

      const pendingCount = await prisma.inquiry.count({
        where: { status: 'PENDING' },
      });

      const responsePayload = { pendingCount };
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
   * Admin only: Resolve an inquiry and send an automatic response email to the user
   */
  static async resolveInquiry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { adminReply } = resolveInquirySchema.parse(req.body);

      const inquiry = await prisma.inquiry.findUnique({
        where: { id },
      });

      if (!inquiry) {
        res.status(404).json({ success: false, message: 'Inquiry not found.' });
        return;
      }

      const resolved = await prisma.inquiry.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          adminReply: adminReply.trim(),
          resolvedAt: new Date(),
        },
      });

      // Dispatch resolution email to the user with the admin's custom reply body
      sendInquiryResolvedUserEmail({
        toEmail: inquiry.email,
        name: inquiry.name,
        subject: inquiry.subject,
        adminReply: adminReply.trim(),
        originalMessage: inquiry.message,
      }).catch((err) => {
        console.error(`Failed sending inquiry resolution email to ${inquiry.email}:`, err.message);
      });

      // Invalidate admin inquiries badge cache
      await CacheService.del('admin:badge:inquiries');

      // Broadcast updated pending count to Admin Dashboard
      try {
        const pendingCount = await prisma.inquiry.count({
          where: { status: 'PENDING' },
        });
        broadcastPendingInquiryCount(pendingCount);
        broadcastInquiryUpdated(resolved);
      } catch (err) {
        console.warn('Could not broadcast updated inquiry count:', (err as Error).message);
      }

      res.status(200).json({
        success: true,
        message: 'Inquiry marked as resolved. Response email sent to the user.',
        data: resolved,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin only: Delete an inquiry
   */
  static async deleteInquiry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await prisma.inquiry.delete({
        where: { id },
      });

      // Invalidate admin inquiries badge cache
      await CacheService.del('admin:badge:inquiries');

      // Update broadcast count & emit deletion
      const pendingCount = await prisma.inquiry.count({
        where: { status: 'PENDING' },
      });
      broadcastPendingInquiryCount(pendingCount);
      broadcastInquiryDeleted(id);

      res.status(200).json({
        success: true,
        message: 'Inquiry deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
