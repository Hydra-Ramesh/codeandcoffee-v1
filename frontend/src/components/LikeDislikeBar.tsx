'use client';

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Check, LogIn } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../lib/socket';
import Link from 'next/link';

interface LikeDislikeBarProps {
  blogId: string;
  initialLikes?: number;
  initialDislikes?: number;
  initialUserLiked?: boolean;
  initialUserDisliked?: boolean;
}

export default function LikeDislikeBar({
  blogId,
  initialLikes = 0,
  initialDislikes = 0,
  initialUserLiked = false,
  initialUserDisliked = false,
}: LikeDislikeBarProps) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userLiked, setUserLiked] = useState(initialUserLiked);
  const [userDisliked, setUserDisliked] = useState(initialUserDisliked);
  const [copied, setCopied] = useState(false);
  const [showAuthNotice, setShowAuthNotice] = useState(false);

  useEffect(() => {
    if (!blogId) return;

    const socket = getSocket();
    const handleReactionUpdate = (data: { blogId: string; likesCount: number; dislikesCount: number }) => {
      if (data.blogId === blogId) {
        setLikes(data.likesCount);
        setDislikes(data.dislikesCount);
      }
    };

    if (socket && socket.on) {
      socket.on('reaction:update', handleReactionUpdate);
    }

    return () => {
      if (socket && socket.off) {
        socket.off('reaction:update', handleReactionUpdate);
      }
    };
  }, [blogId]);

  const handleLike = async () => {
    if (!user) {
      setShowAuthNotice(true);
      setTimeout(() => setShowAuthNotice(false), 4000);
      return;
    }

    // Save snapshot for optimistic rollback
    const snapshot = { likes, dislikes, userLiked, userDisliked };

    const willBeLiked = !userLiked;
    setUserLiked(willBeLiked);
    setLikes((prev) => (willBeLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (userDisliked) {
      setUserDisliked(false);
      setDislikes((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await fetchApi(`/blogs/${blogId}/like`, { method: 'POST' });
      if (res.success && res.data) {
        setLikes(res.data.likesCount);
        setDislikes(res.data.dislikesCount);
        setUserLiked(res.data.userLiked);
        setUserDisliked(res.data.userDisliked);
      } else {
        // Rollback on failure
        setLikes(snapshot.likes);
        setDislikes(snapshot.dislikes);
        setUserLiked(snapshot.userLiked);
        setUserDisliked(snapshot.userDisliked);
        toastError(res.message || 'Could not record reaction. Reverted.');
      }
    } catch {
      // Rollback on network exception
      setLikes(snapshot.likes);
      setDislikes(snapshot.dislikes);
      setUserLiked(snapshot.userLiked);
      setUserDisliked(snapshot.userDisliked);
      toastError('Connection error. Reaction reverted.');
    }
  };

  const handleDislike = async () => {
    if (!user) {
      setShowAuthNotice(true);
      setTimeout(() => setShowAuthNotice(false), 4000);
      return;
    }

    // Save snapshot for optimistic rollback
    const snapshot = { likes, dislikes, userLiked, userDisliked };

    const willBeDisliked = !userDisliked;
    setUserDisliked(willBeDisliked);
    setDislikes((prev) => (willBeDisliked ? prev + 1 : Math.max(0, prev - 1)));

    if (userLiked) {
      setUserLiked(false);
      setLikes((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await fetchApi(`/blogs/${blogId}/dislike`, { method: 'POST' });
      if (res.success && res.data) {
        setLikes(res.data.likesCount);
        setDislikes(res.data.dislikesCount);
        setUserLiked(res.data.userLiked);
        setUserDisliked(res.data.userDisliked);
      } else {
        // Rollback on failure
        setLikes(snapshot.likes);
        setDislikes(snapshot.dislikes);
        setUserLiked(snapshot.userLiked);
        setUserDisliked(snapshot.userDisliked);
        toastError(res.message || 'Could not record reaction. Reverted.');
      }
    } catch {
      // Rollback on network exception
      setLikes(snapshot.likes);
      setDislikes(snapshot.dislikes);
      setUserLiked(snapshot.userLiked);
      setUserDisliked(snapshot.userDisliked);
      toastError('Connection error. Reaction reverted.');
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      success('Article link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="relative py-6 my-8 border-y border-white/10 flex flex-wrap items-center justify-between gap-4">
      {/* Reaction buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
            userLiked
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400'
              : 'glass-card hover:bg-white/10 text-gray-200 hover:text-amber-400'
          }`}
          title={user ? 'Like this article' : 'Sign in to like'}
        >
          <ThumbsUp className={`w-4 h-4 ${userLiked ? 'fill-current' : ''}`} />
          <span>{likes}</span>
          <span className="hidden sm:inline text-xs font-normal opacity-80">Helpful</span>
        </button>

        <button
          onClick={handleDislike}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
            userDisliked
              ? 'bg-red-500/80 text-white shadow-lg shadow-red-500/25 ring-2 ring-red-400'
              : 'glass-card hover:bg-white/10 text-gray-400 hover:text-red-400'
          }`}
          title={user ? 'Dislike this article' : 'Sign in to dislike'}
        >
          <ThumbsDown className={`w-4 h-4 ${userDisliked ? 'fill-current' : ''}`} />
          <span>{dislikes}</span>
        </button>
      </div>

      {/* Share & Bookmark Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card hover:bg-white/10 text-gray-300 hover:text-white text-sm font-medium transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied Link!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-gray-400" />
              <span>Share Article</span>
            </>
          )}
        </button>
      </div>

      {/* Non-intrusive prompt if guest clicks reactions */}
      {showAuthNotice && (
        <div className="absolute -top-12 left-0 right-0 max-w-sm mx-auto glass-card border border-amber-500/40 p-3 rounded-xl text-xs text-amber-300 flex items-center justify-between shadow-2xl animate-fade-in z-20">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Please sign in to react to articles!</span>
          </div>
          <Link
            href="/auth/login"
            className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-semibold text-xs ml-2"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
