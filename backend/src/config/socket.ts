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
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        config.clientUrl,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
      ],
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

      // Track in Redis for multi-instance / persistence
      try {
        await redisClient.sadd(`blog:readers:${blogId}`, socket.id);
      } catch (err) {
        // Fallback to in-memory
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

      try {
        await redisClient.srem(`blog:readers:${blogId}`, socket.id);
      } catch (err) {}

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
          try {
            await redisClient.srem(`blog:readers:${blogId}`, socket.id);
          } catch (err) {}

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
