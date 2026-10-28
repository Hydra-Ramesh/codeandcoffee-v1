'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Unlock,
  PlayCircle,
  HelpCircle,
  Code2,
  Layers,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Trophy,
  Clock,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { optimizeImageUrl } from '../../../lib/image';
import CourseOverviewSkeleton from '../../../components/skeletons/CourseOverviewSkeleton';

interface SubtopicSummary {
  id: string;
  title: string;
  slug: string;
  order: number;
  hasQuiz: boolean;
  quizPassingScore: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  quizPassed: boolean;
  quizScore?: number;
}

interface TopicSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  subtopics: SubtopicSummary[];
}

interface CourseDetail {
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
    bio?: string | null;
    role: string;
  };
  topics: TopicSummary[];
  progressPercent: number;
  totalCompleted: number;
  totalLessons: number;
}

export default function CourseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const courseSlug = params.courseSlug as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (courseSlug) {
      loadCourse();
    }
  }, [courseSlug]);

  const loadCourse = async () => {
    setLoading(true);
    const res = await fetchApi(`/courses/${courseSlug}`);
    if (res.success && res.data?.course) {
      const c = res.data.course;
      setCourse(c);
      // Expand all topics by default
      const exp: Record<string, boolean> = {};
      c.topics.forEach((t: TopicSummary) => {
        exp[t.id] = true;
      });
      setExpandedTopics(exp);
    }
    setLoading(false);
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  if (loading) {
    return <CourseOverviewSkeleton />;
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 glass-card rounded-3xl text-center space-y-4 border border-white/10">
        <BookOpen className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Course Not Found</h2>
        <p className="text-xs text-gray-400">
          The curriculum you are looking for does not exist or has been archived.
        </p>
        <Link
          href="/read"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Curriculum Catalog
        </Link>
      </div>
    );
  }

  // Find first unlocked or first uncompleted lesson to Resume / Start
  let targetLesson: { topicSlug: string; subtopicSlug: string } | null = null;
  for (const topic of course.topics) {
    for (const sub of topic.subtopics) {
      if (sub.isUnlocked && !sub.isCompleted) {
        targetLesson = { topicSlug: topic.slug, subtopicSlug: sub.slug };
        break;
      }
    }
    if (targetLesson) break;
  }

  // Fallback to the first lesson if all completed or none found
  if (!targetLesson && course.topics.length > 0 && course.topics[0].subtopics.length > 0) {
    const firstTopic = course.topics[0];
    const firstSub = firstTopic.subtopics[0];
    targetLesson = { topicSlug: firstTopic.slug, subtopicSlug: firstSub.slug };
  }

  const startOrResumeUrl = targetLesson
    ? `/read/${course.slug}/${targetLesson.topicSlug}/${targetLesson.subtopicSlug}`
    : '#';

  const totalQuizzes = course.topics.reduce(
    (acc, t) => acc + t.subtopics.filter((s) => s.hasQuiz).length,
    0
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/read"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Curriculum Catalog</span>
        </Link>

        <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          READ &amp; PRACTICE TRACK
        </span>
      </div>

      {/* Hero Banner Card */}
      <div className="relative glass-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Background glow & art */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-10 items-center">
          <div className="md:col-span-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {course.level}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/10 text-gray-300 border border-white/10">
                {course.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
              {course.description}
            </p>

            {/* Author Badge */}
            <div className="flex items-center gap-3 pt-2">
              <img
                src={
                  optimizeImageUrl(course.author.avatar, { width: 44, height: 44, crop: 'fill' }) ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(course.author.name)}`
                }
                alt={course.author.name}
                className="w-9 h-9 rounded-full border border-white/20 bg-slate-800 object-cover"
              />
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{course.author.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {course.author.role}
                  </span>
                </p>
                <p className="text-[11px] text-gray-400">Curriculum Author &amp; Architect</p>
              </div>
            </div>

            {/* CTA & Resume */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href={startOrResumeUrl}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 hover:scale-102 transition-all cursor-pointer"
              >
                <PlayCircle className="w-5 h-5" />
                <span>
                  {course.progressPercent > 0 ? 'Resume Course Track' : 'Start Curriculum'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="md:col-span-4 glass-card p-6 rounded-2xl border border-white/10 space-y-5 bg-slate-900/40">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Track Completion</span>
            </h3>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {course.progressPercent}%
                </span>
                <span className="text-xs text-gray-400">
                  {course.totalCompleted} of {course.totalLessons} completed
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${course.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Highlights Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-gray-400 text-[11px] block">Modules</span>
                <span className="text-white font-bold text-base">{course.topics.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-gray-400 text-[11px] block">Lessons</span>
                <span className="text-white font-bold text-base">{course.totalLessons}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-gray-400 text-[11px] block">Quizzes</span>
                <span className="text-amber-300 font-bold text-base">{totalQuizzes}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-gray-400 text-[11px] block">Passing Score</span>
                <span className="text-emerald-400 font-bold text-base">&ge; 25%</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
              💡 <strong>Sequential Unlocking:</strong> Lessons unlock one-by-one. Each mandatory quiz requires &ge; 25% to proceed.
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus & Module Outline */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-amber-400" />
              <span>Structured Syllabus &amp; Modules</span>
            </h2>
            <p className="text-xs text-gray-400">
              Interactive lessons, codeblock readmes, screenshots, practice arenas, and quizzes.
            </p>
          </div>

          <span className="text-xs text-gray-400 font-mono">
            {course.topics.length} Sections
          </span>
        </div>

        <div className="space-y-4">
          {course.topics.map((topic, tIdx) => {
            const isExpanded = expandedTopics[topic.id] ?? true;
            const completedInTopic = topic.subtopics.filter((s) => s.isCompleted).length;

            return (
              <div
                key={topic.id}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all shadow-lg"
              >
                {/* Topic Header Accordion Bar */}
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-white/5"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/25 shrink-0">
                      {tIdx + 1}
                    </span>
                    <div className="truncate">
                      <h3 className="text-base font-bold text-white truncate">
                        {topic.title}
                      </h3>
                      {topic.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {topic.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                      {completedInTopic}/{topic.subtopics.length} Done
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Subtopics List */}
                {isExpanded && (
                  <div className="divide-y divide-white/5">
                    {topic.subtopics.map((sub, sIdx) => {
                      const isClickable = sub.isUnlocked;
                      const lessonHref = `/read/${course.slug}/${topic.slug}/${sub.slug}`;

                      const contentItem = (
                        <div
                          className={`p-4 sm:px-6 flex items-center justify-between transition-colors ${
                            sub.isUnlocked
                              ? 'hover:bg-amber-500/[0.04] cursor-pointer'
                              : 'opacity-60 bg-black/20 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-3">
                            {/* Status Icon */}
                            {sub.isCompleted ? (
                              <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            ) : sub.isUnlocked ? (
                              <div className="p-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <Unlock className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-full bg-slate-800 text-gray-500 border border-white/10">
                                <Lock className="w-4 h-4" />
                              </div>
                            )}

                            {/* Subtopic Title & Badges */}
                            <div className="min-w-0">
                              <h4
                                className={`text-sm font-semibold truncate ${
                                  sub.isUnlocked ? 'text-white' : 'text-gray-400'
                                }`}
                              >
                                {sub.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {sub.hasQuiz && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    <HelpCircle className="w-3 h-3" />
                                    Quiz (Pass &ge; {sub.quizPassingScore}%)
                                  </span>
                                )}
                                {sub.quizPassed && typeof sub.quizScore === 'number' && (
                                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    Score: {sub.quizScore}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0 flex items-center gap-2">
                            {sub.isCompleted ? (
                              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                Completed <CheckCircle2 className="w-3.5 h-3.5" />
                              </span>
                            ) : sub.isUnlocked ? (
                              <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20">
                                <span>Start</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" /> Locked
                              </span>
                            )}
                          </div>
                        </div>
                      );

                      return isClickable ? (
                        <Link key={sub.id} href={lessonHref}>
                          {contentItem}
                        </Link>
                      ) : (
                        <div key={sub.id}>{contentItem}</div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
