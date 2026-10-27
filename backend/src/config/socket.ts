import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from './env.js';
import { redisClient } from './redis.js';

let io: SocketIOServer | null = null;

// Track active blog readers: blogId -> Set of socket IDs
const activeBlogSockets = new Map<string, Set<string>>();
// Track which blogs a socket is currently viewing: socketId -> Set of blogIds
const socketBlogsMap = new Map<string, Set<string>>();

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

    // Client joins a specific blog room
    socket.on('join:blog', async (blogId: string) => {
      if (!blogId) return;

      socket.join(`blog:${blogId}`);

      // Track socket in memory
      if (!activeBlogSockets.has(blogId)) {
        activeBlogSockets.set(blogId, new Set());
      }
      activeBlogSockets.get(blogId)!.add(socket.id);

      if (!socketBlogsMap.has(socket.id)) {
        socketBlogsMap.set(socket.id, new Set());
      }
      socketBlogsMap.get(socket.id)!.add(blogId);

      // Track in Redis for multi-instance persistence (only if horizontal cluster mode is enabled)
      if (process.env.REDIS_CLUSTER_MODE === 'true') {
        try {
          await redisClient.sadd(`blog:readers:${blogId}`, socket.id);
        } catch (err) {}
      }

      const count = activeBlogSockets.get(blogId)?.size || 1;
      io?.to(`blog:${blogId}`).emit('readers:update', { blogId, count });
      broadcastGlobalTelemetry();
    });

    // Client leaves a specific blog room
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

    // Disconnect handler
    socket.on('disconnect', async () => {
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
      broadcastGlobalTelemetry();
    });
  });

  console.log('⚡ Socket.io WebSocket server initialized with live reader telemetries & rooms.');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Broadcast updated global developer presence telemetry across all clients
 */
export function broadcastGlobalTelemetry() {
  if (!io) return;

  const totalConnected = io.engine?.clientsCount || 1;
  let totalBlogReaders = 0;
  for (const set of activeBlogSockets.values()) {
    totalBlogReaders += set.size;
  }

  // Baseline minimum for presentation
  const activeVisitors = Math.max(totalConnected, 12);
  const activeReaders = Math.max(totalBlogReaders, 4);

  io.emit('global:stats', {
    totalActiveBlogReaders: activeReaders,
    totalActiveSiteVisitors: activeVisitors,
  });
}

/**
 * Broadcast real-time reaction (like/dislike) count change to everyone viewing the blog
 */
export function broadcastReactionUpdate(blogId: string, data: { likesCount: number; dislikesCount: number }) {
  if (!io) return;
  io.to(`blog:${blogId}`).emit('reaction:update', {
    blogId,
    likesCount: data.likesCount,
    dislikesCount: data.dislikesCount,
  });
}

/**
 * Broadcast new comment or comment deletion to everyone viewing the blog
 */
export function broadcastCommentUpdate(blogId: string, action: 'create' | 'delete', commentData: any) {
  if (!io) return;
  io.to(`blog:${blogId}`).emit('comment:update', {
    blogId,
    action,
    comment: commentData,
  });
}

/**
 * Broadcast new published blog notification across the entire network
 */
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

/**
 * Broadcast updated pending contributor application count to admin console
 */
export function broadcastPendingContributorCount(pendingCount: number) {
  if (!io) return;
  io.emit('admin:contributor_count', {
    pendingCount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast new contributor application submission event
 */
export function broadcastNewContributorApplication(application: any) {
  if (!io) return;
  io.emit('admin:new_application', {
    application,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast updated pending inquiry count to admin console
 */
export function broadcastPendingInquiryCount(pendingCount: number) {
  if (!io) return;
  io.emit('admin:inquiry_count', {
    pendingCount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast new inquiry submission event to admin console
 */
export function broadcastNewInquiry(inquiry: any) {
  if (!io) return;
  io.emit('admin:new_inquiry', {
    inquiry,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast new early access waitlist entry to admin console
 */
export function broadcastNewWaitlistEntry(entry: any) {
  if (!io) return;
  io.emit('admin:new_waitlist', {
    entry,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast updated waitlist count to admin console
 */
export function broadcastWaitlistCount(count: number) {
  if (!io) return;
  io.emit('admin:waitlist_count', {
    count,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Fast O(1) in-memory reader count for a blog post
 */
export function getActiveBlogReadersCount(blogId: string): number {
  return activeBlogSockets.get(blogId)?.size || 1;
}

/**
 * Fast O(1) in-memory telemetry stats for global platforms
 */
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
