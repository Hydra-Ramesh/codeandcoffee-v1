import { Response } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Helper to fetch flattened ordered subtopics for a course
 */
async function getOrderedSubtopicsForCourse(courseId: string) {
  const topics = await prisma.courseTopic.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      subtopics: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        select: { id: true, slug: true, topicId: true, title: true, order: true },
      },
    },
  });

  const flat: { id: string; slug: string; topicId: string; title: string; topicOrder: number; subtopicOrder: number }[] = [];
  topics.forEach((t) => {
    t.subtopics.forEach((st) => {
      flat.push({
        id: st.id,
        slug: st.slug,
        topicId: t.id,
        title: st.title,
        topicOrder: t.order,
        subtopicOrder: st.order,
      });
    });
  });

  return { topics, flat };
}

// ==============================================================================
// PUBLIC & READER CONTROLLERS
// ==============================================================================

/**
 * Get all published courses
 */
export async function getAllCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const userId = req.user?.id;

    const where: any = { isPublished: true };
    if (category && category !== 'All') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const courses: any[] = await prisma.course.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true },
        },
        topics: {
          orderBy: { order: 'asc' },
          include: {
            subtopics: {
              where: { isPublished: true },
              select: { id: true, title: true, hasQuiz: true },
            },
          },
        },
        enrollments: userId
          ? {
              where: { userId },
              select: {
                completedLessonsCount: true,
                totalLessonsCount: true,
                progressPercent: true,
                lastAccessedSubtopicId: true,
              },
            }
          : false,
      },
    });

    const formatted = courses.map((c) => {
      let totalLessons = 0;
      let totalQuizzes = 0;
      c.topics.forEach((t: any) => {
        totalLessons += t.subtopics.length;
        totalQuizzes += t.subtopics.filter((st: any) => st.hasQuiz).length;
      });

      const userEnrollment = c.enrollments && c.enrollments.length > 0 ? c.enrollments[0] : null;

      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        bannerImage: c.bannerImage,
        level: c.level,
        author: c.author,
        topicsCount: c.topics.length,
        lessonsCount: totalLessons,
        quizzesCount: totalQuizzes,
        userProgress: userEnrollment
          ? {
              completedLessons: userEnrollment.completedLessonsCount,
              totalLessons: totalLessons || userEnrollment.totalLessonsCount,
              progressPercent: Math.round(userEnrollment.progressPercent),
            }
          : null,
        createdAt: c.createdAt,
      };
    });

    res.json({
      success: true,
      data: { courses: formatted },
    });
  } catch (error: any) {
    console.error('Failed to get courses:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve courses.' });
  }
}

/**
 * Get single course with full syllabus tree & progressive lock calculation
 */
