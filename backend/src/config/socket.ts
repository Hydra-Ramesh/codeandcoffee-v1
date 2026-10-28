import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from './env.js';
import { redisClient } from './redis.js';

let io: SocketIOServer | null = null;

// Track active blog readers: blogId -> Set of socket IDs
const activeBlogSockets = new Map<string, Set<string>>();
// Track which blogs a socket is currently viewing: socketId -> Set of blogIds
const socketBlogsMap = new Map<string, Set<string>>();

// Track active lesson learners: subtopicId -> Set of socket IDs
const activeLessonSockets = new Map<string, Set<string>>();
// Track which lessons a socket is currently viewing: socketId -> Set of subtopicIds
const socketLessonsMap = new Map<string, Set<string>>();

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const rawClientOrigins = config.allowedClientOrigins || [config.clientUrl];
  const staticOrigins = new Set([
    ...rawClientOrigins,
    'https://codeandcoffee.live',
    'https://www.codeandcoffee.live',
    'https://codeandcoffee-v1.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ]);

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        if (staticOrigins.has(requestOrigin)) return callback(null, true);

        try {
          const parsed = new URL(requestOrigin);
          if (
            parsed.hostname === 'codeandcoffee.live' ||
            parsed.hostname.endsWith('.codeandcoffee.live') ||
            parsed.hostname === 'codeandcoffee-v1.vercel.app' ||
            /^codeandcoffee(-[a-z0-9-]+)?\.vercel\.app$/.test(parsed.hostname) ||
            parsed.hostname.endsWith('rameshdas.online') ||
            parsed.hostname === 'localhost' ||
            parsed.hostname === '127.0.0.1'
          ) {
            return callback(null, true);
          }
        } catch {}

        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    // Increment global live visitor count
    broadcastGlobalTelemetry();

    // -------------------------------------------------------------
    // USER PERSONAL CHANNEL
    // -------------------------------------------------------------
    socket.on('join:user', (userId: string) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
    });

    socket.on('leave:user', (userId: string) => {
      if (!userId) return;
      socket.leave(`user:${userId}`);
    });

    // -------------------------------------------------------------
    // ADMIN / INSTRUCTOR CHANNEL
    // -------------------------------------------------------------
    socket.on('join:admin', () => {
      socket.join('admin:channel');
    });

    socket.on('leave:admin', () => {
      socket.leave('admin:channel');
    });

    // -------------------------------------------------------------
    // BLOG READERS
    // -------------------------------------------------------------
    socket.on('join:blog', async (blogId: string) => {
      if (!blogId) return;

      socket.join(`blog:${blogId}`);

      if (!activeBlogSockets.has(blogId)) {
        activeBlogSockets.set(blogId, new Set());
      }
      activeBlogSockets.get(blogId)!.add(socket.id);

      if (!socketBlogsMap.has(socket.id)) {
        socketBlogsMap.set(socket.id, new Set());
      }
      socketBlogsMap.get(socket.id)!.add(blogId);

      if (process.env.REDIS_CLUSTER_MODE === 'true') {
        try {
          await redisClient.sadd(`blog:readers:${blogId}`, socket.id);
        } catch (err) {}
      }

      const count = activeBlogSockets.get(blogId)?.size || 1;
      io?.to(`blog:${blogId}`).emit('readers:update', { blogId, count });
      broadcastGlobalTelemetry();
    });

    socket.on('leave:blog', async (blogId: string) => {
      if (!blogId) return;

      socket.leave(`blog:${blogId}`);

      if (activeBlogSockets.has(blogId)) {
        activeBlogSockets.get(blogId)!.delete(socket.id);
        if (activeBlogSockets.get(blogId)!.size === 0) {
          activeBlogSockets.delete(blogId);
        }
      }

      if (socketBlogsMap.has(socket.id)) {
        socketBlogsMap.get(socket.id)!.delete(blogId);
      }

      if (process.env.REDIS_CLUSTER_MODE === 'true') {
        try {
          await redisClient.srem(`blog:readers:${blogId}`, socket.id);
        } catch (err) {}
      }

      const count = activeBlogSockets.get(blogId)?.size || 0;
      io?.to(`blog:${blogId}`).emit('readers:update', { blogId, count });
      broadcastGlobalTelemetry();
    });

    // -------------------------------------------------------------
    // COURSE LESSON LEARNERS PRESENCE
    // -------------------------------------------------------------
    socket.on('join:lesson', (subtopicId: string) => {
      if (!subtopicId) return;

      socket.join(`lesson:${subtopicId}`);

      if (!activeLessonSockets.has(subtopicId)) {
        activeLessonSockets.set(subtopicId, new Set());
      }
      activeLessonSockets.get(subtopicId)!.add(socket.id);

      if (!socketLessonsMap.has(socket.id)) {
        socketLessonsMap.set(socket.id, new Set());
      }
      socketLessonsMap.get(socket.id)!.add(subtopicId);

      const count = activeLessonSockets.get(subtopicId)?.size || 1;
      io?.to(`lesson:${subtopicId}`).emit('lesson:readers:update', { subtopicId, count });
    });

    socket.on('leave:lesson', (subtopicId: string) => {
      if (!subtopicId) return;

      socket.leave(`lesson:${subtopicId}`);

      if (activeLessonSockets.has(subtopicId)) {
        activeLessonSockets.get(subtopicId)!.delete(socket.id);
        if (activeLessonSockets.get(subtopicId)!.size === 0) {
          activeLessonSockets.delete(subtopicId);
        }
      }

      if (socketLessonsMap.has(socket.id)) {
        socketLessonsMap.get(socket.id)!.delete(subtopicId);
      }

      const count = activeLessonSockets.get(subtopicId)?.size || 0;
      io?.to(`lesson:${subtopicId}`).emit('lesson:readers:update', { subtopicId, count });
    });

    // -------------------------------------------------------------
    // DISCONNECT CLEANUP
    // -------------------------------------------------------------
    socket.on('disconnect', async () => {
      // Clean up blog listeners
      const blogs = socketBlogsMap.get(socket.id);
      if (blogs) {
        for (const blogId of blogs) {
          if (activeBlogSockets.has(blogId)) {
            activeBlogSockets.get(blogId)!.delete(socket.id);
            if (activeBlogSockets.get(blogId)!.size === 0) {
              activeBlogSockets.delete(blogId);
            }
          }
          if (process.env.REDIS_CLUSTER_MODE === 'true') {
            try {
              await redisClient.srem(`blog:readers:${blogId}`, socket.id);
            } catch (err) {}
          }

          const count = activeBlogSockets.get(blogId)?.size || 0;
          io?.to(`blog:${blogId}`).emit('readers:update', { blogId, count });
        }
        socketBlogsMap.delete(socket.id);
      }

      // Clean up lesson listeners
      const lessons = socketLessonsMap.get(socket.id);
      if (lessons) {
        for (const subtopicId of lessons) {
          if (activeLessonSockets.has(subtopicId)) {
            activeLessonSockets.get(subtopicId)!.delete(socket.id);
            if (activeLessonSockets.get(subtopicId)!.size === 0) {
              activeLessonSockets.delete(subtopicId);
            }
          }
          const count = activeLessonSockets.get(subtopicId)?.size || 0;
          io?.to(`lesson:${subtopicId}`).emit('lesson:readers:update', { subtopicId, count });
        }
        socketLessonsMap.delete(socket.id);
      }

      broadcastGlobalTelemetry();
    });
  });

  console.log('⚡ Socket.io WebSocket server initialized with live reader telemetries & rooms.');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// ==============================================================================
