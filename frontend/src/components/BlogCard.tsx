'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ThumbsUp, ThumbsDown, MessageSquare, Flame, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { optimizeImageUrl } from '../lib/image';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bannerImage?: string;
  category: string;
  tags?: string[];
  readingTime: number;
  views: number;
  activeReaders?: number;
  likesCount?: number;
  dislikesCount?: number;
  commentsCount?: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
}

interface BlogCardProps {
  blog: BlogPost;
  featured?: boolean;
}

function BlogCardComponent({ blog, featured = false }: BlogCardProps) {
  const { user } = useAuth();
  const activeCount = blog.activeReaders || 0;
  const likes = blog.likesCount || 0;
  const dislikes = blog.dislikesCount || 0;
  const comments = blog.commentsCount || 0;

  const targetUrl = user
    ? `/blogs/${blog.slug}`
    : `/auth/login?redirect=${encodeURIComponent(`/blogs/${blog.slug}`)}`;

  return (
    <article
      className={`group relative rounded-2xl overflow-hidden glass-card glass-card-hover flex flex-col justify-between ${
        featured ? 'md:grid md:grid-cols-12 md:gap-8 p-6 md:p-8' : 'p-5'
      }`}
    >
      {/* Top Banner Image */}
      <Link
        href={targetUrl}
        className={`relative block overflow-hidden rounded-xl bg-slate-900 border border-white/10 cursor-pointer ${
          featured ? 'md:col-span-7 h-64 md:h-80' : 'h-48 w-full mb-4'
        }`}
      >
        <img
          src={
            optimizeImageUrl(blog.bannerImage, { width: featured ? 1000 : 600 }) ||
            'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'
          }
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 backdrop-blur-md border border-amber-500/30">
            {blog.category}
          </span>
          {featured && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 backdrop-blur-md border border-purple-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
        </div>

        {/* Real-Time Active Readers Pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-950/70 text-emerald-400 backdrop-blur-md border border-emerald-500/30 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-beacon" />
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>{activeCount > 0 ? `${activeCount} live` : 'Active'}</span>
        </div>
      </Link>

      {/* Content Section */}
      <div className={`flex flex-col flex-1 justify-between ${featured ? 'md:col-span-5' : ''}`}>
        <div>
          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-2.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {blog.readingTime} min read
            </span>
            <span>•</span>
            <span>
              {new Date(blog.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Title */}
          <Link href={targetUrl}>
            <h3
              className={`font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 ${
                featured ? 'text-2xl md:text-3xl mb-3' : 'text-lg mb-2'
              }`}
            >
              {blog.title}
            </h3>
          </Link>

          {/* Excerpt */}
          <p className="text-gray-400 text-sm line-clamp-3 mb-3 leading-relaxed">
            {blog.excerpt}
          </p>

          {/* Read Full Article Action Link */}
          <div className="mb-4">
            <Link
              href={targetUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors group/read"
            >
              <span>Read Full Article</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/read:translate-x-1 transition-transform" />
              {!user && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-400" /> Sign In Required
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Footer: Author & Interaction Telemetry */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={
                optimizeImageUrl(blog.author?.avatar, { width: 100, height: 100, crop: 'fill' }) ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(blog.author?.name || 'Dev')}`
              }
              alt={blog.author?.name}
              className="w-7 h-7 rounded-full border border-white/20 bg-slate-800"
            />
            <span className="text-xs font-medium text-gray-300">
              {blog.author?.name}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1 text-gray-300 hover:text-amber-400">
              <ThumbsUp className="w-3.5 h-3.5" />
              {likes}
            </span>
            {dislikes > 0 && (
              <span className="flex items-center gap-1 text-gray-400">
                <ThumbsDown className="w-3.5 h-3.5" />
                {dislikes}
              </span>
            )}
            <span className="flex items-center gap-1 text-gray-400">
              <MessageSquare className="w-3.5 h-3.5" />
              {comments}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default React.memo(BlogCardComponent, (prev, next) => {
  return (
    prev.blog.id === next.blog.id &&
    prev.blog.views === next.blog.views &&
    prev.blog.likesCount === next.blog.likesCount &&
    prev.blog.dislikesCount === next.blog.dislikesCount &&
    prev.blog.commentsCount === next.blog.commentsCount &&
    prev.blog.activeReaders === next.blog.activeReaders &&
    prev.featured === next.featured
  );
});
