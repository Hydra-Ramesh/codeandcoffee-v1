'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    // Return dummy socket or null during SSR
    return {} as Socket;
  }

  if (!socket) {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    // Remove /api/v1 to get server origin (e.g. http://localhost:5000)
    const socketUrl = rawApiUrl.replace(/\/api\/v1\/?$/, '');

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 15000,
      withCredentials: true,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Code & Coffee WebSocket network:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket network:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ WebSocket connection note (falling back gracefully):', err.message);
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function joinBlogRoom(blogId: string) {
  const s = getSocket();
  if (s && s.emit) {
    s.emit('join:blog', blogId);
  }
}

export function leaveBlogRoom(blogId: string) {
  const s = getSocket();
  if (s && s.emit) {
    s.emit('leave:blog', blogId);
  }
}
