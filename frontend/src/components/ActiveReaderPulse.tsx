'use client';

import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { getSocket, joinBlogRoom, leaveBlogRoom } from '../lib/socket';
import { fetchApi } from '../lib/api';

interface ActiveReaderPulseProps {
  blogId: string;
  initialCount?: number;
}

export default function ActiveReaderPulse({ blogId, initialCount = 1 }: ActiveReaderPulseProps) {
  const [activeReaders, setActiveReaders] = useState<number>(initialCount);

  useEffect(() => {
    if (!blogId) return;

    // Join real-time WebSocket room
    joinBlogRoom(blogId);

    const socket = getSocket();

    const handleReadersUpdate = (data: { blogId: string; count: number }) => {
      if (data.blogId === blogId) {
        setActiveReaders(data.count);
      }
    };

    if (socket && socket.on) {
      socket.on('readers:update', handleReadersUpdate);
    }

    // Gentle fallback HTTP ping to seed anonymous session reader ID
    let readerId = sessionStorage.getItem('cc_reader_id');
    if (!readerId) {
      readerId = `reader_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      sessionStorage.setItem('cc_reader_id', readerId);
    }

    fetchApi('/readers/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ blogId, readerId }),
    }).then((res) => {
      if (res.success && res.data?.activeReaders) {
        setActiveReaders((prev) => Math.max(prev, res.data.activeReaders));
      }
    }).catch(() => {});

    return () => {
      leaveBlogRoom(blogId);
      if (socket && socket.off) {
        socket.off('readers:update', handleReadersUpdate);
      }
    };
  }, [blogId]);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-emerald-500/10">
      <div className="relative flex items-center justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-beacon" />
      </div>
      <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
      <span>
        <strong className="text-white font-mono text-sm">{activeReaders}</strong>{' '}
        {activeReaders === 1 ? 'developer reading live' : 'developers reading live'}
      </span>
    </div>
  );
}
