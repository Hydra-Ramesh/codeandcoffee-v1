import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastNewWaitlistEntry, broadcastWaitlistCount } from '../config/socket.js';

const joinWaitlistSchema = z.object({
  track: z.string().min(2, 'Track is required').default('All Tracks (Full Job-Ready Bundle)'),
  notes: z.string().max(1000).optional().nullable(),
  honeypot: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['WAITLISTED', 'INVITED', 'ONBOARDED']),
});

export class WaitlistController {
  /**
   * Authenticated: Join the What's Coming VIP early access waitlist
   */
  static async joinWaitlist(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required. Please sign in to join the early access waiting list.',
        });
        return;
      }

      const body = joinWaitlistSchema.parse(req.body);

      // Anti-bot honeypot trap
      if (body.honeypot && body.honeypot.trim().length > 0) {
        console.warn('🤖 Automated bot trapped in waitlist honeypot field. Suppressing.');
        res.status(201).json({
          success: true,
          message: 'You have been registered for early access notification.',
        });
        return;
      }

      const userEmail = req.user.email.toLowerCase().trim();
      const userName = (req.user.name && req.user.name.trim().length > 0)
        ? req.user.name.trim()
        : 'Developer';
      const track = body.track.trim();
      const notes = body.notes ? body.notes.trim() : null;

      // Upsert into waitlist
      const entry = await prisma.waitlistEntry.upsert({
        where: {
          email_track: {
            email: userEmail,
            track: track,
          },
        },
        create: {
          userId: req.user.id,
          name: userName,
          email: userEmail,
          track: track,
          notes: notes,
          status: 'WAITLISTED',
        },
        update: {
          userId: req.user.id,
          name: userName,
          notes: notes || undefined,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
      });

      // Broadcast real-time event to Admin Console (No email to admin, displayed directly in panel)
      try {
        const totalWaitlistCount = await prisma.waitlistEntry.count();
        broadcastNewWaitlistEntry(entry);
        broadcastWaitlistCount(totalWaitlistCount);
      } catch (err) {
        console.warn('⚠️ Could not broadcast waitlist event via socket:', (err as Error).message);
      }

      res.status(201).json({
        success: true,
        message: '🎉 You have been registered on the VIP Early Access Waiting List! We will notify you as new cohorts open.',
        data: entry,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Authenticated: Get the current user's waitlist registration status
   */
  static async getMyStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const userEmail = req.user.email.toLowerCase().trim();

      const entries = await prisma.waitlistEntry.findMany({
        where: {
          OR: [
            { email: userEmail },
            { userId: req.user.id },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: {
          hasJoined: entries.length > 0,
          entries: entries,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin only: List all waitlist entries with search, filter, and pagination
   */
  static async getWaitlistAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '20', 10)));
      const search = (req.query.search as string)?.trim();
      const track = (req.query.track as string)?.trim();
      const status = (req.query.status as string)?.trim().toUpperCase();

      const whereClause: any = {};

      if (status && ['WAITLISTED', 'INVITED', 'ONBOARDED'].includes(status)) {
        whereClause.status = status;
      }

      if (track && track !== 'ALL') {
        whereClause.track = { contains: track, mode: 'insensitive' };
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, waitlist, totalWaitlisted, totalInvited, totalOnboarded] = await Promise.all([
        prisma.waitlistEntry.count({ where: whereClause }),
        prisma.waitlistEntry.findMany({
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
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
        }),
        prisma.waitlistEntry.count({ where: { status: 'WAITLISTED' } }),
        prisma.waitlistEntry.count({ where: { status: 'INVITED' } }),
        prisma.waitlistEntry.count({ where: { status: 'ONBOARDED' } }),
      ]);

      // Track distribution breakdown for quick filtering
      const trackDistribution = await prisma.waitlistEntry.groupBy({
        by: ['track'],
        _count: { _all: true },
      });

      res.json({
        success: true,
        data: {
          waitlist,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
          stats: {
            totalAll: totalWaitlisted + totalInvited + totalOnboarded,
            waitlisted: totalWaitlisted,
            invited: totalInvited,
            onboarded: totalOnboarded,
            tracks: trackDistribution.map((t) => ({
              track: t.track,
              count: t._count._all,
            })),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin only: Get quick waitlist stats and badge count
   */
  static async getWaitlistStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [totalCount, waitlistedCount, invitedCount, onboardedCount, recentEntries] = await Promise.all([
        prisma.waitlistEntry.count(),
        prisma.waitlistEntry.count({ where: { status: 'WAITLISTED' } }),
        prisma.waitlistEntry.count({ where: { status: 'INVITED' } }),
        prisma.waitlistEntry.count({ where: { status: 'ONBOARDED' } }),
        prisma.waitlistEntry.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalCount,
          waitlistedCount,
          invitedCount,
          onboardedCount,
          recentEntries,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin only: Update waitlist entry status (WAITLISTED, INVITED, ONBOARDED)
   */
  static async updateStatusAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = updateStatusSchema.parse(req.body);

      const entry = await prisma.waitlistEntry.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: `Status updated to ${status}.`,
        data: entry,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin only: Delete waitlist entry
   */
  static async deleteEntryAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);

      await prisma.waitlistEntry.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Waitlist record deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
