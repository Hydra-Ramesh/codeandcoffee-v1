'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Flame,
  Coffee,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import BlogCard, { BlogPost } from '../components/BlogCard';
import BlogCardSkeleton from '../components/BlogCardSkeleton';
import { fetchApi } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useDebounce } from '../hooks/useDebounce';

export default function HomePage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const debouncedSearch = useDebounce(search, 250);
  const [globalStats, setGlobalStats] = useState({
    totalActiveBlogReaders: 14,
    totalActiveSiteVisitors: 42,
  });
  const [newLivePost, setNewLivePost] = useState<any | null>(null);

  const categories = [
    'All',
    'System Design',
    'Web Engineering',
    'Security & DevOps',
    'Backend Architecture',
  ];

  useEffect(() => {
    loadBlogs();
    loadGlobalStats();

    const socket = getSocket();
    if (socket && socket.on) {
      socket.on('global:stats', (stats: any) => {
        setGlobalStats(stats);
      });

      socket.on('blog:published', (data: any) => {
        if (data?.blog) {
          setNewLivePost(data.blog);
          loadBlogs();
        }
      });
    }

    return () => {
      if (socket && socket.off) {
        socket.off('global:stats');
        socket.off('blog:published');
      }
    };
  }, [selectedCategory]);

  const loadBlogs = async () => {
    setLoading(true);
    const catQuery = selectedCategory !== 'All' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
    const res = await fetchApi(`/blogs?limit=12${catQuery}`);
    if (res.success && res.data?.blogs) {
      setBlogs(res.data.blogs);
    }
    setLoading(false);
  };

  const loadGlobalStats = async () => {
    const res = await fetchApi('/readers/stats/global');
    if (res.success && res.data) {
      setGlobalStats(res.data);
    }
  };

  // Client-side quick search filter with debouncing
  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesSearch;
  });

  const featuredBlog = blogs.length > 0 ? blogs[0] : null;
  const standardBlogs = blogs.length > 1 ? blogs.slice(1) : blogs;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero Section */}
      <section className="relative pt-4 sm:pt-6 pb-2 sm:pb-4 text-center">
        {/* Ambient subtle glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[280px] bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-600/15 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto flex flex-col items-center space-y-4 sm:space-y-5">
          {/* Live Indicator Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-amber-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-beacon" />
            <Flame className="w-4 h-4 text-amber-400" />
            <span>
              <strong className="text-white font-mono">{globalStats.totalActiveSiteVisitors}</strong> developers reading live on the platform
            </span>
          </div>

          {/* Gradient Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
            Where Deep Code <br />
            <span className="gradient-text-hero">Meets High Caffeine.</span>
          </h1>

          {/* Tagline */}
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Curated architectural deep-dives, distributed system blueprints, database
            internals, and modern engineering practices crafted for technical leaders and builders.
          </p>

          {/* Centered Search Bar */}
          <div className="relative w-full max-w-xl mx-auto pt-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles on system design, architecture, performance, clean code..."
              className="w-full pl-12 pr-16 py-3 rounded-2xl glass-input text-sm text-white placeholder-gray-400 shadow-xl focus:border-amber-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-white/10 text-gray-300 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Pills Navigation - Tightly integrated below search bar */}
          <div className="flex items-center justify-center flex-wrap gap-2 pt-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.02]'
                      : 'glass-card text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Spotlight Article (if available) */}
      {featuredBlog && selectedCategory === 'All' && !search && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Editor&apos;s Choice Spotlight
            </h2>
            <Link
              href="/blogs"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <BlogCard blog={featuredBlog} featured={true} />
        </section>
      )}

      {/* Publications Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" />
            {selectedCategory === 'All' ? 'Latest Publications' : `${selectedCategory} Articles`}
          </h2>
          <span className="text-xs text-gray-400">
            Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? 'article' : 'articles'}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <BlogCardSkeleton key={n} />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-3xl border border-white/10 p-8">
            <p className="text-gray-300 font-semibold mb-2">No articles found matching your criteria.</p>
            <p className="text-gray-400 text-sm mb-4">Try clearing the search or exploring other categories.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}
      </section>

      {/* Real-Time Live Article Broadcast Toast */}
      {newLivePost && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm glass-card border border-amber-500/40 p-4 rounded-2xl shadow-2xl flex items-start gap-3 backdrop-blur-xl animate-fade-in">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-beacon" />
                Live Broadcast
              </span>
              <button
                onClick={() => setNewLivePost(null)}
                className="text-gray-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-semibold text-white line-clamp-1">{newLivePost.title}</p>
            <Link
              href={`/blogs/${newLivePost.slug}`}
              className="text-[11px] text-amber-300 hover:underline inline-flex items-center gap-1 font-medium pt-0.5"
            >
              Read new publication &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
