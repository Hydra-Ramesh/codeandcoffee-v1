'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ThumbsUp, ThumbsDown, MessageSquare, Flame, Sparkles } from 'lucide-react';

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

export default function BlogCard({ blog, featured = false }: BlogCardProps) {
  const activeCount = blog.activeReaders || 0;
  const likes = blog.likesCount || 0;
  const dislikes = blog.dislikesCount || 0;
  const comments = blog.commentsCount || 0;

  return (
    <article
      className={`group relative rounded-2xl overflow-hidden glass-card glass-card-hover flex flex-col justify-between ${
        featured ? 'md:grid md:grid-cols-12 md:gap-8 p-6 md:p-8' : 'p-5'
      }`}
    >
      {/* Top Banner Image */}
      <div
        className={`relative overflow-hidden rounded-xl bg-slate-900 border border-white/10 ${
          featured ? 'md:col-span-7 h-64 md:h-80' : 'h-48 w-full mb-4'
        }`}
      >
        <img
          src={
            blog.bannerImage ||
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
      </div>

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
          <Link href={`/blogs/${blog.slug}`}>
            <h3
              className={`font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 ${
                featured ? 'text-2xl md:text-3xl mb-3' : 'text-lg mb-2'
              }`}
            >
              {blog.title}
            </h3>
          </Link>

          {/* Excerpt */}
          <p className="text-gray-400 text-sm line-clamp-3 mb-4 leading-relaxed">
            {blog.excerpt}
          </p>
        </div>

        {/* Footer: Author & Interaction Telemetry */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={
                blog.author?.avatar ||
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
