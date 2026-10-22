'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import BlogCard, { BlogPost } from '../../components/BlogCard';
import { fetchApi } from '../../lib/api';

export default function AllBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = [
    'All',
    'System Design',
    'Web Engineering',
    'Security & DevOps',
    'Backend Architecture',
    'AI & Engineering',
  ];

  useEffect(() => {
    loadBlogs();
  }, [category]);

  const loadBlogs = async () => {
    setLoading(true);
    const catQuery = category !== 'All' ? `&category=${encodeURIComponent(category)}` : '';
    const res = await fetchApi(`/blogs?limit=30${catQuery}`);
    if (res.success && res.data?.blogs) {
      setBlogs(res.data.blogs);
    }
    setLoading(false);
  };

  const filteredBlogs = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 py-6">
      {/* Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          All Publications &amp; <span className="gradient-text-amber">Engineering Notes</span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
          Comprehensive deep-dives into database engines, caching topologies, API protocols, and front-end performance.
        </p>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic, architecture keyword..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-sm text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              category === cat
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'glass-card text-gray-300 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl p-8">
          <BookOpen className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-gray-300 font-semibold">No articles found.</p>
          <p className="text-gray-400 text-sm mt-1">Try another category or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
}
