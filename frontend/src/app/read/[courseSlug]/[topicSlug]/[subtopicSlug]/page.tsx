'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Unlock,
  HelpCircle,
  Code2,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Play,
  Terminal,
  Clock,
  Menu,
  X,
  Share2,
  Bookmark,
  Check,
  Maximize2,
  Minimize2,
  Coffee,
} from 'lucide-react';
import { fetchApi } from '../../../../../lib/api';
import { useAuth } from '../../../../../context/AuthContext';
import MarkdownViewer from '../../../../../components/MarkdownViewer';

interface QuizQuestion {
  id: string;
  questionText: string;
  type: 'MCQ' | 'MMQ' | 'CODE_OUTPUT';
  codeSnippet?: string | null;
  options: string[];
}

interface CodingQuestion {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  description: string;
  leetcodeUrl?: string;
  starterCode?: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
}

interface SubtopicData {
  id: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  attachments: string[];
  codingQuestions: CodingQuestion[];
  hasQuiz: boolean;
  quizPassingScore: number;
  quiz: QuizQuestion[] | null;
}

interface TopicNav {
  id: string;
  title: string;
  slug: string;
  order: number;
  subtopics: Array<{
    id: string;
    title: string;
    slug: string;
    order: number;
    hasQuiz: boolean;
    isUnlocked: boolean;
    isCompleted: boolean;
    quizPassed: boolean;
    quizScore?: number;
  }>;
}

