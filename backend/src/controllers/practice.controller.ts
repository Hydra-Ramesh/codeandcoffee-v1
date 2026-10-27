import { Response } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { CacheService } from '../services/cache.service.js';
import { PracticeSheetType, ProblemDifficulty } from '@prisma/client';

export interface DailySolveSummary {
  date: string; // YYYY-MM-DD
  count: number;
  status: 'NONE' | 'NORMAL' | 'FIRE'; // NONE: 0, NORMAL: 1-4, FIRE: >= 5
}

export interface UserStreakStats {
  totalCompleted: number;
  points: number; // totalCompleted * 10
  currentStreak: number;
  highestStreak: number;
  fireDaysCount: number; // Days where solves >= 5
  normalDaysCount: number; // Days where solves >= 1 and < 5
  todaySolves: number;
  todayStatus: 'NONE' | 'NORMAL' | 'FIRE';
  recentDays: DailySolveSummary[]; // Last 14 days for activity heatmap
}

/**
 * LeetCode-style streak and points calculator:
 * - Each solved problem = 10 pts
 * - Normal solve day (1-4 problems) = NORMAL (green)
 * - Fire solve day (>= 5 problems) = FIRE (fire emoji 🔥)
 * - Current streak: consecutive days with >= 1 solve up to today/yesterday
 * - Highest streak: all-time longest consecutive solve days
 */