export async function getCourseBySlug(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const slug = req.params.slug as string;
    const userId = req.user?.id;
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'CONTRIBUTOR';

    const course: any = await prisma.course.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, bio: true, role: true },
        },
        topics: {
          orderBy: { order: 'asc' },
          include: {
            subtopics: {
              where: { isPublished: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                slug: true,
                order: true,
                hasQuiz: true,
                quizPassingScore: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    // Load user progress if logged in
    let userProgressMap: Record<string, { isUnlocked: boolean; isCompleted: boolean; quizPassed: boolean; quizScore?: number }> = {};
    let totalCompleted = 0;

    if (userId) {
      const progressList = await prisma.userLessonProgress.findMany({
        where: { userId, subtopic: { topic: { courseId: course.id } } },
        select: {
          subtopicId: true,
          isUnlocked: true,
          isCompleted: true,
          quizPassed: true,
          quizScore: true,
        },
      });

      progressList.forEach((p) => {
        userProgressMap[p.subtopicId] = {
          isUnlocked: p.isUnlocked,
          isCompleted: p.isCompleted,
          quizPassed: p.quizPassed,
          quizScore: p.quizScore ?? undefined,
        };
        if (p.isCompleted) totalCompleted++;
      });
    }

    // Sequential lock resolution
    // First lesson of the entire course is ALWAYS unlocked
    let hasFoundFirst = false;
    let previousLessonCompleted = false;

    const topicsWithLocks = course.topics.map((topic: any) => {
      const subtopicsWithLocks = topic.subtopics.map((st: any) => {
        let isUnlocked = false;
        let isCompleted = false;
        let quizPassed = false;
        let quizScore = undefined;

        if (isStaff) {
          // Staff can review everything
          isUnlocked = true;
          isCompleted = userProgressMap[st.id]?.isCompleted || false;
          quizPassed = userProgressMap[st.id]?.quizPassed || false;
          quizScore = userProgressMap[st.id]?.quizScore;
        } else if (!hasFoundFirst) {
          // The very first lesson is unconditionally unlocked
          isUnlocked = true;
          hasFoundFirst = true;
          isCompleted = userProgressMap[st.id]?.isCompleted || false;
          quizPassed = userProgressMap[st.id]?.quizPassed || false;
          quizScore = userProgressMap[st.id]?.quizScore;
          previousLessonCompleted = isCompleted;
        } else {
          // Subsequent lessons: unlocked if previous was completed or recorded as unlocked in DB
          const recordedUnlocked = userProgressMap[st.id]?.isUnlocked || false;
          isCompleted = userProgressMap[st.id]?.isCompleted || false;
          quizPassed = userProgressMap[st.id]?.quizPassed || false;
          quizScore = userProgressMap[st.id]?.quizScore;
          isUnlocked = recordedUnlocked || previousLessonCompleted;
          previousLessonCompleted = isCompleted;
        }

        return {
          id: st.id,
          title: st.title,
          slug: st.slug,
          order: st.order,
          hasQuiz: st.hasQuiz,
          quizPassingScore: st.quizPassingScore,
          isUnlocked,
          isCompleted,
          quizPassed,
          quizScore,
        };
      });

      return {
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        description: topic.description,
        order: topic.order,
        subtopics: subtopicsWithLocks,
      };
    });

    let totalLessonsCount = 0;
    topicsWithLocks.forEach((t: any) => (totalLessonsCount += t.subtopics.length));
    const progressPercent = totalLessonsCount > 0 ? Math.round((totalCompleted / totalLessonsCount) * 100) : 0;

    res.json({
      success: true,
      data: {
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          category: course.category,
          bannerImage: course.bannerImage,
          level: course.level,
          author: course.author,
          topics: topicsWithLocks,
          totalLessons: totalLessonsCount,
          completedLessons: totalCompleted,
          progressPercent,
          createdAt: course.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error('Failed to get course by slug:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve course details.' });
  }
}

/**
 * Get Subtopic Lesson details (Markdown content, image attachments, coding questions, sanitized quiz questions)
 */
export async function getSubtopicDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const courseSlug = req.params.courseSlug as string;
    const topicSlug = req.params.topicSlug as string;
    const subtopicSlug = req.params.subtopicSlug as string;
    const userId = req.user?.id;
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'CONTRIBUTOR';

    const course = await prisma.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true, title: true, slug: true },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    const topic = await prisma.courseTopic.findUnique({
      where: {
        courseId_slug: {
          courseId: course.id,
          slug: topicSlug,
        },
      },
      select: { id: true, title: true, slug: true, order: true },
    });

    if (!topic) {
      res.status(404).json({ success: false, message: 'Topic not found.' });
      return;
    }

    const subtopic = await prisma.courseSubtopic.findUnique({
      where: {
        topicId_slug: {
          topicId: topic.id,
          slug: subtopicSlug,
        },
      },
    });

    if (!subtopic || !subtopic.isPublished) {
      res.status(404).json({ success: false, message: 'Lesson not found.' });
      return;
    }

    // Determine lock status for this subtopic
    let isUnlocked = isStaff;
    let userProgress = null;

    if (userId) {
      userProgress = await prisma.userLessonProgress.findUnique({
        where: {
          userId_subtopicId: {
            userId,
            subtopicId: subtopic.id,
          },
        },
      });
      if (userProgress?.isUnlocked) {
        isUnlocked = true;
      }
    }

    // If it's the very first lesson of the entire course, it's always unlocked
    if (!isUnlocked) {
      const { flat } = await getOrderedSubtopicsForCourse(course.id);
      if (flat.length > 0 && flat[0].id === subtopic.id) {
        isUnlocked = true;
      }
    }

    if (!isUnlocked) {
      res.status(403).json({
        success: false,
        message: 'This lesson is currently locked. Complete the previous lesson and quiz (scoring >= 25%) to unlock it.',
        isLocked: true,
      });
      return;
    }

    // Sanitize quiz questions so correctAnswers are NEVER leaked to the client!
    let sanitizedQuiz = null;
    if (subtopic.hasQuiz && Array.isArray(subtopic.quizData)) {
      sanitizedQuiz = (subtopic.quizData as any[]).map((q, idx) => ({
        id: q.id || `q_${idx}`,
        questionText: q.questionText,
        type: q.type || 'MCQ', // 'MCQ' | 'MMQ' | 'CODE_OUTPUT'
        codeSnippet: q.codeSnippet || null,
        options: q.options || [],
        // Notice: correctAnswers is deliberately omitted for security!
      }));
    }

    // Find previous and next subtopics in sequence
    const { flat, topics } = await getOrderedSubtopicsForCourse(course.id);
    const currentIndex = flat.findIndex((item) => item.id === subtopic.id);
    const previousSubtopic = currentIndex > 0 ? flat[currentIndex - 1] : null;
    const nextSubtopic = currentIndex >= 0 && currentIndex + 1 < flat.length ? flat[currentIndex + 1] : null;

    // Helper to find topic slug for previous and next
    const findTopicSlug = (tId: string) => {
      const found = topics.find((t) => t.id === tId);
      return found ? found.slug : '';
    };

    // Update last accessed subtopic in enrollment
    if (userId) {
      await prisma.userCourseEnrollment.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id,
          },
        },
        create: {
          userId,
          courseId: course.id,
          lastAccessedSubtopicId: subtopic.id,
        },
        update: {
          lastAccessedSubtopicId: subtopic.id,
        },
      });
    }

    res.json({
      success: true,
      data: {
        course: { id: course.id, title: course.title, slug: course.slug },
        topic: { id: topic.id, title: topic.title, slug: topic.slug },
        subtopic: {
          id: subtopic.id,
          title: subtopic.title,
          slug: subtopic.slug,
          order: subtopic.order,
          content: subtopic.content,
          attachments: subtopic.attachments,
          codingQuestions: subtopic.codingQuestions || [],
          hasQuiz: subtopic.hasQuiz,
          quizPassingScore: subtopic.quizPassingScore || 25,
          quiz: sanitizedQuiz,
          createdAt: subtopic.createdAt,
          updatedAt: subtopic.updatedAt,
        },
        userProgress: userProgress
          ? {
              isCompleted: userProgress.isCompleted,
              quizAttempts: userProgress.quizAttempts,
              quizScore: userProgress.quizScore,
              quizPassed: userProgress.quizPassed,
              completedAt: userProgress.completedAt,
            }
          : {
              isCompleted: false,
              quizAttempts: 0,
              quizScore: null,
              quizPassed: false,
              completedAt: null,
            },
        navigation: {
          previous: previousSubtopic
            ? {
                title: previousSubtopic.title,
                slug: previousSubtopic.slug,
                topicSlug: findTopicSlug(previousSubtopic.topicId),
              }
            : null,
          next: nextSubtopic
            ? {
                title: nextSubtopic.title,
                slug: nextSubtopic.slug,
                topicSlug: findTopicSlug(nextSubtopic.topicId),
              }
            : null,
        },
      },
    });
  } catch (error: any) {
    console.error('Failed to get subtopic detail:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve lesson content.' });
  }
}

