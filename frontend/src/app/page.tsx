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
import { fetchApi } from '../lib/api';

export default function HomePage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [globalStats, setGlobalStats] = useState({
    totalActiveBlogReaders: 14,
    totalActiveSiteVisitors: 42,
  });

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

    // Poll global live reader stats every 15s
    const statsInterval = setInterval(loadGlobalStats, 15000);
    return () => clearInterval(statsInterval);
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

  // Client-side quick search filter
  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const featuredBlog = blogs.length > 0 ? blogs[0] : null;
  const standardBlogs = blogs.length > 1 ? blogs.slice(1) : blogs;

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative pt-8 pb-14 text-center">
        {/* Ambient subtle glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[320px] bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-600/15 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto flex flex-col items-center space-y-6">
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
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Curated architectural deep-dives, distributed system blueprints, database
            internals, and modern engineering practices crafted for technical leaders and builders.
          </p>

          {/* Centered Search Bar */}
          <div className="relative w-full max-w-xl mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles on system design, architecture, performance, clean code..."
              className="w-full pl-12 pr-16 py-3.5 rounded-2xl glass-input text-sm text-white placeholder-gray-400 shadow-xl focus:border-amber-500/50"
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
        </div>
      </section>

      {/* Category Pills Navigation - Centered */}
      <section className="flex items-center justify-center flex-wrap gap-2.5 pb-2">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'glass-card text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </section>

      {/* Featured Spotlight Article (if available) */}
      {featuredBlog && selectedCategory === 'All' && !search && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Editor's Choice Spotlight
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
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-2xl glass-card animate-pulse" />
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
    </div>
  );
}