export function computeStreakAndDailyStats(
  completedItems: { completedAt: Date | null }[]
): UserStreakStats {
  const totalCompleted = completedItems.length;
  const points = totalCompleted * 10;

  const dateCounts: Record<string, number> = {};
  completedItems.forEach((item) => {
    if (item.completedAt) {
      const dStr = new Date(item.completedAt).toISOString().split('T')[0];
      dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;
    }
  });

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const todaySolves = dateCounts[todayStr] || 0;
  const todayStatus: 'NONE' | 'NORMAL' | 'FIRE' =
    todaySolves >= 5 ? 'FIRE' : todaySolves > 0 ? 'NORMAL' : 'NONE';

  let fireDaysCount = 0;
  let normalDaysCount = 0;
  Object.values(dateCounts).forEach((cnt) => {
    if (cnt >= 5) fireDaysCount++;
    else if (cnt >= 1) normalDaysCount++;
  });

  // Calculate highest streak
  const sortedDates = Object.keys(dateCounts)
    .filter((d) => dateCounts[d] > 0)
    .sort();

  let highestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const curDate = new Date(dStr + 'T00:00:00Z');
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        runningStreak += 1;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }
    if (runningStreak > highestStreak) {
      highestStreak = runningStreak;
    }
    prevDate = curDate;
  }

  // Calculate current streak
  let currentStreak = 0;
  let checkDate: Date | null = new Date(now);
  if (todaySolves === 0) {
    if ((dateCounts[yesterdayStr] || 0) > 0) {
      checkDate = yesterday;
    } else {
      checkDate = null;
    }
  }

  if (checkDate) {
    while (true) {
      const dKey = checkDate.toISOString().split('T')[0];
      if ((dateCounts[dKey] || 0) > 0) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // Generate 365 days summary for full-year activity calendar matrix
  const recentDays: DailySolveSummary[] = [];
  for (let i = 364; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayKey = day.toISOString().split('T')[0];
    const count = dateCounts[dayKey] || 0;
    recentDays.push({
      date: dayKey,
      count,
      status: count >= 5 ? 'FIRE' : count > 0 ? 'NORMAL' : 'NONE',
    });
  }

  return {
    totalCompleted,
    points,
    currentStreak,
    highestStreak,
    fireDaysCount,
    normalDaysCount,
    todaySolves,
    todayStatus,
    recentDays,
  };
}

export class PracticeController {
  /**
   * Public: Retrieve all published practice questions for a specific sheet type
   * Sheet types: CRACK_THE_INTERVIEW | SDE_SHEET | CP_SHEET
   */
  static async getSheetQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sheetType = req.params.sheetType as string;
      const validTypes: PracticeSheetType[] = ['CRACK_THE_INTERVIEW', 'SDE_SHEET', 'CP_SHEET', 'KNOWLEDGE_SHEET'];

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

      // Invalidate Leaderboard Cache
      await CacheService.del('practice:leaderboard');

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
          KNOWLEDGE_SHEET: 0,
        },
      };

      const completedIds: string[] = [];
      const notesMap: Record<string, string> = {};

      progressEntries.forEach((entry) => {
        if (entry.isCompleted) {
          stats.totalCompleted += 1;
          const sheet = entry.question?.sheetType;
          if (sheet && (stats.bySheet as any)[sheet] !== undefined) {
            (stats.bySheet as any)[sheet] += 1;
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

  /**
   * Public: Retrieve the Practice Leaderboard with Points and Streak Metrics
   * - 10 pts per problem solved
   * - Streaks tracked consecutively
   * - Normal day (1-4 problems): green
   * - Fire day (>= 5 problems): fire emoji 🔥
   */
  static async getPublicLeaderboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const cacheKey = 'practice:leaderboard';
      let cachedData = await CacheService.get<any>(cacheKey);

      let leaderboard = cachedData;
      if (!leaderboard) {
        const activeUsers = await prisma.user.findMany({
          where: {
            practiceProgress: {
              some: {
                isCompleted: true,
              },
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            practiceProgress: {
              where: { isCompleted: true },
              select: {
                completedAt: true,
                updatedAt: true,
                question: {
                  select: { sheetType: true, difficulty: true },
                },
              },
            },
          },
        });

        const computed = activeUsers.map((u) => {
          const stats = computeStreakAndDailyStats(u.practiceProgress);
          const lastActive = u.practiceProgress.reduce(
            (acc: Date | null, cur) => (!acc || cur.updatedAt > acc ? cur.updatedAt : acc),
            null
          );

          return {
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            role: u.role,
            totalCompleted: stats.totalCompleted,
            points: stats.points,
            currentStreak: stats.currentStreak,
            highestStreak: stats.highestStreak,
            fireDaysCount: stats.fireDaysCount,
            normalDaysCount: stats.normalDaysCount,
            todaySolves: stats.todaySolves,
            todayStatus: stats.todayStatus,
            recentDays: stats.recentDays,
            lastActive,
            crackCount: u.practiceProgress.filter((c) => c.question?.sheetType === 'CRACK_THE_INTERVIEW').length,
            sdeCount: u.practiceProgress.filter((c) => c.question?.sheetType === 'SDE_SHEET').length,
            cpCount: u.practiceProgress.filter((c) => c.question?.sheetType === 'CP_SHEET').length,
            knowledgeCount: u.practiceProgress.filter((c) => c.question?.sheetType === 'KNOWLEDGE_SHEET').length,
          };
        });

        // Sort: Solved count (and points) desc, then highest streak desc, then current streak desc
        computed.sort((a, b) => {
          if (b.totalCompleted !== a.totalCompleted) return b.totalCompleted - a.totalCompleted;
          if (b.highestStreak !== a.highestStreak) return b.highestStreak - a.highestStreak;
          return b.currentStreak - a.currentStreak;
        });

        // Assign ranks
        leaderboard = computed.map((entry, index) => ({
          rank: index + 1,
          ...entry,
        }));

        await CacheService.set(cacheKey, leaderboard, 60);
      }

      // Check if current user is logged in
      let myRankInfo = null;
      if (req.user?.id) {
        const found = leaderboard.find((item: any) => item.id === req.user?.id);
        if (found) {
          myRankInfo = found;
        } else {
          // If user hasn't solved any questions yet, generate valid 365-day stats
          const emptyStats = computeStreakAndDailyStats([]);
          myRankInfo = {
            id: req.user.id,
            name: req.user.name,
            avatar: (req.user as any).avatar || null,
            role: req.user.role,
            rank: leaderboard.length + 1,
            ...emptyStats,
            lastActive: null,
            crackCount: 0,
            sdeCount: 0,
            cpCount: 0,
            knowledgeCount: 0,
          };
        }
      }

      res.json({
        success: true,
        data: {
          totalSolvers: leaderboard.length,
          leaderboard,
          myRankInfo,
        },
      });
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve practice leaderboard' });
    }
  }

  /**
   * Authenticated: Get detailed streak and points stats for currently logged-in user
   */
  static async getMyStreak(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const progress = await prisma.userPracticeProgress.findMany({
        where: {
          userId: req.user.id,
          isCompleted: true,
        },
        select: {
          completedAt: true,
        },
      });

      const stats = computeStreakAndDailyStats(progress);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching user streak:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve streak data' });
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

      const validSheets: PracticeSheetType[] = ['CRACK_THE_INTERVIEW', 'SDE_SHEET', 'CP_SHEET', 'KNOWLEDGE_SHEET'];
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
      } else if (sheetType === 'KNOWLEDGE_SHEET') {
        // Knowledge sheet problems can have custom topic or fallback to 'General Practice'
      }

      const parsedRating = rating ? parseInt(rating, 10) : null;
      const parsedOrder = order ? parseInt(order, 10) : 0;
      const parsedDifficulty = (difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty))
        ? (difficulty as ProblemDifficulty)
        : 'MEDIUM';

      const question = await prisma.practiceQuestion.create({
        data: {
          sheetType: sheetType as PracticeSheetType,
          topic: topic ? topic.trim() : (sheetType === 'KNOWLEDGE_SHEET' ? 'General Practice' : null),
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
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Access denied: Only administrators can view user activity and progress data.',
        });
        return;
      }

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
      const sheetCompletions: Record<string, number> = {
        CRACK_THE_INTERVIEW: 0,
        SDE_SHEET: 0,
        CP_SHEET: 0,
        KNOWLEDGE_SHEET: 0,
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
              completedAt: true,
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
          const stats = computeStreakAndDailyStats(completed);
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
            totalCompleted: stats.totalCompleted,
            points: stats.points,
            currentStreak: stats.currentStreak,
            highestStreak: stats.highestStreak,
            fireDaysCount: stats.fireDaysCount,
            normalDaysCount: stats.normalDaysCount,
            todaySolves: stats.todaySolves,
            todayStatus: stats.todayStatus,
            recentDays: stats.recentDays,
            totalNotes: withNotes.length,
            lastActive,
            crackCount: completed.filter((c) => c.question?.sheetType === 'CRACK_THE_INTERVIEW')
              .length,
            sdeCount: completed.filter((c) => c.question?.sheetType === 'SDE_SHEET').length,
            cpCount: completed.filter((c) => c.question?.sheetType === 'CP_SHEET').length,
            knowledgeCount: completed.filter((c) => c.question?.sheetType === 'KNOWLEDGE_SHEET').length,
          };
        })
        .sort((a, b) => b.totalCompleted - a.totalCompleted || b.highestStreak - a.highestStreak)
        .slice(0, 25)
        .map((entry, idx) => ({ rank: idx + 1, ...entry }));

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