// 1. GLOBAL & TELEMETRY BROADCASTS
// ==============================================================================

export function broadcastGlobalTelemetry() {
  if (!io) return;

  const totalConnected = io.engine?.clientsCount || 1;
  let totalBlogReaders = 0;
  for (const set of activeBlogSockets.values()) {
    totalBlogReaders += set.size;
  }

  const activeVisitors = Math.max(totalConnected, 12);
  const activeReaders = Math.max(totalBlogReaders, 4);

  io.emit('global:stats', {
    totalActiveBlogReaders: activeReaders,
    totalActiveSiteVisitors: activeVisitors,
  });
}

// ==============================================================================
// 2. BLOG & SOCIAL BROADCASTS
// ==============================================================================

export function broadcastReactionUpdate(blogId: string, data: { likesCount: number; dislikesCount: number }) {
  if (!io) return;
  io.to(`blog:${blogId}`).emit('reaction:update', {
    blogId,
    likesCount: data.likesCount,
    dislikesCount: data.dislikesCount,
  });
}

export function broadcastCommentUpdate(blogId: string, action: 'create' | 'delete', commentData: any) {
  if (!io) return;
  io.to(`blog:${blogId}`).emit('comment:update', {
    blogId,
    action,
    comment: commentData,
  });
}

export function broadcastBlogPublished(blog: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: { name: string; avatar?: string };
}) {
  if (!io) return;
  io.emit('blog:published', {
    blog,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastAdminBlogUpdated(action: 'created' | 'updated' | 'published' | 'unpublished' | 'deleted', blog: any) {
  if (!io) return;
  io.emit('admin:blog_updated', {
    action,
    blog,
    timestamp: new Date().toISOString(),
  });
}

// ==============================================================================
// 3. COURSES & LEARNING PLATFORM BROADCASTS
// ==============================================================================

export function getActiveLessonReadersCount(subtopicId: string): number {
  return activeLessonSockets.get(subtopicId)?.size || 1;
}

export function broadcastCourseTelemetry(courseId: string, payload: any) {
  if (!io) return;
  // Broadcast to admin channel and specific course room
  io.to('admin:channel').emit('course:telemetry:update', {
    courseId,
    ...payload,
    timestamp: new Date().toISOString(),
  });
  io.emit('admin:course_telemetry', {
    courseId,
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastCourseContentUpdated(courseId: string, action: string, data?: any) {
  if (!io) return;
  io.emit('course:content_updated', {
    courseId,
    action,
    data,
    timestamp: new Date().toISOString(),
  });
  io.emit('admin:course_updated', {
    action,
    courseId,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastUserLessonUnlocked(userId: string, data: { courseId: string; subtopicId: string; nextSubtopicSlug?: string }) {
  if (!io) return;
  io.to(`user:${userId}`).emit('user:progress:update', {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// ==============================================================================
// 4. PRACTICE PLATFORM BROADCASTS
// ==============================================================================

export function broadcastPracticeSolveGlobal(solveData: {
  userName: string;
  questionTitle: string;
  sheetType: string;
  difficulty: string;
  streak: number;
}) {
  if (!io) return;
  io.emit('practice:solve:global', {
    ...solveData,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastUserPracticeProgress(userId: string, progressData: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('user:practice:progress', {
    ...progressData,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastAdminPracticeUpdated(action: 'created' | 'updated' | 'deleted', question: any) {
  if (!io) return;
  io.emit('admin:practice_updated', {
    action,
    question,
    timestamp: new Date().toISOString(),
  });
  io.emit('practice:catalog_updated', {
    action,
    question,
    timestamp: new Date().toISOString(),
  });
}

// ==============================================================================
// 5. USER SECURITY & AUTH SESSION BROADCASTS
// ==============================================================================

export function broadcastUserBanned(userId: string) {
  if (!io) return;
  io.to(`user:${userId}`).emit('auth:user_banned', {
    userId,
    message: 'Your account has been suspended by an administrator.',
    timestamp: new Date().toISOString(),
  });
  io.to('admin:channel').emit('admin:user_updated', {
    userId,
    isBanned: true,
  });
}

export function broadcastSessionRevoked(sessionId: string, userId: string) {
  if (!io) return;
  io.to(`user:${userId}`).emit('auth:session_revoked', {
    sessionId,
    userId,
    message: 'This session has been revoked.',
    timestamp: new Date().toISOString(),
  });
}

export function broadcastUserRoleChanged(userId: string, role: string) {
  if (!io) return;
  io.to(`user:${userId}`).emit('auth:role_changed', {
    userId,
    role,
    timestamp: new Date().toISOString(),
  });
  io.to('admin:channel').emit('admin:user_updated', {
    userId,
    role,
  });
}

// ==============================================================================
// 6. IN-APP USER NOTIFICATIONS
// ==============================================================================

export function broadcastNotificationToUser(userId: string, notification: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', {
    notification,
    timestamp: new Date().toISOString(),
  });
}

// ==============================================================================
// 7. MULTI-ADMIN WORKFLOW BROADCASTS
// ==============================================================================

export function broadcastPendingContributorCount(pendingCount: number) {
  if (!io) return;
  io.emit('admin:contributor_count', {
    pendingCount,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastNewContributorApplication(application: any) {
  if (!io) return;
  io.emit('admin:new_application', {
    application,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastContributorApplicationUpdated(application: any) {
  if (!io) return;
  io.emit('admin:application_updated', {
    application,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastPendingInquiryCount(pendingCount: number) {
  if (!io) return;
  io.emit('admin:inquiry_count', {
    pendingCount,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastNewInquiry(inquiry: any) {
  if (!io) return;
  io.emit('admin:new_inquiry', {
    inquiry,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastInquiryUpdated(inquiry: any) {
  if (!io) return;
  io.emit('admin:inquiry_updated', {
    inquiry,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastInquiryDeleted(id: string) {
  if (!io) return;
  io.emit('admin:inquiry_deleted', {
    id,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastNewWaitlistEntry(entry: any) {
  if (!io) return;
  io.emit('admin:new_waitlist', {
    entry,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastWaitlistCount(count: number) {
  if (!io) return;
  io.emit('admin:waitlist_count', {
    count,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastWaitlistUpdated(entry: any) {
  if (!io) return;
  io.emit('admin:waitlist_updated', {
    entry,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastWaitlistDeleted(id: string) {
  if (!io) return;
  io.emit('admin:waitlist_deleted', {
    id,
    timestamp: new Date().toISOString(),
  });
}

export function getActiveBlogReadersCount(blogId: string): number {
  return activeBlogSockets.get(blogId)?.size || 1;
}

export function getGlobalActiveStats(): { totalActiveBlogReaders: number; totalActiveSiteVisitors: number } {
  const totalConnected = io?.engine?.clientsCount || 1;
  let totalBlogReaders = 0;
  for (const set of activeBlogSockets.values()) {
    totalBlogReaders += set.size;
  }
  return {
    totalActiveBlogReaders: Math.max(totalBlogReaders, 4),
    totalActiveSiteVisitors: Math.max(totalConnected, 12),
  };
}
