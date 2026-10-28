'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Sparkles,
  ArrowRight,
  Code2,
  CheckCircle2,
  Lock,
  Layers,
  GraduationCap,
  Trophy,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { optimizeImageUrl } from '../../lib/image';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  bannerImage: string | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  author: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
  topicsCount: number;
  lessonsCount: number;
  quizzesCount: number;
  userProgress: {
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
  } | null;
  createdAt: string;
}

export default function ReadCatalogPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Programming Languages',
    'System Design',
    'Backend',
    'Algorithms & DSA',
  ];

  useEffect(() => {
    loadCourses();
  }, [selectedCategory]);

  const loadCourses = async () => {
    setLoading(true);
    const catQuery = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
    const res = await fetchApi(`/courses${catQuery}`);
    if (res.success && res.data?.courses) {
      setCourses(res.data.courses);
    }
    setLoading(false);
  };

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-12 pb-16 animate-fade-in">
      {/* Hero Section */}
      <section className="relative pt-6 pb-10 text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[300px] bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-cyan-500/15 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider shadow-lg shadow-amber-500/10">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Interactive Reading &amp; Curriculum</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Engineering Masterclasses <br className="hidden sm:inline" />
            <span className="gradient-text-amber">&amp; Deep-Dive Readmes</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Step-by-step sequential courses crafted by production engineers. Read in-depth architectural breakdowns, inspect embedded code diagrams, solve LeetCode practice challenges, and unlock sequential modules by scoring 25%+ on interactive verification quizzes.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses by topic, language, or concept (e.g. C++, Pointers, RAII)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 backdrop-blur-md transition-all shadow-xl"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105 font-bold'
                    : 'glass-card border border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Available Curriculums
            </h2>
            <span className="text-xs text-gray-400 font-mono">({filteredCourses.length})</span>
          </div>

          {user && (user.role === 'ADMIN' || user.role === 'CONTRIBUTOR') && (
            <Link
              href="/admin/courses"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manage / Author Courses</span>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="glass-card rounded-3xl p-6 border border-white/10 h-80 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-full h-36 bg-slate-800/80 rounded-2xl" />
                  <div className="w-3/4 h-5 bg-slate-800 rounded" />
                  <div className="w-full h-4 bg-slate-800 rounded" />
                </div>
                <div className="w-1/2 h-8 bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-gray-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Curriculums Found</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              No curriculums match your current search query or category filter. Try clearing filters or check back shortly.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const hasProgress = course.userProgress !== null && course.userProgress.progressPercent > 0;

              return (
                <div
                  key={course.id}
                  className="group relative glass-card rounded-3xl border border-white/10 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
                >
                  {/* Banner Image / Thumbnail */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    {course.bannerImage ? (
                      <img
                        src={course.bannerImage}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-500/20 via-purple-500/10 to-slate-900 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-amber-400/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    {/* Level Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-500/30">
                        {course.level}
                      </span>
                    </div>

                    {/* Category pill */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-white/10 backdrop-blur-md text-gray-200 border border-white/15">
                        {course.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    {/* Curriculum Metrics */}
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center text-[11px]">
                        <div>
                          <span className="block font-bold text-white text-xs">{course.topicsCount}</span>
                          <span className="text-gray-400 text-[10px] uppercase">Modules</span>
                        </div>
                        <div className="border-x border-white/10">
                          <span className="block font-bold text-white text-xs">{course.lessonsCount}</span>
                          <span className="text-gray-400 text-[10px] uppercase">Lessons</span>
                        </div>
                        <div>
                          <span className="block font-bold text-amber-300 text-xs">{course.quizzesCount}</span>
                          <span className="text-gray-400 text-[10px] uppercase">Quizzes</span>
                        </div>
                      </div>

                      {/* Progress Bar (if user enrolled/started) */}
                      {hasProgress && course.userProgress && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400">Curriculum Progress</span>
                            <span className="font-mono font-bold text-amber-300">
                              {course.userProgress.progressPercent}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${course.userProgress.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Author & Action Button */}
                      <div className="pt-2 flex items-center justify-between border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              optimizeImageUrl(course.author.avatar, { width: 40, height: 40, crop: 'fill' }) ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(course.author.name)}`
                            }
                            alt={course.author.name}
                            className="w-6 h-6 rounded-full border border-white/20 bg-slate-800"
                          />
                          <span className="text-xs text-gray-400 truncate max-w-[100px]">
                            {course.author.name}
                          </span>
                        </div>

                        <Link
                          href={`/read/${course.slug}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-102 transition-all cursor-pointer"
                        >
                          <span>{hasProgress ? 'Continue' : 'Start Reading'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