/**
 * Submit Quiz & Evaluate Score (Threshold: >= 25% unlocks next topic/section)
 */
export async function submitQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const subtopicId = req.params.subtopicId as string;
    const { answers } = req.body; // Map of questionId or index -> number | number[]
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required to submit quiz.' });
      return;
    }

    const subtopic: any = await prisma.courseSubtopic.findUnique({
      where: { id: subtopicId },
      include: {
        topic: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!subtopic || !subtopic.hasQuiz || !Array.isArray(subtopic.quizData)) {
      res.status(400).json({ success: false, message: 'No quiz available for this lesson.' });
      return;
    }

    const questions = subtopic.quizData as any[];
    if (questions.length === 0) {
      res.status(400).json({ success: false, message: 'Quiz has no questions configured.' });
      return;
    }

    let correctCount = 0;
    const detailedFeedback: Record<string, { isCorrect: boolean; correctAnswers: number[]; explanation: string }> = {};

    questions.forEach((q, idx) => {
      const qKey = q.id || `q_${idx}`;
      const userAns = answers ? answers[qKey] ?? answers[idx] : undefined;
      const correctAnswers: number[] = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];

      let isCorrect = false;

      if (q.type === 'MMQ') {
        // Multiple Select (Checkbox)
        const userArr = Array.isArray(userAns) ? userAns : [];
        if (
          userArr.length === correctAnswers.length &&
          userArr.every((val: number) => correctAnswers.includes(val))
        ) {
          isCorrect = true;
        }
      } else {
        // Single Select (MCQ or CODE_OUTPUT)
        if (typeof userAns === 'number' && correctAnswers.includes(userAns)) {
          isCorrect = true;
        }
      }

      if (isCorrect) correctCount++;

      detailedFeedback[qKey] = {
        isCorrect,
        correctAnswers,
        explanation: q.explanation || 'Reviewed against curriculum answer key.',
      };
    });

    const totalQuestions = questions.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const passingThreshold = subtopic.quizPassingScore || 25; // 25% minimum per user requirement
    const passed = scorePercent >= passingThreshold;

    // Find next subtopic in sequence if passed
    let nextSubtopicInfo: { id: string; title: string; slug: string; topicSlug: string } | null = null;

    if (passed) {
      const { flat, topics } = await getOrderedSubtopicsForCourse(subtopic.topic.courseId);
      const currentIndex = flat.findIndex((item) => item.id === subtopic.id);

      if (currentIndex >= 0 && currentIndex + 1 < flat.length) {
        const next = flat[currentIndex + 1];
        const nextTopic = topics.find((t) => t.id === next.topicId);

        nextSubtopicInfo = {
          id: next.id,
          title: next.title,
          slug: next.slug,
          topicSlug: nextTopic ? nextTopic.slug : '',
        };

        // Unlock next subtopic in DB
        await prisma.userLessonProgress.upsert({
          where: {
            userId_subtopicId: {
              userId,
              subtopicId: next.id,
            },
          },
          create: {
            userId,
            subtopicId: next.id,
            isUnlocked: true,
          },
          update: {
            isUnlocked: true,
          },
        });
      }
    }

    // Upsert current lesson progress
    const updatedProgress = await prisma.userLessonProgress.upsert({
      where: {
        userId_subtopicId: {
          userId,
          subtopicId: subtopic.id,
        },
      },
      create: {
        userId,
        subtopicId: subtopic.id,
        isUnlocked: true,
        isCompleted: passed,
        quizAttempts: 1,
        quizScore: scorePercent,
        quizPassed: passed,
        completedAt: passed ? new Date() : null,
      },
      update: {
        isCompleted: passed ? true : undefined,
        quizAttempts: { increment: 1 },
        quizScore: scorePercent,
        quizPassed: passed,
        completedAt: passed ? new Date() : undefined,
      },
    });

    // Update overall course enrollment metrics
    const allCourseSubtopics = await prisma.courseSubtopic.findMany({
      where: { topic: { courseId: subtopic.topic.courseId }, isPublished: true },
      select: { id: true },
    });

    const userCompletedCount = await prisma.userLessonProgress.count({
      where: {
        userId,
        subtopic: { topic: { courseId: subtopic.topic.courseId } },
        isCompleted: true,
      },
    });

    const totalCourseLessons = allCourseSubtopics.length;
    const progressPercent = totalCourseLessons > 0 ? (userCompletedCount / totalCourseLessons) * 100 : 0;

    await prisma.userCourseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: subtopic.topic.courseId,
        },
      },
      create: {
        userId,
        courseId: subtopic.topic.courseId,
        completedLessonsCount: userCompletedCount,
        totalLessonsCount: totalCourseLessons,
        progressPercent,
        lastAccessedSubtopicId: subtopic.id,
      },
      update: {
        completedLessonsCount: userCompletedCount,
        totalLessonsCount: totalCourseLessons,
        progressPercent,
        lastAccessedSubtopicId: subtopic.id,
      },
    });

    res.json({
      success: true,
      data: {
        passed,
        scorePercent,
        passingThreshold,
        correctCount,
        totalQuestions,
        quizAttempts: updatedProgress.quizAttempts,
        detailedFeedback,
        nextUnlockedLesson: nextSubtopicInfo,
      },
    });
  } catch (error: any) {
    console.error('Failed to submit quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate quiz submission.' });
  }
}

