'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Bookmark,
  Sparkles,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import MarkdownViewer from '../../../components/MarkdownViewer';
import ActiveReaderPulse from '../../../components/ActiveReaderPulse';
import LikeDislikeBar from '../../../components/LikeDislikeBar';
import CommentSection from '../../../components/CommentSection';

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadBlog();
    }
  }, [slug]);

  const loadBlog = async () => {
    setLoading(true);
    const res = await fetchApi(`/blogs/${slug}`);
    if (res.success && res.data) {
      setBlog(res.data);
    } else {
      setError(res.message || 'Article not found');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded-lg" />
        <div className="h-12 w-3/4 bg-slate-800 rounded-xl" />
        <div className="h-96 w-full bg-slate-800 rounded-2xl" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-800 rounded w-5/6" />
          <div className="h-4 bg-slate-800 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center glass-card p-8 rounded-3xl">
        <h2 className="text-2xl font-bold text-white mb-2">Article Not Found</h2>
        <p className="text-gray-400 mb-6">{error || "The requested blog post doesn't exist or was removed."}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Articles
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            {blog.category}
          </span>
        </div>
      </div>

      {/* Main Header */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.2]">
          {blog.title}
        </h1>

        <p className="text-gray-300 text-lg leading-relaxed">
          {blog.excerpt}
        </p>

        {/* Author & Telemetry Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={blog.author?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(blog.author?.name)}`}
              alt={blog.author?.name}
              className="w-11 h-11 rounded-full border-2 border-amber-500/40 bg-slate-900"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{blog.author?.name}</span>
                {blog.author?.role === 'ADMIN' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Author
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(blog.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {blog.readingTime} min read
                </span>
              </div>
            </div>
          </div>

          {/* Real-Time Active Readers Pulse (Redis Heartbeat) */}
          <ActiveReaderPulse blogId={blog.id} initialCount={blog.activeReaders || 1} />
        </div>
      </div>

      {/* High-Resolution Banner Image */}
      {blog.bannerImage && (
        <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl">
          <img
            src={blog.bannerImage}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Interactive Like & Dislike Reaction Bar */}
      <LikeDislikeBar
        blogId={blog.id}
        initialLikes={blog.likesCount || 0}
        initialDislikes={blog.dislikesCount || 0}
        initialUserLiked={blog.userLiked}
        initialUserDisliked={blog.userDisliked}
      />

      {/* Formatted Markdown Content Body */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-white/10 shadow-xl">
        <MarkdownViewer content={blog.content} />
      </div>

      {/* Tags List */}
      {Array.isArray(blog.tags) && blog.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <span className="text-xs text-gray-400 mr-1">Tags:</span>
          {blog.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-lg text-xs font-medium glass-card border border-white/10 text-gray-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Author Bio Card */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <img
          src={blog.author?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(blog.author?.name)}`}
          alt={blog.author?.name}
          className="w-16 h-16 rounded-full border-2 border-amber-500/50 bg-slate-900"
        />
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h3 className="text-base font-bold text-white">{blog.author?.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Staff Architect
            </span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
            {blog.author?.bio || 'Passionate software engineer writing on distributed systems, high-scale database caching, and clean code principles.'}
          </p>
        </div>
      </div>

      {/* Interactive Developer Comments Section */}
      <CommentSection postId={blog.id} />
    </article>
  );
}
