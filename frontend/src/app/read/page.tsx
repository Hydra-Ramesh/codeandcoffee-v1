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
import ReadCatalogSkeleton from '../../components/skeletons/ReadCatalogSkeleton';

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

  const defaultCategories = [
    'All',
    'Programming Languages',
    'System Design',
    'Backend',
    'Algorithms & DSA',
  ];

  const categories = Array.from(
    new Set([
      ...defaultCategories,
      ...courses.map((c) => c.category).filter(Boolean),
    ])
  );

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

  if (loading && courses.length === 0) {
    return <ReadCatalogSkeleton />;
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Sleek, Professional Header Banner */}
      <section className="relative pt-2 pb-2">
        {/* Subtle backdrop glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] sm:w-[600px] h-[180px] bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-[90px] pointer-events-none -z-10" />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-card border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Interactive Curriculums</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Engineering Readmes <span className="gradient-text-amber">&amp; Guided Tracks</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                Production-grade systems deep dives with architectural diagrams, interactive sandboxes, and sequential verification quizzes.
              </p>
            </div>

            {/* Feature Highlights Pills */}
            <div className="hidden lg:flex flex-col gap-1.5 shrink-0 text-[11px]">
              <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                <span>Sequential Unlocking (25%+ on Quizzes)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-green-400" />
                <span>In-Depth Code Diagrams &amp; Sandboxes</span>
              </div>
            </div>
          </div>

          {/* Unified Compact Filter & Search Toolbar */}
          <div className="bg-white dark:bg-slate-900/60 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm dark:shadow-lg backdrop-blur-md">
            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold scale-[1.02]'
                      : 'text-slate-600 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input & Action */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-400" />
                <input
                  type="text"
                  id="search-tracks-input"
                  name="searchQuery"
                  aria-label="Filter tracks by keyword"
                  placeholder="Filter tracks by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-xs focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search input"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {user && (user.role === 'ADMIN' || user.role === 'CONTRIBUTOR') && (
                <Link
                  href="/admin/courses"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shrink-0 cursor-pointer"
                  title="Manage and create curriculums"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Author Studio</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="font-semibold text-slate-700 dark:text-gray-300">Available Tracks</span>
            <span className="font-mono bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md text-[11px] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-transparent">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'curriculum' : 'curriculums'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse select-none">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="relative w-full h-44 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-20 bg-amber-500/20 rounded-full border border-amber-500/30" />
                      <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800/90 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10" />
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-5 w-11/12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-800/80 rounded-lg" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800/60 rounded" />
                    <div className="h-3.5 w-4/5 bg-slate-200 dark:bg-slate-800/60 rounded" />
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 grid grid-cols-3 gap-2">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800/70 rounded" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-800/70 rounded" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-800/70 rounded" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10" />
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800/70 rounded" />
                  </div>
                  <div className="h-9 w-28 bg-amber-500/30 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/40 p-12 rounded-3xl border border-slate-200 dark:border-white/10 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-slate-400 dark:text-gray-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Curriculums Found</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 max-w-md mx-auto">
              No curriculums match your current search query or category filter. Try clearing filters or check back shortly.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
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
                  className="group relative bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Banner Image / Thumbnail */}
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    {course.bannerImage ? (
                      <img
                        src={optimizeImageUrl(course.bannerImage, { width: 600, height: 350, crop: 'fill' }) || course.bannerImage}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-500/15 via-purple-500/10 to-slate-200 dark:to-slate-900 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-amber-500/60 dark:text-amber-400/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent dark:from-slate-950 dark:via-slate-950/40" />

                    {/* Level Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-500/30">
                        {course.level}
                      </span>
                    </div>

                    {/* Category pill */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-white/20 dark:bg-white/10 backdrop-blur-md text-slate-900 dark:text-gray-200 border border-white/30 dark:border-white/15">
                        {course.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    {/* Curriculum Metrics */}
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center text-[11px]">
                        <div>
                          <span className="block font-bold text-slate-900 dark:text-white text-xs">{course.topicsCount}</span>
                          <span className="text-slate-500 dark:text-gray-400 text-[10px] uppercase">Modules</span>
                        </div>
                        <div className="border-x border-slate-200 dark:border-white/10">
                          <span className="block font-bold text-slate-900 dark:text-white text-xs">{course.lessonsCount}</span>
                          <span className="text-slate-500 dark:text-gray-400 text-[10px] uppercase">Lessons</span>
                        </div>
                        <div>
                          <span className="block font-bold text-amber-700 dark:text-amber-300 text-xs">{course.quizzesCount}</span>
                          <span className="text-slate-500 dark:text-gray-400 text-[10px] uppercase">Quizzes</span>
                        </div>
                      </div>

                      {/* Progress Bar (if user enrolled/started) */}
                      {hasProgress && course.userProgress && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 dark:text-gray-400">Curriculum Progress</span>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-300">
                              {course.userProgress.progressPercent}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${course.userProgress.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Author & Action Button */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              optimizeImageUrl(course.author.avatar, { width: 40, height: 40, crop: 'fill' }) ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(course.author.name)}`
                            }
                            alt={course.author.name}
                            className="w-6 h-6 rounded-full border border-slate-300 dark:border-white/20 bg-slate-200 dark:bg-slate-800 object-cover"
                          />
                          <span className="text-xs text-slate-600 dark:text-gray-400 truncate max-w-[100px]">
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