/**
 * Mark lesson complete when no quiz is present (or already passed) & unlock next topic/section
 */
export async function markLessonComplete(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const subtopicId = req.params.subtopicId as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required to complete lesson.' });
      return;
    }

    const subtopic: any = await prisma.courseSubtopic.findUnique({
      where: { id: subtopicId },
      include: {
        topic: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!subtopic) {
      res.status(404).json({ success: false, message: 'Lesson not found.' });
      return;
    }

    // If lesson has a mandatory quiz and user hasn't passed it yet, block manual completion
    if (subtopic.hasQuiz) {
      const existing = await prisma.userLessonProgress.findUnique({
        where: {
          userId_subtopicId: {
            userId,
            subtopicId: subtopic.id,
          },
        },
      });

      if (!existing || !existing.quizPassed) {
        res.status(400).json({
          success: false,
          message: 'This section requires passing the interactive quiz (score >= 25%) before it can be completed.',
        });
        return;
      }
    }

    // Mark current lesson as completed
    await prisma.userLessonProgress.upsert({
      where: {
        userId_subtopicId: {
          userId,
          subtopicId: subtopic.id,
        },
      },
      create: {
        userId,
        subtopicId: subtopic.id,
        isUnlocked: true,
        isCompleted: true,
        completedAt: new Date(),
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // Find and unlock next subtopic
    const { flat, topics } = await getOrderedSubtopicsForCourse(subtopic.topic.courseId);
    const currentIndex = flat.findIndex((item) => item.id === subtopic.id);
    let nextSubtopicInfo: { id: string; title: string; slug: string; topicSlug: string } | null = null;

    if (currentIndex >= 0 && currentIndex + 1 < flat.length) {
      const next = flat[currentIndex + 1];
      const nextTopic = topics.find((t) => t.id === next.topicId);

      nextSubtopicInfo = {
        id: next.id,
        title: next.title,
        slug: next.slug,
        topicSlug: nextTopic ? nextTopic.slug : '',
      };

      await prisma.userLessonProgress.upsert({
        where: {
          userId_subtopicId: {
            userId,
            subtopicId: next.id,
          },
        },
        create: {
          userId,
          subtopicId: next.id,
          isUnlocked: true,
        },
        update: {
          isUnlocked: true,
        },
      });
    }

    // Update enrollment progress
    const allCourseSubtopics = await prisma.courseSubtopic.findMany({
      where: { topic: { courseId: subtopic.topic.courseId }, isPublished: true },
      select: { id: true },
    });

    const userCompletedCount = await prisma.userLessonProgress.count({
      where: {
        userId,
        subtopic: { topic: { courseId: subtopic.topic.courseId } },
        isCompleted: true,
      },
    });

    const totalCourseLessons = allCourseSubtopics.length;
    const progressPercent = totalCourseLessons > 0 ? (userCompletedCount / totalCourseLessons) * 100 : 0;

    await prisma.userCourseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: subtopic.topic.courseId,
        },
      },
      create: {
        userId,
        courseId: subtopic.topic.courseId,
        completedLessonsCount: userCompletedCount,
        totalLessonsCount: totalCourseLessons,
        progressPercent,
        lastAccessedSubtopicId: subtopic.id,
      },
      update: {
        completedLessonsCount: userCompletedCount,
        totalLessonsCount: totalCourseLessons,
        progressPercent,
        lastAccessedSubtopicId: subtopic.id,
      },
    });

    res.json({
      success: true,
      data: {
        completed: true,
        nextUnlockedLesson: nextSubtopicInfo,
      },
    });
  } catch (error: any) {
    console.error('Failed to mark lesson complete:', error);
    res.status(500).json({ success: false, message: 'Failed to update lesson completion.' });
  }
}

