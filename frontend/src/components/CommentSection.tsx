'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, ShieldCheck, User as UserIcon } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { optimizeImageUrl } from '../lib/image';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../lib/socket';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
}

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user, isAdmin } = useAuth();
  const { success, warning, error: toastError } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    const res = await fetchApi(`/comments/${postId}`);
    if (res.success && Array.isArray(res.data)) {
      setComments(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadComments();

    if (!postId) return;
    const socket = getSocket();
    const handleCommentUpdate = (data: { blogId: string; action: 'create' | 'delete'; comment: any }) => {
      if (data.blogId === postId) {
        if (data.action === 'create') {
          setComments((prev) => {
            if (prev.some((c) => c.id === data.comment.id)) return prev;
            return [data.comment, ...prev];
          });
        } else if (data.action === 'delete') {
          setComments((prev) => prev.filter((c) => c.id !== data.comment.id));
        }
      }
    };

    if (socket && socket.on) {
      socket.on('comment:update', handleCommentUpdate);
    }

    return () => {
      if (socket && socket.off) {
        socket.off('comment:update', handleCommentUpdate);
      }
    };
  }, [postId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || !user) return;

    // Optimistic comment insert
    const tempId = `optimistic-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setNewComment('');
    setSubmitting(true);

    try {
      const res = await fetchApi('/comments', {
        method: 'POST',
        body: JSON.stringify({ content, postId }),
      });

      if (res.success && res.data) {
        // Replace temporary optimistic comment with verified server record
        setComments((prev) => prev.map((c) => (c.id === tempId ? res.data : c)));
        success('Comment posted to discussion!');
      } else {
        // Rollback
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        setNewComment(content);
        toastError(res.message || 'Failed to submit comment. Draft restored.');
      }
    } catch {
      // Rollback on network failure
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setNewComment(content);
      toastError('Connection error. Draft restored.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    const deletedComment = comments.find((c) => c.id === id);
    if (!deletedComment) return;

    // Optimistic UI removal
    setComments((prev) => prev.filter((c) => c.id !== id));

    let isUndone = false;
    const timer = setTimeout(async () => {
      if (!isUndone) {
        const res = await fetchApi(`/comments/${id}`, { method: 'DELETE' });
        if (!res.success) {
          // Rollback if server rejects delete
          setComments((prev) => [deletedComment, ...prev]);
          toastError(res.message || 'Failed to delete comment on server.');
        }
      }
    }, 5000);

    // Provide immediate non-blocking "Undo" safety net
    warning('Comment removed from discussion', {
      durationMs: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          isUndone = true;
          clearTimeout(timer);
          setComments((prev) => [deletedComment, ...prev]);
          success('Comment restored.');
        },
      },
    });
  };

  return (
    <section className="mt-14 pt-10 border-t border-white/10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <MessageSquare className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          Developer Discussion ({comments.length})
        </h2>
      </div>

      {/* Comment Input Box */}
      {user ? (
        <form onSubmit={handlePostComment} className="mb-10 glass-card p-5 rounded-2xl border border-white/10">
          {/* Anti-Bot Honeypot Trap */}
          <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
            <label htmlFor="comment_website_trap">Website</label>
            <input
              id="comment_website_trap"
              type="text"
              name="website_trap"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-3 mb-3">
            <img
              src={
                optimizeImageUrl(user.avatar, { width: 80, height: 80, crop: 'fill' }) ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
              }
              alt={user.name}
              className="w-8 h-8 rounded-full border border-white/20"
            />
            <span className="text-sm font-semibold text-gray-200">{user.name}</span>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts, architectural considerations, or questions..."
            rows={3}
            required
            className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-gray-500 focus:outline-none mb-3 resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-10 p-6 glass-card rounded-2xl text-center border border-white/10">
          <p className="text-gray-300 text-sm mb-3">
            Join the conversation with other software engineers.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            Sign In to Comment
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading discussions...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 glass-card rounded-2xl text-gray-400 text-sm">
            No comments yet. Be the first developer to share your insight!
          </div>
        ) : (
          comments.map((comment) => {
            const canDelete = user && (user.id === comment.author.id || isAdmin);
            return (
              <div
                key={comment.id}
                className="glass-card p-5 rounded-2xl border border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        optimizeImageUrl(comment.author.avatar, { width: 80, height: 80, crop: 'fill' }) ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(comment.author.name)}`
                      }
                      alt={comment.author.name}
                      className="w-8 h-8 rounded-full border border-white/15"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {comment.author.name}
                        </span>
                        {comment.author.role === 'ADMIN' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      title="Delete comment"
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-gray-300 text-sm leading-relaxed pl-11">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
