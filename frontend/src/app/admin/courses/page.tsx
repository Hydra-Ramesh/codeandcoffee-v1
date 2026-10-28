'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  BookOpen,
  Search,
  Users,
  Edit,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Code2,
  ArrowRight,
  BarChart3,
  X,
  ExternalLink,
  Shield,
  Eye,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { optimizeImageUrl } from '../../../lib/image';

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  bannerImage: string | null;
  level: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
  topicsCount: number;
  lessonsCount: number;
  quizzesCount: number;
  createdAt: string;
}

interface TelemetryData {
  course: {
    id: string;
    title: string;
    slug: string;
  };
  stats: {
    totalEnrolled: number;
    averageProgressPercent: number;
    totalQuizAttempts: number;
    totalPassedQuizzes: number;
  };
  students: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
    lastAccessedSubtopicTitle: string | null;
    lastActivityAt: string;
  }>;
}

export default function AdminCoursesPage() {
  const { user, isAdmin } = useAuth();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Course Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'Programming Languages',
    level: 'INTERMEDIATE',
    bannerImage: '',
    isPublished: true,
  });

  // Telemetry Modal State
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false);
  const [selectedCourseForTelemetry, setSelectedCourseForTelemetry] = useState<string | null>(null);
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const res = await fetchApi('/courses');
    if (res.success && res.data?.courses) {
      setCourses(res.data.courses);
    }
    setLoading(false);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim()) {
      alert('Course title is required.');
      return;
    }
    setSavingCourse(true);
    const res = await fetchApi('/courses', {
      method: 'POST',
      body: JSON.stringify(newCourse),
    });
    if (res.success) {
      setCreateModalOpen(false);
      setNewCourse({
        title: '',
        description: '',
        category: 'Programming Languages',
        level: 'INTERMEDIATE',
        bannerImage: '',
        isPublished: true,
      });
      loadCourses();
    } else {
      alert(res.message || 'Failed to create course.');
    }
    setSavingCourse(false);
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete course "${title}" and all its topics, subtopics, and quizzes?`)) {
      return;
    }
    const res = await fetchApi(`/courses/${courseId}`, {
      method: 'DELETE',
    });
    if (res.success) {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } else {
      alert(res.message || 'Failed to delete course.');
    }
  };

  const openTelemetry = async (courseId: string) => {
    setSelectedCourseForTelemetry(courseId);
    setTelemetryModalOpen(true);
    setLoadingTelemetry(true);
    const res = await fetchApi(`/courses/admin/telemetry/${courseId}`);
    if (res.success && res.data) {
      setTelemetryData(res.data);
    } else {
      alert(res.message || 'Failed to fetch course student telemetry.');
    }
    setLoadingTelemetry(false);
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Read Courses &amp; Curriculum Management
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Author and structure technical tracks with readmes, attachments, coding challenges, and mandatory quizzes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search courses by title or category..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400 space-y-3">
          <BookOpen className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p>Loading course curricula...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 glass-card rounded-2xl border border-white/10 text-center space-y-4">
          <Layers className="w-10 h-10 text-gray-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No courses found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No courses match your search criteria.'
              : 'Create your first course to begin authoring interactive readmes, practice challenges, and quizzes.'}
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              className="glass-card rounded-2xl border border-white/10 p-5 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {c.level}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-gray-300 border border-white/10">
                    {c.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white leading-snug truncate">
                    {c.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{c.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 font-mono pt-1">
                  <span className="flex items-center gap-1 text-white">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <strong>{c.topicsCount}</strong> Modules
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <strong>{c.lessonsCount}</strong> Lessons
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                    <strong>{c.quizzesCount}</strong> Quizzes
                  </span>
                  <span className="text-gray-500">Author: {c.author.name}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                {/* Telemetry / Monitor */}
                <button
                  type="button"
                  onClick={() => openTelemetry(c.id)}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 border border-white/10 flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Monitor Student Progression & Quiz Attempts"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Student Telemetry</span>
                </button>

                {/* Live Preview */}
                <Link
                  href={`/read/${c.slug}`}
                  target="_blank"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10"
                  title="View Public Course Reader"
                >
                  <Eye className="w-4 h-4" />
                </Link>

                {/* Edit & Curriculum Builder */}
                <Link
                  href={`/admin/courses/${c.id}`}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Curriculum Builder</span>
                </Link>

                {/* Delete (if admin or author) */}
                {(isAdmin || user?.id === c.author.id) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(c.id, c.title)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Course */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full glass-card rounded-3xl border border-white/20 p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Create New Course Track</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Course Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="e.g. Modern C++ Systems Mastery"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Deep-dive into memory architectures, pointers, RAII, and high-performance algorithms..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Programming Languages">Programming Languages</option>
                    <option value="System Design">System Design</option>
                    <option value="Backend">Backend</option>
                    <option value="Algorithms & DSA">Algorithms &amp; DSA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Proficiency Level
                  </label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={newCourse.bannerImage}
                  onChange={(e) => setNewCourse({ ...newCourse, bannerImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="coursePublished"
                  checked={newCourse.isPublished}
                  onChange={(e) => setNewCourse({ ...newCourse, isPublished: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <label htmlFor="coursePublished" className="text-xs text-gray-300">
                  Publish immediately (accessible to learners in the Read catalog)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-card text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {savingCourse ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Student Progress & Telemetry Monitor */}
      {telemetryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-3xl w-full max-h-[90vh] glass-card rounded-3xl border border-white/20 p-6 space-y-6 flex flex-col animate-scale-up overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Student Telemetry &amp; Progression</h3>
                  <p className="text-xs text-gray-400">{telemetryData?.course.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTelemetryModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingTelemetry ? (
              <div className="py-16 text-center text-xs text-gray-400 space-y-2">
                <BarChart3 className="w-7 h-7 text-amber-400 animate-spin mx-auto" />
                <p>Calculating cohort metrics...</p>
              </div>
            ) : !telemetryData ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Failed to load telemetry data.
              </div>
            ) : (
              <div className="space-y-6 overflow-y-auto pr-1 custom-scrollbar">
                {/* Cohort Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block">
                      Enrolled Learners
                    </span>
                    <span className="text-xl font-black text-white">
                      {telemetryData.stats.totalEnrolled}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block">
                      Avg Completion
                    </span>
                    <span className="text-xl font-black text-amber-300 font-mono">
                      {telemetryData.stats.averageProgressPercent}%
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block">
                      Quiz Attempts
                    </span>
                    <span className="text-xl font-black text-cyan-300 font-mono">
                      {telemetryData.stats.totalQuizAttempts}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block">
                      Quizzes Passed
                    </span>
                    <span className="text-xl font-black text-emerald-300 font-mono">
                      {telemetryData.stats.totalPassedQuizzes}
                    </span>
                  </div>
                </div>

                {/* Learners Roster Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Active Learners Roster ({telemetryData.students.length})</span>
                  </h4>

                  {telemetryData.students.length === 0 ? (
                    <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400">
                      No learners have enrolled in this course track yet.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
                      {telemetryData.students.map((st) => (
                        <div
                          key={st.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={
                                optimizeImageUrl(st.avatar, { width: 36, height: 36, crop: 'fill' }) ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(st.name)}`
                              }
                              alt={st.name}
                              className="w-8 h-8 rounded-full border border-white/10 bg-slate-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{st.name}</p>
                              <p className="text-[11px] text-gray-400 truncate">{st.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                            <div className="text-right">
                              <span className="text-amber-300 font-bold">{st.progressPercent}%</span>
                              <span className="text-[10px] text-gray-400 block">
                                {st.completedLessons}/{st.totalLessons} Lessons
                              </span>
                            </div>
                            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-amber-400 rounded-full"
                                style={{ width: `${st.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