// ==============================================================================
// ADMIN & CONTRIBUTOR MANAGEMENT CONTROLLERS
// ==============================================================================

/**
 * Create a new Course (Admin or Contributor)
 */
export async function createCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, description, category, bannerImage, level } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!title || !description) {
      res.status(400).json({ success: false, message: 'Title and description are required.' });
      return;
    }

    let slug = slugify(title);
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const count = await prisma.course.count();

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        category: category || 'Programming Languages',
        bannerImage: bannerImage || null,
        level: level || 'BEGINNER',
        order: count,
        authorId: userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: { course },
    });
  } catch (error: any) {
    console.error('Failed to create course:', error);
    res.status(500).json({ success: false, message: 'Failed to create course.' });
  }
}

/**
 * Update Course
 */
export async function updateCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { title, description, category, bannerImage, level, isPublished, order } = req.body;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    if (!isAdmin && course.authorId !== userId) {
      res.status(403).json({ success: false, message: 'Permission denied.' });
      return;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        title: title ?? course.title,
        description: description ?? course.description,
        category: category ?? course.category,
        bannerImage: bannerImage !== undefined ? bannerImage : course.bannerImage,
        level: level ?? course.level,
        isPublished: isPublished !== undefined ? isPublished : course.isPublished,
        order: order !== undefined ? order : course.order,
      },
    });

    res.json({
      success: true,
      message: 'Course updated successfully.',
      data: { course: updated },
    });
  } catch (error: any) {
    console.error('Failed to update course:', error);
    res.status(500).json({ success: false, message: 'Failed to update course.' });
  }
}