export default function SubtopicReaderPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const courseSlug = params.courseSlug as string;
  const topicSlug = params.topicSlug as string;
  const subtopicSlug = params.subtopicSlug as string;

  // Sidebar Syllabus State
  const [syllabus, setSyllabus] = useState<{
    id: string;
    title: string;
    slug: string;
    topics: TopicNav[];
  } | null>(null);

  // Lesson Detail State
  const [lesson, setLesson] = useState<SubtopicData | null>(null);
  const [topicInfo, setTopicInfo] = useState<{ id: string; title: string; slug: string } | null>(null);
  const [navigation, setNavigation] = useState<{
    previous: { title: string; slug: string; topicSlug: string } | null;
    next: { title: string; slug: string; topicSlug: string } | null;
  }>({ previous: null, next: null });

  const [userProgress, setUserProgress] = useState<{
    isCompleted: boolean;
    quizAttempts: number;
    quizScore: number | null;
    quizPassed: boolean;
  }>({
    isCompleted: false,
    quizAttempts: 0,
    quizScore: null,
    quizPassed: false,
  });

  const [loading, setLoading] = useState(true);
  const [lockedError, setLockedError] = useState<string | null>(null);

  // Quiz Form State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    passed: boolean;
    scorePercent: number;
    passingThreshold: number;
    correctCount: number;
    totalQuestions: number;
    message: string;
    detailedFeedback: Record<string, { isCorrect: boolean; correctAnswers: number[]; explanation: string }>;
  } | null>(null);

  // "Mark as Done" State (when no quiz)
  const [markingDone, setMarkingDone] = useState(false);

  // Mobile Sidebar Drawer
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Lightbox Zoom for Attachments
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Code Sandbox "Coming Soon" notification
  const [sandboxModalOpen, setSandboxModalOpen] = useState(false);

  // Fullscreen Mode State
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (courseSlug && topicSlug && subtopicSlug) {
      loadLessonAndSyllabus();
    }
  }, [courseSlug, topicSlug, subtopicSlug]);

  const loadLessonAndSyllabus = async () => {
    setLoading(true);
    setLockedError(null);
    setQuizResult(null);
    setQuizAnswers({});

    // Fetch Syllabus for Sidebar
    const syllabusRes = await fetchApi(`/courses/${courseSlug}`);
    if (syllabusRes.success && syllabusRes.data?.course) {
      setSyllabus(syllabusRes.data.course);
      const exp: Record<string, boolean> = {};
      syllabusRes.data.course.topics.forEach((t: TopicNav) => {
        exp[t.id] = true;
      });
      setExpandedTopics(exp);
    }

    // Fetch Subtopic Detail
    const res = await fetchApi(`/courses/${courseSlug}/subtopics/${topicSlug}/${subtopicSlug}`);
    if (res.success && res.data) {
      setLesson(res.data.subtopic);
      setTopicInfo(res.data.topic);
      setNavigation(res.data.navigation);
      if (res.data.userProgress) {
        setUserProgress(res.data.userProgress);
      }
    } else {
      if ((res as any).isLocked || res.message?.toLowerCase().includes('lock')) {
        setLockedError(res.message || 'This module is locked. Please complete the preceding lesson.');
      }
    }
    setLoading(false);
  };

  const toggleTopicExpand = (tId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [tId]: !prev[tId],
    }));
  };

  // Quiz Handling
  const handleOptionSelect = (qId: string, optIdx: number, type: 'MCQ' | 'MMQ' | 'CODE_OUTPUT') => {
    if (quizResult && quizResult.passed) return; // Prevent edits if already passed

    if (type === 'MMQ') {
      const currentList: number[] = Array.isArray(quizAnswers[qId]) ? [...quizAnswers[qId]] : [];
      if (currentList.includes(optIdx)) {
        setQuizAnswers({
          ...quizAnswers,
          [qId]: currentList.filter((idx) => idx !== optIdx),
        });
      } else {
        setQuizAnswers({
          ...quizAnswers,
          [qId]: [...currentList, optIdx],
        });
      }
    } else {
      setQuizAnswers({
        ...quizAnswers,
        [qId]: optIdx,
      });
    }
  };

  const handleSubmitQuiz = async () => {
    if (!lesson) return;

    // Check that all questions have an answer
    const questions = lesson.quiz || [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const ans = quizAnswers[q.id];
      if (ans === undefined || (Array.isArray(ans) && ans.length === 0)) {
        alert(`Please answer question #${i + 1} before submitting.`);
        return;
      }
    }

    setSubmittingQuiz(true);
    const res = await fetchApi(`/courses/${courseSlug}/subtopics/${lesson.id}/quiz/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers: quizAnswers }),
    });

    if (res.success && res.data) {
      setQuizResult(res.data);
      if (res.data.passed) {
        setUserProgress((prev) => ({
          ...prev,
          isCompleted: true,
          quizPassed: true,
          quizScore: res.data.scorePercent,
          quizAttempts: prev.quizAttempts + 1,
        }));
        // Reload syllabus to update lock states on sidebar
        const sylRes = await fetchApi(`/courses/${courseSlug}`);
        if (sylRes.success && sylRes.data?.course) {
          setSyllabus(sylRes.data.course);
        }
      } else {
        setUserProgress((prev) => ({
          ...prev,
          quizAttempts: prev.quizAttempts + 1,
          quizScore: res.data.scorePercent,
        }));
      }
    } else {
      alert(res.message || 'Failed to submit quiz.');
    }
    setSubmittingQuiz(false);
  };

  const handleReattempt = () => {
    setQuizResult(null);
    setQuizAnswers({});
  };

  const handleMarkAsDone = async () => {
    if (!lesson) return;
    setMarkingDone(true);
    const res = await fetchApi(`/courses/${courseSlug}/subtopics/${lesson.id}/complete`, {
      method: 'POST',
    });
    if (res.success) {
      setUserProgress((prev) => ({
        ...prev,
        isCompleted: true,
      }));
      // Reload sidebar syllabus
      const sylRes = await fetchApi(`/courses/${courseSlug}`);
      if (sylRes.success && sylRes.data?.course) {
        setSyllabus(sylRes.data.course);
      }
      if (navigation.next) {
        router.push(`/read/${courseSlug}/${navigation.next.topicSlug}/${navigation.next.slug}`);
      }
    } else {
      alert(res.message || 'Failed to complete lesson.');
    }
    setMarkingDone(false);
  };

  // Locked View
  if (lockedError) {
    return (
      <div className="max-w-xl mx-auto my-24 p-8 glass-card rounded-3xl border border-amber-500/30 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Module Locked</h2>
        <p className="text-sm text-gray-300 leading-relaxed">{lockedError}</p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href={`/read/${courseSlug}`}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
          >
            Return to Syllabus
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm animate-pulse">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-amber-400 animate-spin" />
          <span>Loading Curriculum Lesson...</span>
        </div>
      </div>
    );
  }

  const isCurrentCompleted = userProgress.isCompleted || (lesson.hasQuiz && userProgress.quizPassed);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 text-gray-100 overflow-hidden">
      {/* Top Sticky App Header */}
      <header className="h-14 shrink-0 bg-slate-950/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-xl glass-card text-gray-300 hover:text-white border border-white/10 cursor-pointer"
            aria-label="Toggle Syllabus Sidebar"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Coffee className="w-4 h-4 group-hover:rotate-6 transition-transform" />
            </div>
            <span className="font-extrabold text-sm text-white hidden sm:inline tracking-tight">
              Code <span className="gradient-text-amber">&amp; Coffee</span>
            </span>
          </Link>

          <div className="h-4 w-[1px] bg-white/15 hidden sm:block" />

          {/* Back to Course Syllabus Link */}
          <Link
            href={`/read/${courseSlug}`}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 transition-colors font-medium truncate max-w-[180px] sm:max-w-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{syllabus?.title || 'Course'}</span>
          </Link>
        </div>

        {/* Current Lesson Title in Header */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-gray-300 px-4">
          <span className="text-gray-500">{topicInfo?.title} &gt;</span>
          <span className="font-semibold text-white truncate max-w-sm">{lesson.title}</span>
        </div>

        {/* Header Right Completion & Progress Indicator */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isCurrentCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Completed</span>
            </span>
          ) : lesson.hasQuiz ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quiz &ge; {lesson.quizPassingScore}%</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/25">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reading</span>
            </span>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* User Profile / Auth */}
          {user ? (
            <Link
              href="/user/profile"
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-amber-500/50 transition-all"
              title={user.name}
            >
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
                alt={user.name}
                className="w-7 h-7 rounded-full border border-white/20 bg-slate-800 object-cover"
              />
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main GeeksforGeeks-style Layout Arena */}
      <div className="flex-1 flex overflow-hidden relative w-full h-[calc(100vh-56px)]">
        {/* Full Height Left Syllabus Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-80 sm:w-96 lg:w-[380px] shrink-0 bg-slate-900/95 lg:bg-slate-900/80 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 h-full ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar Top: Course Info */}
          <div className="p-4 border-b border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                COURSE SYLLABUS
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-sm font-bold text-white leading-snug line-clamp-2">
              {syllabus?.title}
            </h2>
          </div>

          {/* Sidebar Scrollable Topics & Subtopics */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {syllabus?.topics.map((t, tIdx) => {
              const isExpanded = expandedTopics[t.id] ?? true;

              return (
                <div key={t.id} className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleTopicExpand(t.id)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                        {tIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-200 truncate">{t.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-white/[0.03] pl-2">
                      {t.subtopics.map((st) => {
                        const isCurrent = st.slug === subtopicSlug && t.slug === topicSlug;
                        const href = `/read/${courseSlug}/${t.slug}/${st.slug}`;

                        return (
                          <div key={st.id}>
                            {st.isUnlocked ? (
                              <Link
                                href={href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-start justify-between p-2.5 rounded-xl text-xs transition-all ${
                                  isCurrent
                                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0 pr-2">
                                  {st.isCompleted ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <Unlock className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                                  )}
                                  <span className="leading-snug line-clamp-2 font-medium">{st.title}</span>
                                </div>
                                {st.hasQuiz && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 shrink-0 mt-0.5">
                                    Quiz
                                  </span>
                                )}
                              </Link>
                            ) : (
                              <div className="flex items-start justify-between p-2.5 text-xs text-gray-400 opacity-60 cursor-not-allowed">
                                <div className="flex items-start gap-2.5 min-w-0 pr-2">
                                  <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                  <span className="leading-snug line-clamp-2">{st.title}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center Reading Arena */}
        <main className="flex-1 h-full overflow-y-auto px-6 sm:px-10 lg:px-16 py-8 custom-scrollbar bg-slate-950/40">
          <div className="max-w-4xl xl:max-w-5xl mx-auto space-y-10">
          {/* Breadcrumb Trail */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <Link href="/read" className="hover:text-amber-400 transition-colors">
              Read
            </Link>
            <span>/</span>
            <Link href={`/read/${courseSlug}`} className="hover:text-amber-400 transition-colors">
              {syllabus?.title || 'Course'}
            </Link>
            <span>/</span>
            <span className="text-gray-500">{topicInfo?.title}</span>
            <span>/</span>
            <span className="text-amber-300 font-medium">{lesson.title}</span>
          </div>

          {/* Lesson Header */}
          <div className="space-y-4 pb-6 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                MODULE LESSON
              </span>
              {lesson.hasQuiz && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/25 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  Mandatory Quiz (&ge; {lesson.quizPassingScore}%)
                </span>
              )}
              {lesson.codingQuestions.length > 0 && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 flex items-center gap-1">
                  <Code2 className="w-3 h-3" />
                  Coding Practice
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {lesson.title}
            </h1>
          </div>

          {/* Markdown Readme Content Body */}
          <article className="prose prose-invert max-w-none text-gray-200">
            <MarkdownViewer content={lesson.content} />
          </article>

          {/* Photo & Screenshot Attachments Gallery (if any) */}
          {lesson.attachments && lesson.attachments.length > 0 && (
            <section className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>Code Diagrams &amp; Screenshot Attachments</span>
              </div>
              <p className="text-xs text-gray-400">
                Visual memory layouts, compiler pipeline diagrams, and reference architectures.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lesson.attachments.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePhoto(photoUrl)}
                    className="group relative rounded-2xl overflow-hidden glass-card border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer shadow-lg"
                  >
                    <img
                      src={photoUrl}
                      alt={`Lesson Attachment #${idx + 1}`}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Maximize2 className="w-4 h-4 text-amber-400" />
                        Click to expand screenshot
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* "Let's Try" Coding Practice Challenge Arena */}
          {lesson.codingQuestions && lesson.codingQuestions.length > 0 && (
            <section className="space-y-6 pt-8 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xl">
                    <Code2 className="w-6 h-6 text-amber-400" />
                    <span>Let&apos;s Try: Hands-On Coding Challenges</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Apply memory layout and algorithms with industry-grade practice problems.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {lesson.codingQuestions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    className="glass-card rounded-2xl border border-white/10 p-6 space-y-5 shadow-xl bg-slate-900/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                          #{qIdx + 1}
                        </span>
                        <h3 className="text-base font-bold text-white">{q.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            q.difficulty === 'EASY'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : q.difficulty === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </div>

                      {q.leetcodeUrl && (
                        <a
                          href={q.leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-amber-500/20 text-xs text-amber-300 border border-white/15 transition-all"
                        >
                          <span>Solve on LeetCode</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="text-xs text-gray-300 leading-relaxed">
                      <MarkdownViewer content={q.description} />
                    </div>

                    {/* Input/Output Examples */}
                    {q.examples && q.examples.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
                          Examples &amp; Edge Cases:
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.examples.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="p-3 rounded-xl bg-slate-950/80 border border-white/10 font-mono text-xs space-y-1.5"
                            >
                              <div>
                                <span className="text-gray-500">Input: </span>
                                <span className="text-cyan-300">{ex.input}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Output: </span>
                                <span className="text-emerald-300">{ex.output}</span>
                              </div>
                              {ex.explanation && (
                                <p className="text-[11px] text-gray-400 pt-1 border-t border-white/5">
                                  {ex.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Integrated In-Browser Playground (Coming Soon / Judge0 Notice) */}
                    <div className="rounded-2xl border border-white/10 bg-slate-950/80 overflow-hidden space-y-3 p-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-mono font-bold text-gray-300">
                            In-Browser Code Sandbox
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          COMING SOON (Judge0 Sandbox)
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-white/5 font-mono text-xs text-gray-300 space-y-1 max-h-36 overflow-y-auto">
                        <p className="text-gray-500">// Starter template:</p>
                        <pre className="text-amber-200/90 whitespace-pre-wrap">
                          {q.starterCode || '// Write your solution here...'}
                        </pre>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-gray-400">
                          Execution engine integration currently in progress.
                        </span>
                        <button
                          type="button"
                          onClick={() => setSandboxModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 text-amber-400" />
                          <span>Run in Sandbox</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section Mandatory Quiz Arena */}
          {lesson.hasQuiz && lesson.quiz && lesson.quiz.length > 0 && (
            <section className="space-y-6 pt-8 border-t border-white/10" id="section-quiz">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xl">
                    <HelpCircle className="w-6 h-6 text-amber-400" />
                    <span>Mandatory Section Knowledge Check</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    A minimum passing score of &ge; {lesson.quizPassingScore}% is required to unlock subsequent modules.
                  </p>
                </div>

                {userProgress.quizPassed && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Passed with {userProgress.quizScore}%</span>
                  </span>
                )}
              </div>

              {/* Quiz Result Banner */}
              {quizResult && (
                <div
                  className={`p-5 rounded-2xl border text-sm space-y-2 animate-fade-in ${
                    quizResult.passed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-red-500/10 border-red-500/30 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base flex items-center gap-2">
                      {quizResult.passed ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>Congratulations! You Passed ({quizResult.scorePercent}%)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <span>Score: {quizResult.scorePercent}% — Reattempt Required</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono text-xs">
                      {quizResult.correctCount} of {quizResult.totalQuestions} Correct
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed opacity-90">{quizResult.message}</p>

                  {!quizResult.passed && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleReattempt}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/20 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reattempt Quiz</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Question Cards List */}
              <div className="space-y-6">
                {lesson.quiz.map((q, idx) => {
                  const qKey = q.id;
                  const feedback = quizResult?.detailedFeedback[qKey];
                  const isMMQ = q.type === 'MMQ';

                  return (
                    <div
                      key={q.id}
                      className={`glass-card rounded-2xl border p-6 space-y-4 shadow-lg ${
                        feedback
                          ? feedback.isCorrect
                            ? 'border-emerald-500/40 bg-emerald-950/10'
                            : 'border-red-500/40 bg-red-950/10'
                          : 'border-white/10 bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-400 uppercase">
                            {q.type === 'MMQ'
                              ? 'Multiple Select (Checkboxes)'
                              : q.type === 'CODE_OUTPUT'
                              ? 'Predict Code Output'
                              : 'Single Choice (MCQ)'}
                          </span>
                        </div>

                        {feedback && (
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                              feedback.isCorrect
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {feedback.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-semibold text-white leading-snug">
                        {q.questionText}
                      </h4>

                      {/* Code Snippet for CODE_OUTPUT */}
                      {q.codeSnippet && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-amber-300 overflow-x-auto">
                          <pre>{q.codeSnippet}</pre>
                        </div>
                      )}

                      {/* Options */}
                      <div className="space-y-2.5 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = isMMQ
                            ? Array.isArray(quizAnswers[q.id]) && quizAnswers[q.id].includes(optIdx)
                            : quizAnswers[q.id] === optIdx;

                          const isAnswerCorrectKey =
                            feedback && feedback.correctAnswers.includes(optIdx);

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleOptionSelect(q.id, optIdx, q.type)}
                              className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                                isAnswerCorrectKey
                                  ? 'border-emerald-500 bg-emerald-500/15 text-white font-semibold'
                                  : isSelected
                                  ? 'border-amber-500 bg-amber-500/15 text-white font-semibold'
                                  : 'border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-amber-500 border-amber-500 text-slate-950'
                                      : 'border-white/20 bg-slate-800'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span>{opt}</span>
                              </div>

                              {isAnswerCorrectKey && (
                                <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                                  Correct Key
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Author Explanation */}
                      {feedback && feedback.explanation && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-gray-300 space-y-1">
                          <span className="font-bold text-amber-300">Explanation:</span>
                          <p>{feedback.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quiz Submit Button */}
              {(!quizResult || !quizResult.passed) && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 disabled:opacity-50 cursor-pointer transition-all"
                  >
                    {submittingQuiz ? 'Evaluating Answers...' : 'Submit Quiz & Check Score'}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Mark as Done button (for lessons with NO quiz) */}
          {!lesson.hasQuiz && !userProgress.isCompleted && (
            <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white">Finished Reading this Module?</h4>
                <p className="text-xs text-gray-400">
                  Mark this lesson as done to save your progress and unlock the next section.
                </p>
              </div>

              <button
                type="button"
                onClick={handleMarkAsDone}
                disabled={markingDone}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{markingDone ? 'Updating...' : 'Mark as Done & Unlock Next'}</span>
              </button>
            </div>
          )}

          {/* Bottom Lesson Navigation */}
          <footer className="pt-8 pb-12 border-t border-white/10 flex items-center justify-between">
            {navigation.previous ? (
              <Link
                href={`/read/${courseSlug}/${navigation.previous.topicSlug}/${navigation.previous.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Previous:</span>
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{navigation.previous.title}</span>
              </Link>
            ) : (
              <div />
            )}

            {navigation.next && (
              <div>
                {isCurrentCompleted ? (
                  <Link
                    href={`/read/${courseSlug}/${navigation.next.topicSlug}/${navigation.next.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all"
                  >
                    <span>Next: {navigation.next.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-gray-400 font-semibold text-xs border border-white/5 cursor-not-allowed opacity-60"
                    title="Complete current lesson and pass quiz to unlock"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked (Complete Quiz &ge; 25%)</span>
                  </button>
                )}
              </div>
            )}
          </footer>
          </div>
        </main>
      </div>

      {/* Lightbox Modal for Photo Attachments */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activePhoto}
              alt="Expanded Attachment"
              className="max-h-[85vh] w-auto rounded-2xl object-contain border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Judge0 Sandbox Coming Soon Modal */}
      {sandboxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl border border-amber-500/30 p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Terminal className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Judge0 Code Execution</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              We are currently setting up isolated Docker worker clusters running the <strong>Judge0 Compiler API</strong> for multi-language evaluation (C++, Python, Go, Java).
              <br /><br />
              In the meantime, you can test your implementation directly on LeetCode using the link above!
            </p>
            <button
              type="button"
              onClick={() => setSandboxModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
