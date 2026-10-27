import { Response } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { CacheService } from '../services/cache.service.js';
import { PracticeSheetType, ProblemDifficulty } from '@prisma/client';

export class PracticeController {
  /**
   * Public: Retrieve all published practice questions for a specific sheet type
   * Sheet types: CRACK_THE_INTERVIEW | SDE_SHEET | CP_SHEET
   */
  static async getSheetQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sheetType = req.params.sheetType as string;
      const validTypes: PracticeSheetType[] = ['CRACK_THE_INTERVIEW', 'SDE_SHEET', 'CP_SHEET'];

      if (!validTypes.includes(sheetType as PracticeSheetType)) {
        res.status(400).json({
          success: false,
          message: `Invalid sheetType. Allowed values: ${validTypes.join(', ')}`,
        });
        return;
      }

      const cacheKey = `practice:sheet:${sheetType}`;
      let questions = await CacheService.get<any[]>(cacheKey);
      let fromCache = true;

      if (!questions) {
        fromCache = false;
        questions = await prisma.practiceQuestion.findMany({
          where: {
            sheetType: sheetType as PracticeSheetType,
            isPublished: true,
          },
          orderBy: [
            { topic: 'asc' },
            { rating: 'asc' },
            { order: 'asc' },
            { createdAt: 'asc' },
          ],
          select: {
            id: true,
            sheetType: true,
            topic: true,
            rating: true,
            platform: true,
            title: true,
            difficulty: true,
            content: true,
            externalUrl: true,
            videoUrl: true,
            solutionNotes: true,
            order: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                avatar: true,
              },
            },
          },
        });

        // Cache for 300 seconds
        await CacheService.set(cacheKey, questions, 300);
      }

      // If user is authenticated, attach their progress
      let userProgressMap: Record<string, { isCompleted: boolean; notes: string | null }> = {};
      if (req.user?.id) {
        const userProgress = await prisma.userPracticeProgress.findMany({
          where: {
            userId: req.user.id,
            question: {
              sheetType: sheetType as PracticeSheetType,
            },
          },
          select: {
            questionId: true,
            isCompleted: true,
            notes: true,
          },
        });

        userProgress.forEach((p) => {
          userProgressMap[p.questionId] = {
            isCompleted: p.isCompleted,
            notes: p.notes,
          };
        });
      }

      res.setHeader('X-Cache', fromCache ? 'HIT' : 'MISS');
      res.json({
        success: true,
        fromCache,
        data: {
          sheetType,
          totalQuestions: questions.length,
          questions,
          userProgress: userProgressMap,
        },
      });
    } catch (error: any) {
      console.error('Error fetching sheet questions:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve practice questions' });
    }
  }

  /**
   * Public: Get single question detail (e.g. for complete Readme markdown problem statement)
   */
  static async getQuestionById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const question = await prisma.practiceQuestion.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              avatar: true,
            },
          },
        },
      });

      if (!question || (!question.isPublished && req.user?.role !== 'ADMIN' && req.user?.role !== 'CONTRIBUTOR')) {
        res.status(404).json({ success: false, message: 'Question not found' });
        return;
      }

      let userProgress = null;
      if (req.user?.id) {
        userProgress = await prisma.userPracticeProgress.findUnique({
          where: {
            userId_questionId: {
              userId: req.user.id,
              questionId: id,
            },
          },
          select: {
            isCompleted: true,
            notes: true,
            completedAt: true,
          },
        });
      }

      res.json({
        success: true,
        data: {
          ...question,
          userProgress,
        },
      });
    } catch (error: any) {
      console.error('Error fetching question by id:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch question details' });
    }
  }

  /**
   * Authenticated: Toggle completion status of a question (Done / Not Done)
   */
  static async toggleProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const questionId = req.params.questionId as string;
      const userId = req.user.id;

      // Verify question exists
      const question = await prisma.practiceQuestion.findUnique({
        where: { id: questionId },
        select: { id: true, sheetType: true },
      });

      if (!question) {
        res.status(404).json({ success: false, message: 'Question not found' });
        return;
      }

      const existing = await prisma.userPracticeProgress.findUnique({
        where: {
          userId_questionId: { userId, questionId },
        },
      });

      let updated;
      if (existing) {
        const nextCompleted = !existing.isCompleted;
        updated = await prisma.userPracticeProgress.update({
          where: { id: existing.id },
          data: {
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date() : null,
          },
        });
      } else {
        updated = await prisma.userPracticeProgress.create({
          data: {
            userId,
            questionId,
            isCompleted: true,
            completedAt: new Date(),
          },
        });
      }

      res.json({
        success: true,
        message: updated.isCompleted ? 'Marked as completed' : 'Marked as uncompleted',
        data: {
          questionId,
          isCompleted: updated.isCompleted,
          notes: updated.notes,
          completedAt: updated.completedAt,
        },
      });
    } catch (error: any) {
      console.error('Error toggling practice progress:', error);
      res.status(500).json({ success: false, message: 'Failed to update progress' });
    }
  }

  /**
   * Authenticated: Save or update personal revision note for a question
   */
  static async saveQuestionNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const questionId = req.params.questionId as string;
      const { notes } = req.body;
      const userId = req.user.id;

      const question = await prisma.practiceQuestion.findUnique({
        where: { id: questionId },
        select: { id: true },
      });

      if (!question) {
        res.status(404).json({ success: false, message: 'Question not found' });
        return;
      }

      const progress = await prisma.userPracticeProgress.upsert({
        where: {
          userId_questionId: { userId, questionId },
        },
        update: {
          notes: notes ?? null,
        },
        create: {
          userId,
          questionId,
          isCompleted: false,
          notes: notes ?? null,
        },
      });

      res.json({
        success: true,
        message: 'Revision note saved successfully',
        data: {
          questionId,
          notes: progress.notes,
          isCompleted: progress.isCompleted,
        },
      });
    } catch (error: any) {
      console.error('Error saving revision note:', error);
      res.status(500).json({ success: false, message: 'Failed to save revision note' });
    }
  }

  /**
   * Authenticated: Get full progress summary for current user across all sheets
   */
  static async getMyOverallProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const userId = req.user.id;
      const progressEntries = await prisma.userPracticeProgress.findMany({
        where: { userId },
        include: {
          question: {
            select: {
              sheetType: true,
              topic: true,
              rating: true,
              difficulty: true,
            },
          },
        },
      });

      const stats = {
        totalCompleted: 0,
        bySheet: {
          CRACK_THE_INTERVIEW: 0,
          SDE_SHEET: 0,
          CP_SHEET: 0,
        },
      };

      const completedIds: string[] = [];
      const notesMap: Record<string, string> = {};

      progressEntries.forEach((entry) => {
        if (entry.isCompleted) {
          stats.totalCompleted += 1;
          const sheet = entry.question?.sheetType;
          if (sheet && stats.bySheet[sheet] !== undefined) {
            stats.bySheet[sheet] += 1;
          }
          completedIds.push(entry.questionId);
        }
        if (entry.notes) {
          notesMap[entry.questionId] = entry.notes;
        }
      });

      res.json({
        success: true,
        data: {
          stats,
          completedQuestionIds: completedIds,
          notesMap,
        },
      });
    } catch (error: any) {
      console.error('Error fetching user overall practice progress:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve progress summary' });
    }
  }

  // ==========================================
  // ADMIN & CONTRIBUTOR MANAGEMENT CONTROLLERS
  // ==========================================

  /**
   * Admin / Contributor: Get all questions with filters
   */
  static async adminGetAllQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sheetType, search, topic, rating } = req.query;

      const where: any = {};
      if (sheetType) {
        where.sheetType = sheetType as PracticeSheetType;
      }
      if (topic) {
        where.topic = topic as string;
      }
      if (rating) {
        where.rating = parseInt(rating as string, 10);
      }
      if (search) {
        where.title = {
          contains: search as string,
          mode: 'insensitive',
        };
      }

      const questions = await prisma.practiceQuestion.findMany({
        where,
        orderBy: [
          { sheetType: 'asc' },
          { topic: 'asc' },
          { rating: 'asc' },
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          _count: {
            select: {
              progress: true,
            },
          },
        },
      });

      res.json({
        success: true,
        total: questions.length,
        data: questions,
      });
    } catch (error: any) {
      console.error('Error admin getting questions:', error);
      res.status(500).json({ success: false, message: 'Failed to list admin questions' });
    }
  }

  /**
   * Admin / Contributor: Create a new practice question
   */
  static async adminCreateQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const {
        sheetType,
        topic,
        rating,
        platform,
        title,
        difficulty,
        content,
        externalUrl,
        videoUrl,
        solutionNotes,
        order,
        isPublished,
      } = req.body;

      const validSheets: PracticeSheetType[] = ['CRACK_THE_INTERVIEW', 'SDE_SHEET', 'CP_SHEET'];
      if (!validSheets.includes(sheetType)) {
        res.status(400).json({ success: false, message: `Invalid sheetType: ${sheetType}` });
        return;
      }

      if (!title || typeof title !== 'string' || !title.trim()) {
        res.status(400).json({ success: false, message: 'Question title is required' });
        return;
      }

      // Sheet-specific validations
      if (sheetType === 'CRACK_THE_INTERVIEW') {
        if (!topic || !topic.trim()) {
          res.status(400).json({ success: false, message: 'Topic (e.g. Array, String) is required for Crack the Interview' });
          return;
        }
      } else if (sheetType === 'SDE_SHEET') {
        if (!topic || !topic.trim()) {
          res.status(400).json({ success: false, message: 'Topic is required for SDE Sheet' });
          return;
        }
      } else if (sheetType === 'CP_SHEET') {
        if (rating === undefined || rating === null || isNaN(parseInt(rating, 10))) {
          res.status(400).json({ success: false, message: 'Rating (e.g. 800, 1000, 1200) is required for CP Sheet' });
          return;
        }
      }

      const parsedRating = rating ? parseInt(rating, 10) : null;
      const parsedOrder = order ? parseInt(order, 10) : 0;
      const parsedDifficulty = (difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty))
        ? (difficulty as ProblemDifficulty)
        : 'MEDIUM';

      const question = await prisma.practiceQuestion.create({
        data: {
          sheetType: sheetType as PracticeSheetType,
          topic: topic ? topic.trim() : null,
          rating: parsedRating,
          platform: platform || (sheetType === 'CP_SHEET' ? 'Codeforces' : 'LeetCode'),
          title: title.trim(),
          difficulty: parsedDifficulty,
          content: content ? content.trim() : null,
          externalUrl: externalUrl ? externalUrl.trim() : null,
          videoUrl: videoUrl ? videoUrl.trim() : null,
          solutionNotes: solutionNotes ? solutionNotes.trim() : null,
          order: parsedOrder,
          isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
          authorId: req.user.id,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      // Invalidate Redis Cache
      await CacheService.invalidatePracticeCaches(sheetType);

      res.status(201).json({
        success: true,
        message: 'Practice question created successfully',
        data: question,
      });
    } catch (error: any) {
      console.error('Error creating practice question:', error);
      res.status(500).json({ success: false, message: 'Failed to create question' });
    }
  }

  /**
   * Admin / Contributor: Update an existing practice question
   */
  static async adminUpdateQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const id = req.params.id as string;
      const existing = await prisma.practiceQuestion.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Question not found' });
        return;
      }

      // If contributor, ensure they are the author or user is admin
      if (req.user.role !== 'ADMIN' && existing.authorId !== req.user.id) {
        res.status(403).json({ success: false, message: 'You can only edit questions you authored' });
        return;
      }

      const {
        sheetType,
        topic,
        rating,
        platform,
        title,
        difficulty,
        content,
        externalUrl,
        videoUrl,
        solutionNotes,
        order,
        isPublished,
      } = req.body;

      const updateData: any = {};
      if (sheetType) updateData.sheetType = sheetType as PracticeSheetType;
      if (topic !== undefined) updateData.topic = topic ? topic.trim() : null;
      if (rating !== undefined) updateData.rating = rating ? parseInt(rating, 10) : null;
      if (platform !== undefined) updateData.platform = platform;
      if (title !== undefined) updateData.title = title.trim();
      if (difficulty !== undefined) updateData.difficulty = difficulty as ProblemDifficulty;
      if (content !== undefined) updateData.content = content ? content.trim() : null;
      if (externalUrl !== undefined) updateData.externalUrl = externalUrl ? externalUrl.trim() : null;
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl ? videoUrl.trim() : null;
      if (solutionNotes !== undefined) updateData.solutionNotes = solutionNotes ? solutionNotes.trim() : null;
      if (order !== undefined) updateData.order = parseInt(order, 10);
      if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

      const updated = await prisma.practiceQuestion.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      // Invalidate Redis Cache
      await CacheService.invalidatePracticeCaches(existing.sheetType);
      if (sheetType && sheetType !== existing.sheetType) {
        await CacheService.invalidatePracticeCaches(sheetType);
      }

      res.json({
        success: true,
        message: 'Question updated successfully',
        data: updated,
      });
    } catch (error: any) {
      console.error('Error updating practice question:', error);
      res.status(500).json({ success: false, message: 'Failed to update question' });
    }
  }

  /**
   * Admin / Contributor: Delete question
   */
  static async adminDeleteQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const id = req.params.id as string;
      const existing = await prisma.practiceQuestion.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Question not found' });
        return;
      }

      if (req.user.role !== 'ADMIN' && existing.authorId !== req.user.id) {
        res.status(403).json({ success: false, message: 'You can only delete questions you authored' });
        return;
      }

      await prisma.practiceQuestion.delete({
        where: { id },
      });

      // Invalidate Redis Cache
      await CacheService.invalidatePracticeCaches(existing.sheetType);

      res.json({
        success: true,
        message: 'Question deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting question:', error);
      res.status(500).json({ success: false, message: 'Failed to delete question' });
    }
  }

  /**
   * Admin / Contributor: Get real-time User Activity & Analytics for practice questions
   */
  static async adminGetUserActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [totalCompletions, totalNotes, uniqueStudents, recentActivities, allQuestions] =
        await Promise.all([
          prisma.userPracticeProgress.count({ where: { isCompleted: true } }),
          prisma.userPracticeProgress.count({
            where: {
              notes: {
                not: null,
              },
            },
          }),
          prisma.userPracticeProgress.groupBy({
            by: ['userId'],
          }),
          prisma.userPracticeProgress.findMany({
            take: 30,
            orderBy: { updatedAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  role: true,
                },
              },
              question: {
                select: {
                  id: true,
                  title: true,
                  sheetType: true,
                  topic: true,
                  rating: true,
                  platform: true,
                  difficulty: true,
                },
              },
            },
          }),
          prisma.practiceQuestion.findMany({
            where: { isPublished: true },
            select: {
              id: true,
              title: true,
              sheetType: true,
              topic: true,
              difficulty: true,
              _count: {
                select: {
                  progress: {
                    where: { isCompleted: true },
                  },
                },
              },
            },
          }),
        ]);

      // Sheet Breakdown
      const sheetCompletions = {
        CRACK_THE_INTERVIEW: 0,
        SDE_SHEET: 0,
        CP_SHEET: 0,
      };

      const sheetCountsRaw = await prisma.userPracticeProgress.findMany({
        where: { isCompleted: true },
        select: {
          question: {
            select: { sheetType: true },
          },
        },
      });

      sheetCountsRaw.forEach((item) => {
        const sheet = item.question?.sheetType;
        if (sheet && sheetCompletions[sheet] !== undefined) {
          sheetCompletions[sheet] += 1;
        }
      });

      // Top solved questions
      const topQuestions = allQuestions
        .map((q) => ({
          id: q.id,
          title: q.title,
          sheetType: q.sheetType,
          topic: q.topic,
          difficulty: q.difficulty,
          solveCount: q._count.progress,
        }))
        .sort((a, b) => b.solveCount - a.solveCount)
        .slice(0, 8);

      // Student Leaderboard
      const activeUsers = await prisma.user.findMany({
        where: {
          practiceProgress: {
            some: {},
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          practiceProgress: {
            select: {
              isCompleted: true,
              notes: true,
              updatedAt: true,
              question: {
                select: { sheetType: true },
              },
            },
          },
        },
      });

      const leaderboard = activeUsers
        .map((u) => {
          const completed = u.practiceProgress.filter((p) => p.isCompleted);
          const withNotes = u.practiceProgress.filter((p) => p.notes && p.notes.trim().length > 0);
          const lastActive = u.practiceProgress.reduce(
            (acc: Date | null, cur) => (!acc || cur.updatedAt > acc ? cur.updatedAt : acc),
            null
          );

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            role: u.role,
            totalCompleted: completed.length,
            totalNotes: withNotes.length,
            lastActive,
            crackCount: completed.filter((c) => c.question?.sheetType === 'CRACK_THE_INTERVIEW')
              .length,
            sdeCount: completed.filter((c) => c.question?.sheetType === 'SDE_SHEET').length,
            cpCount: completed.filter((c) => c.question?.sheetType === 'CP_SHEET').length,
          };
        })
        .sort((a, b) => b.totalCompleted - a.totalCompleted || b.totalNotes - a.totalNotes)
        .slice(0, 25);

      res.json({
        success: true,
        data: {
          metrics: {
            totalCompletions,
            totalNotes,
            uniqueStudentsCount: uniqueStudents.length,
            sheetCompletions,
          },
          recentActivity: recentActivities.map((act) => ({
            id: act.id,
            user: act.user,
            question: act.question,
            isCompleted: act.isCompleted,
            hasNote: Boolean(act.notes && act.notes.trim().length > 0),
            noteSnippet: act.notes ? act.notes.slice(0, 90) : null,
            completedAt: act.completedAt,
            updatedAt: act.updatedAt,
          })),
          topQuestions,
          leaderboard,
        },
      });
    } catch (error: any) {
      console.error('Error fetching admin practice user activity:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve practice activity' });
    }
  }
}