/**
 * Delete Course (Admin or Author)
 */
export async function deleteCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    if (!isAdmin && course.authorId !== userId) {
      res.status(403).json({ success: false, message: 'Permission denied.' });
      return;
    }

    await prisma.course.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Course deleted successfully.',
    });
  } catch (error: any) {
    console.error('Failed to delete course:', error);
    res.status(500).json({ success: false, message: 'Failed to delete course.' });
  }
}

/**
 * Create a Topic inside a Course
 */
export async function createTopic(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const courseId = req.params.courseId as string;
    const { title, description } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Topic title is required.' });
      return;
    }

    let slug = slugify(title);
    const existing = await prisma.courseTopic.findUnique({
      where: { courseId_slug: { courseId, slug } },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const orderCount = await prisma.courseTopic.count({ where: { courseId } });

    const topic = await prisma.courseTopic.create({
      data: {
        courseId,
        title,
        slug,
        description: description || null,
        order: orderCount,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Topic created successfully.',
      data: { topic },
    });
  } catch (error: any) {
    console.error('Failed to create topic:', error);
    res.status(500).json({ success: false, message: 'Failed to create topic.' });
  }
}

/**
 * Update Topic
 */
export async function updateTopic(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const topicId = req.params.topicId as string;
    const { title, description, order } = req.body;

    const topic = await prisma.courseTopic.findUnique({ where: { id: topicId } });
    if (!topic) {
      res.status(404).json({ success: false, message: 'Topic not found.' });
      return;
    }

    const updated = await prisma.courseTopic.update({
      where: { id: topicId },
      data: {
        title: title ?? topic.title,
        description: description !== undefined ? description : topic.description,
        order: order !== undefined ? order : topic.order,
      },
    });

    res.json({
      success: true,
      message: 'Topic updated successfully.',
      data: { topic: updated },
    });
  } catch (error: any) {
    console.error('Failed to update topic:', error);
    res.status(500).json({ success: false, message: 'Failed to update topic.' });
  }
}

/**
 * Delete Topic
 */
export async function deleteTopic(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const topicId = req.params.topicId as string;

    await prisma.courseTopic.delete({ where: { id: topicId } });

    res.json({
      success: true,
      message: 'Topic deleted successfully.',
    });
  } catch (error: any) {
    console.error('Failed to delete topic:', error);
    res.status(500).json({ success: false, message: 'Failed to delete topic.' });
  }
}

/**
 * Create a Subtopic inside a Topic (Readme content, photo attachments, coding questions, quiz)
 */
export async function createSubtopic(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const topicId = req.params.topicId as string;
    const {
      title,
      content,
      attachments,
      hasQuiz,
      quizPassingScore,
      quizData,
      codingQuestions,
    } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Subtopic title is required.' });
      return;
    }

    let slug = slugify(title);
    const existing = await prisma.courseSubtopic.findUnique({
      where: { topicId_slug: { topicId, slug } },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const orderCount = await prisma.courseSubtopic.count({ where: { topicId } });

    const subtopic = await prisma.courseSubtopic.create({
      data: {
        topicId,
        title,
        slug,
        order: orderCount,
        content: content || '# ' + title + '\n\nAdd lesson markdown content here.',
        attachments: Array.isArray(attachments) ? attachments : [],
        hasQuiz: Boolean(hasQuiz),
        quizPassingScore: typeof quizPassingScore === 'number' ? quizPassingScore : 25,
        quizData: quizData || [],
        codingQuestions: codingQuestions || [],
      },
    });

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully.',
      data: { subtopic },
    });
  } catch (error: any) {
    console.error('Failed to create subtopic:', error);
    res.status(500).json({ success: false, message: 'Failed to create lesson.' });
  }
}

/**
 * Update Subtopic
 */
export async function updateSubtopic(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const subtopicId = req.params.subtopicId as string;
    const {
      title,
      content,
      attachments,
      hasQuiz,
      quizPassingScore,
      quizData,
      codingQuestions,
      order,
      isPublished,
    } = req.body;

    const subtopic = await prisma.courseSubtopic.findUnique({ where: { id: subtopicId } });
    if (!subtopic) {
      res.status(404).json({ success: false, message: 'Lesson not found.' });
      return;
    }

    const updated = await prisma.courseSubtopic.update({
      where: { id: subtopicId },
      data: {
        title: title ?? subtopic.title,
        content: content !== undefined ? content : subtopic.content,
        attachments: Array.isArray(attachments) ? attachments : subtopic.attachments,
        hasQuiz: hasQuiz !== undefined ? Boolean(hasQuiz) : subtopic.hasQuiz,
        quizPassingScore: typeof quizPassingScore === 'number' ? quizPassingScore : subtopic.quizPassingScore,
        quizData: quizData !== undefined ? quizData : subtopic.quizData,
        codingQuestions: codingQuestions !== undefined ? codingQuestions : subtopic.codingQuestions,
        order: order !== undefined ? order : subtopic.order,
        isPublished: isPublished !== undefined ? isPublished : subtopic.isPublished,
      },
    });

    res.json({
      success: true,
      message: 'Lesson updated successfully.',
      data: { subtopic: updated },
    });
  } catch (error: any) {
    console.error('Failed to update subtopic:', error);
    res.status(500).json({ success: false, message: 'Failed to update lesson.' });
  }
}

/**
 * Delete Subtopic
 */
export async function deleteSubtopic(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const subtopicId = req.params.subtopicId as string;

    await prisma.courseSubtopic.delete({ where: { id: subtopicId } });

    res.json({
      success: true,
      message: 'Lesson deleted successfully.',
    });
  } catch (error: any) {
    console.error('Failed to delete subtopic:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lesson.' });
  }
}

/**
 * Admin / Contributor: Get Course Student Telemetry & Monitoring Metrics
 */
export async function getCourseTelemetry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const courseId = req.params.courseId as string;

    const course: any = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
          include: {
            subtopics: {
              select: { id: true, title: true, hasQuiz: true },
            },
          },
        },
      },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    let totalLessons = 0;
    course.topics.forEach((t: any) => (totalLessons += t.subtopics.length));

    // Get all enrollments
    const enrollments: any[] = await prisma.userCourseEnrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { progressPercent: 'desc' },
    });

    // Get all quiz attempts for lessons in this course
    const subtopicIds = course.topics.flatMap((t: any) => t.subtopics.map((st: any) => st.id));
    const allProgress = await prisma.userLessonProgress.findMany({
      where: {
        subtopicId: { in: subtopicIds },
        quizAttempts: { gt: 0 },
      },
      select: {
        userId: true,
        quizScore: true,
        quizPassed: true,
        quizAttempts: true,
      },
    });

    let totalAttempts = 0;
    let sumScore = 0;
    let scoredAttempts = 0;
    allProgress.forEach((p) => {
      totalAttempts += p.quizAttempts;
      if (typeof p.quizScore === 'number') {
        sumScore += p.quizScore;
        scoredAttempts++;
      }
    });

    const averageQuizScore = scoredAttempts > 0 ? Math.round(sumScore / scoredAttempts) : 0;
    const completedStudents = enrollments.filter((e) => e.progressPercent >= 100).length;
    const totalPassedQuizzes = allProgress.filter((p) => p.quizPassed).length;
    const averageProgressPercent =
      enrollments.length > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + (e.progressPercent || 0), 0) / enrollments.length
          )
        : 0;

    const cohortMetrics = {
      totalEnrolled: enrollments.length,
      completedStudents,
      totalQuizAttempts: totalAttempts,
      averageQuizScore,
      averageProgressPercent,
      totalPassedQuizzes,
    };

    res.json({
      success: true,
      data: {
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          category: course.category,
          totalLessons,
        },
        metrics: cohortMetrics,
        stats: cohortMetrics,
        students: enrollments.map((e) => ({
          id: e.userId,
          userId: e.userId,
          name: e.user.name,
          email: e.user.email,
          avatar: e.user.avatar,
          completedLessons: e.completedLessonsCount,
          completedLessonsCount: e.completedLessonsCount,
          totalLessons,
          totalLessonsCount: totalLessons,
          progressPercent: Math.round(e.progressPercent),
          updatedAt: e.updatedAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Failed to get course telemetry:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve telemetry.' });
  }
}
