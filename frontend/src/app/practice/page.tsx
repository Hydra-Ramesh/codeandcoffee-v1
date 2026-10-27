'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../lib/api';
import MarkdownViewer from '../../components/MarkdownViewer';
import PracticeQuestionsSkeleton from '../../components/skeletons/PracticeQuestionsSkeleton';
import PracticeLeaderboardSkeleton from '../../components/skeletons/PracticeLeaderboardSkeleton';
import Pagination from '../../components/Pagination';
import {
  Code2,
  CheckCircle2,
  Circle,
  ExternalLink,
  BookOpen,
  StickyNote,
  Video,
  FileCode,
  Search,
  Trophy,
  Flame,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Check,
  AlertCircle,
  Layers,
  Award,
  ArrowUpDown,
  RotateCcw,
  Filter,
  Crown,
  Medal,
  Calendar,
  Clock,
  TrendingUp,
  Shuffle,
  Info,
  AlertTriangle,
} from 'lucide-react';

type SheetType = 'CRACK_THE_INTERVIEW' | 'SDE_SHEET' | 'CP_SHEET' | 'KNOWLEDGE_SHEET' | 'LEADERBOARD';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type StatusFilter = 'ALL' | 'COMPLETED' | 'UNCOMPLETED';
type SortOption = 'DEFAULT' | 'LEVEL_ASC' | 'LEVEL_DESC' | 'UNSOLVED_FIRST' | 'SOLVED_FIRST' | 'TITLE_ASC';

export interface DailySolveSummary {
  date: string;
  count: number;
  status: 'NONE' | 'NORMAL' | 'FIRE';
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar?: string | null;
  role: string;
  totalCompleted: number;
  points: number;
  currentStreak: number;
  highestStreak: number;
  fireDaysCount: number;
  normalDaysCount: number;
  todaySolves: number;
  todayStatus: 'NONE' | 'NORMAL' | 'FIRE';
  recentDays: DailySolveSummary[];
  lastActive: string | null;
  crackCount: number;
  sdeCount: number;
  cpCount: number;
  knowledgeCount?: number;
}

interface PracticeQuestion {
  id: string;
  sheetType: SheetType;
  topic?: string | null;
  rating?: number | null;
  platform: string;
  title: string;
  difficulty: Difficulty;
  content?: string | null;
  externalUrl?: string | null;
  videoUrl?: string | null;
  solutionNotes?: string | null;
  order: number;
  createdAt: string;
}

export default function PracticePage() {
  const { user, refreshUser } = useAuth();
  const [activeSheet, setActiveSheet] = useState<SheetType>('CRACK_THE_INTERVIEW');
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');
  const [randomPickedQuestion, setRandomPickedQuestion] = useState<PracticeQuestion | null>(null);

  // Leaderboard & Streak State
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [myRankInfo, setMyRankInfo] = useState<LeaderboardUser | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardSearch, setLeaderboardSearch] = useState('');

  // Pagination State: Group-based for questions, row-based for leaderboard
  const [groupPage, setGroupPage] = useState(1);
  const [groupsPerPage, setGroupsPerPage] = useState(4);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardPageSize, setLeaderboardPageSize] = useState(20);

  // User Progress: completedMap and notesMap
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  // Accordion states: maps topic or rating string to boolean (open/close)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Modals
  const [activeReadmeQuestion, setActiveReadmeQuestion] = useState<PracticeQuestion | null>(null);
  const [activeNoteQuestion, setActiveNoteQuestion] = useState<PracticeQuestion | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaveSuccess, setNoteSaveSuccess] = useState(false);

  // Coming Soon Modal
  const [comingSoonModal, setComingSoonModal] = useState<{
    open: boolean;
    type: 'video' | 'notes';
    questionTitle: string;
  }>({
    open: false,
    type: 'video',
    questionTitle: '',
  });

  // Profile Prerequisite Modal State (for SDE & CP sheets)
  const [profilePromptModal, setProfilePromptModal] = useState<{
    open: boolean;
    sheet: 'SDE_SHEET' | 'CP_SHEET';
    targetAction?: () => void;
  }>({
    open: false,
    sheet: 'SDE_SHEET',
  });
  const [modalLeetcode, setModalLeetcode] = useState('');
  const [modalCodeforces, setModalCodeforces] = useState('');
  const [modalCodechef, setModalCodechef] = useState('');
  const [savingProfiles, setSavingProfiles] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Helper to format relative time for leaderboard
  function formatRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return 'Never';
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  // Load questions or leaderboard whenever activeSheet changes
  useEffect(() => {
    if (activeSheet === 'LEADERBOARD') {
      loadLeaderboard();
    } else {
      loadSheetQuestions(activeSheet);
    }
  }, [activeSheet]);

  // Load leaderboard & streak data on mount and whenever auth state changes
  useEffect(() => {
    loadLeaderboard();
  }, [user]);

  // Load initial progress from localStorage (for immediate responsiveness & guests)
  useEffect(() => {
    try {
      const storedCompleted = localStorage.getItem('practice_completed_map');
      const storedNotes = localStorage.getItem('practice_notes_map');
      if (storedCompleted) setCompletedMap((prev) => ({ ...prev, ...JSON.parse(storedCompleted) }));
      if (storedNotes) setNotesMap((prev) => ({ ...prev, ...JSON.parse(storedNotes) }));
    } catch {
      // non-fatal
    }
  }, []);

  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetchApi('/practice/leaderboard');
      if (res.success && res.data) {
        setLeaderboardData(res.data.leaderboard || []);
        if (res.data.myRankInfo) {
          setMyRankInfo(res.data.myRankInfo);
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const loadSheetQuestions = async (sheet: SheetType) => {
    if (sheet === 'LEADERBOARD') return;
    setLoading(true);
    try {
      const res = await fetchApi(`/practice/sheet/${sheet}`);
      if (res.success && res.data) {
        setQuestions(res.data.questions || []);

        // If authenticated user returned progress from DB
        if (res.data.userProgress) {
          const newCompleted: Record<string, boolean> = {};
          const newNotes: Record<string, string> = {};

          Object.entries(res.data.userProgress).forEach(([qId, val]: [string, any]) => {
            if (val.isCompleted) newCompleted[qId] = true;
            if (val.notes) newNotes[qId] = val.notes;
          });

          setCompletedMap((prev) => {
            const merged = { ...prev, ...newCompleted };
            try {
              localStorage.setItem('practice_completed_map', JSON.stringify(merged));
            } catch {}
            return merged;
          });

          setNotesMap((prev) => {
            const merged = { ...prev, ...newNotes };
            try {
              localStorage.setItem('practice_notes_map', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
    } catch (err) {
      console.error('Failed to load practice questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check profile prerequisites for SDE Sheet (LeetCode) or CP Sheet (Codeforces + CodeChef)
  const executeWithProfileCheck = (
    sheetType: SheetType,
    action: () => void
  ) => {
    if (!user) {
      action();
      return;
    }

    if (sheetType === 'SDE_SHEET' && !user.leetcodeUrl) {
      setModalLeetcode('');
      setProfileError(null);
      setProfilePromptModal({
        open: true,
        sheet: 'SDE_SHEET',
        targetAction: action,
      });
      return;
    }

    if (sheetType === 'CP_SHEET' && (!user.codeforcesUrl || !user.codechefUrl)) {
      setModalCodeforces(user.codeforcesUrl || '');
      setModalCodechef(user.codechefUrl || '');
      setProfileError(null);
      setProfilePromptModal({
        open: true,
        sheet: 'CP_SHEET',
        targetAction: action,
      });
      return;
    }

    action();
  };

  const handleSaveProfilePrerequisites = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    const isSde = profilePromptModal.sheet === 'SDE_SHEET';

    if (isSde && !modalLeetcode.trim()) {
      setProfileError('Please enter your LeetCode profile handle or URL.');
      return;
    }

    if (!isSde && (!modalCodeforces.trim() || !modalCodechef.trim())) {
      setProfileError('Both Codeforces and CodeChef profile handles or URLs are required.');
      return;
    }

    setSavingProfiles(true);
    try {
      const payload: any = {};
      if (isSde) {
        payload.leetcodeUrl = modalLeetcode.trim();
      } else {
        payload.codeforcesUrl = modalCodeforces.trim();
        payload.codechefUrl = modalCodechef.trim();
      }

      const res = await fetchApi('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        await refreshUser();
        const action = profilePromptModal.targetAction;
        setProfilePromptModal({ open: false, sheet: 'SDE_SHEET' });
        if (action) {
          action();
        }
      } else {
        setProfileError(res.message || 'Failed to save profile. Please try again.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Network error while saving profile.');
    } finally {
      setSavingProfiles(false);
    }
  };

  // Toggle question completion
  const handleToggleComplete = async (questionId: string, sheetType?: SheetType) => {
    const targetSheet = sheetType || questions.find((q) => q.id === questionId)?.sheetType || activeSheet;

    executeWithProfileCheck(targetSheet, async () => {
      const nextVal = !completedMap[questionId];

      // Optimistic UI update
      setCompletedMap((prev) => {
        const updated = { ...prev, [questionId]: nextVal };
        try {
          localStorage.setItem('practice_completed_map', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // If authenticated, sync with backend
      if (user) {
        try {
          await fetchApi(`/practice/my-progress/${questionId}/toggle`, {
            method: 'POST',
          });
          // Refresh leaderboard and streak telemetry immediately
          loadLeaderboard();
        } catch (err) {
          console.error('Failed to sync progress with server:', err);
        }
      }
    });
  };

  // Open note editor
  const handleOpenNote = (question: PracticeQuestion) => {
    setActiveNoteQuestion(question);
    setCurrentNoteText(notesMap[question.id] || '');
    setNoteSaveSuccess(false);
  };

  // Save note
  const handleSaveNote = async () => {
    if (!activeNoteQuestion) return;
    setSavingNote(true);
    const qId = activeNoteQuestion.id;

    // Update local state and localStorage
    setNotesMap((prev) => {
      const updated = { ...prev, [qId]: currentNoteText };
      try {
        localStorage.setItem('practice_notes_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // If authenticated, sync with backend
    if (user) {
      try {
        await fetchApi(`/practice/my-progress/${qId}/note`, {
          method: 'PUT',
          body: JSON.stringify({ notes: currentNoteText }),
        });
      } catch (err) {
        console.error('Failed to save note to server:', err);
      }
    }

    setSavingNote(false);
    setNoteSaveSuccess(true);
    setTimeout(() => {
      setNoteSaveSuccess(false);
      setActiveNoteQuestion(null);
    }, 1200);
  };

  const difficultyWeight: Record<Difficulty, number> = {
    EASY: 1,
    MEDIUM: 2,
    HARD: 3,
  };

  // Group questions by Topic (for Crack Interview, SDE, Knowledge Sheet) or Rating (for CP Sheet)
  const groupedQuestions = useMemo(() => {
    let filtered = [...questions];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.topic && item.topic.toLowerCase().includes(q)) ||
          (item.rating && item.rating.toString().includes(q)) ||
          (item.platform && item.platform.toLowerCase().includes(q))
      );
    }

    // 2. Difficulty Level Filter
    if (selectedDifficulty !== 'ALL') {
      filtered = filtered.filter((item) => item.difficulty === selectedDifficulty);
    }

    // 3. Status Filter (Completed vs Uncompleted)
    if (selectedStatus === 'COMPLETED') {
      filtered = filtered.filter((item) => Boolean(completedMap[item.id]));
    } else if (selectedStatus === 'UNCOMPLETED') {
      filtered = filtered.filter((item) => !completedMap[item.id]);
    }

    // 4. Platform Filter
    if (selectedPlatform !== 'ALL') {
      filtered = filtered.filter((item) => item.platform === selectedPlatform);
    }

    // 5. Partition into Groups
    const groups: Record<string, PracticeQuestion[]> = {};

    filtered.forEach((item) => {
      let key = '';
      if (activeSheet === 'CP_SHEET') {
        key = item.rating ? `Rating: ${item.rating}` : 'Unrated Challenges';
      } else if (activeSheet === 'KNOWLEDGE_SHEET') {
        key = item.topic || 'General Practice';
      } else {
        key = item.topic || 'General Algorithms';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    // 6. Apply Sorting Within Each Group
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        if (sortBy === 'LEVEL_ASC') {
          const diffA = difficultyWeight[a.difficulty] || 2;
          const diffB = difficultyWeight[b.difficulty] || 2;
          if (diffA !== diffB) return diffA - diffB;
          return a.order - b.order;
        }
        if (sortBy === 'LEVEL_DESC') {
          const diffA = difficultyWeight[a.difficulty] || 2;
          const diffB = difficultyWeight[b.difficulty] || 2;
          if (diffA !== diffB) return diffB - diffA;
          return a.order - b.order;
        }
        if (sortBy === 'UNSOLVED_FIRST') {
          const doneA = Boolean(completedMap[a.id]) ? 1 : 0;
          const doneB = Boolean(completedMap[b.id]) ? 1 : 0;
          if (doneA !== doneB) return doneA - doneB;
          return a.order - b.order;
        }
        if (sortBy === 'SOLVED_FIRST') {
          const doneA = Boolean(completedMap[a.id]) ? 1 : 0;
          const doneB = Boolean(completedMap[b.id]) ? 1 : 0;
          if (doneA !== doneB) return doneB - doneA;
          return a.order - b.order;
        }
        if (sortBy === 'TITLE_ASC') {
          return a.title.localeCompare(b.title);
        }
        return a.order - b.order;
      });
    });

    return groups;
  }, [questions, searchQuery, selectedDifficulty, selectedStatus, selectedPlatform, sortBy, activeSheet, completedMap]);

  // Expand / collapse all groups
  const toggleGroup = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  const isGroupExpanded = (key: string) => {
    return expandedSections[key] !== false; // Default expanded
  };

  // Overall Statistics for current sheet
  const sheetStats = useMemo(() => {
    const total = questions.length;
    const completed = questions.filter((q) => completedMap[q.id]).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [questions, completedMap]);

  // Filtered leaderboard solvers & Leaderboard Pagination
  const filteredLeaderboard = useMemo(() => {
    if (!leaderboardSearch.trim()) return leaderboardData;
    const q = leaderboardSearch.toLowerCase();
    return leaderboardData.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.role && u.role.toLowerCase().includes(q))
    );
  }, [leaderboardData, leaderboardSearch]);

  const totalLeaderboardPages = Math.ceil(filteredLeaderboard.length / leaderboardPageSize);
  const paginatedLeaderboard = useMemo(() => {
    const start = (leaderboardPage - 1) * leaderboardPageSize;
    return filteredLeaderboard.slice(start, start + leaderboardPageSize);
  }, [filteredLeaderboard, leaderboardPage, leaderboardPageSize]);

  useEffect(() => {
    setLeaderboardPage(1);
  }, [leaderboardSearch, activeSheet]);

  // Derived Group Entries and Group-based Pagination
  const groupEntries = useMemo(() => Object.entries(groupedQuestions), [groupedQuestions]);
  const totalGroupPages = Math.ceil(groupEntries.length / groupsPerPage);
  const paginatedGroupEntries = useMemo(() => {
    const start = (groupPage - 1) * groupsPerPage;
    return groupEntries.slice(start, start + groupsPerPage);
  }, [groupEntries, groupPage, groupsPerPage]);

  useEffect(() => {
    setGroupPage(1);
  }, [activeSheet, searchQuery, selectedDifficulty, selectedStatus, selectedPlatform, sortBy]);

  // Total matching questions after filter
  const totalMatchingQuestions = useMemo(() => {
    return Object.values(groupedQuestions).reduce((acc, curr) => acc + curr.length, 0);
  }, [groupedQuestions]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedDifficulty !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedPlatform !== 'ALL' ||
    sortBy !== 'DEFAULT';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('ALL');
    setSelectedStatus('ALL');
    setSelectedPlatform('ALL');
    setSortBy('DEFAULT');
  };

  // 365-Day Activity Calendar Matrix Helpers
  const calendarDays = useMemo(() => {
    if (myRankInfo?.recentDays && myRankInfo.recentDays.length >= 365) {
      return myRankInfo.recentDays;
    }
    const now = new Date();
    const days: DailySolveSummary[] = [];
    for (let i = 364; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = day.toISOString().split('T')[0];
      days.push({ date: dayKey, count: 0, status: 'NONE' });
    }
    return days;
  }, [myRankInfo]);

  // Aggregate stats for 365 days
  const calendarStats = useMemo(() => {
    const total365Solves = calendarDays.reduce((acc, d) => acc + d.count, 0);
    const activeDays = calendarDays.filter((d) => d.count > 0).length;
    const fireDays = calendarDays.filter((d) => d.count >= 5).length;
    return {
      total365Solves,
      activeDays,
      fireDays,
      maxStreak: myRankInfo?.highestStreak ?? 0,
      currentStreak: myRankInfo?.currentStreak ?? 0,
    };
  }, [calendarDays, myRankInfo]);

  // Group into ~53 weeks with 7 days each (Mon to Sun)
  const calendarWeeks = useMemo(() => {
    if (calendarDays.length === 0) return [];
    const weeks: { days: (DailySolveSummary | null)[] }[] = [];
    let currentWeek: (DailySolveSummary | null)[] = [];

    // The first day's day of week
    const firstDate = new Date(calendarDays[0].date + 'T00:00:00Z');
    const startDayOfWeek = (firstDate.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (const day of calendarDays) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push({ days: currentWeek });
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push({ days: currentWeek });
    }

    return weeks;
  }, [calendarDays]);

  // Month labels mapped by week column index
  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; name: string }[] = [];
    let lastMonth = -1;
    let lastWeekIndex = -10;

    calendarWeeks.forEach((week, wIdx) => {
      const firstValidDay = week.days.find((d) => d !== null);
      if (firstValidDay) {
        const d = new Date(firstValidDay.date + 'T00:00:00Z');
        const m = d.getUTCMonth();
        if (m !== lastMonth) {
          const monthName = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
          if (wIdx - lastWeekIndex < 3) {
            // Collision detected! If the previous label was at index 0, replace it with this month
            if (labels.length > 0 && lastWeekIndex === 0) {
              labels[labels.length - 1] = { weekIndex: wIdx, name: monthName };
              lastWeekIndex = wIdx;
              lastMonth = m;
            }
          } else {
            labels.push({ weekIndex: wIdx, name: monthName });
            lastWeekIndex = wIdx;
            lastMonth = m;
          }
        }
      }
    });

    return labels;
  }, [calendarWeeks]);

  // Pick Random Problem handler for Knowledge Sheet
  const handlePickRandomProblem = () => {
    if (questions.length === 0) return;

    // Prioritize uncompleted questions
    const uncompleted = questions.filter((q) => !completedMap[q.id]);
    const pool = uncompleted.length > 0 ? uncompleted : questions;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];

    setRandomPickedQuestion(chosen);

    // Ensure the group accordion for this problem is opened
    const groupKey =
      activeSheet === 'CP_SHEET'
        ? chosen.rating
          ? `Rating: ${chosen.rating}`
          : 'Unrated Challenges'
        : chosen.topic ||
          (activeSheet === 'KNOWLEDGE_SHEET' ? 'General Practice' : 'General Algorithms');

    setExpandedSections((prev) => ({
      ...prev,
      [groupKey]: true,
    }));

    // Smooth scroll into view and highlight
    setTimeout(() => {
      const el = document.getElementById(`question-card-${chosen.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass-card border border-white/10 p-6 sm:p-8 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-cyan-500/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Code2 className="w-3.5 h-3.5" />
              Algorithmic Mastery Hub
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Code &amp; Coffee <span className="gradient-text-amber">Practice Arena</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Curated problem sheets benchmarked for Tier-1 Tech Interviews and Competitive Programming.
              Track your daily solve streak, earn 10 points per solve, and climb the Global Leaderboard!
            </p>
          </div>

          {/* Quick Metrics Badges (LeetCode-Style Streak & Points) */}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full 2xl:w-auto shrink-0">
            {/* LeetCode Daily Streak Widget */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 bg-black/60 space-y-2.5 w-full sm:w-[290px] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-xl ${
                      myRankInfo?.todayStatus === 'FIRE'
                        ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/40 animate-pulse'
                        : (myRankInfo?.currentStreak ?? 0) > 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/5'
                    }`}
                  >
                    {/* CRITICAL: ONLY SHOW FLAME ICON IF TODAY SOLVES >= 5! If 1-4 or streak > 5, show Zap/Target/Check, NEVER flame! */}
                    {myRankInfo?.todayStatus === 'FIRE' ? (
                      <Flame className="w-5 h-5 text-white" />
                    ) : (myRankInfo?.currentStreak ?? 0) > 0 ? (
                      <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Zap className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Daily Streak
                    </div>
                    <div className="text-xl font-extrabold text-white font-mono flex items-center gap-1.5">
                      <span>{myRankInfo?.currentStreak ?? 0}</span>
                      <span className="text-xs text-gray-400 font-sans font-normal">
                        {(myRankInfo?.currentStreak ?? 0) === 1 ? 'Day' : 'Days'}
                      </span>
                      {/* CRITICAL USER REQUIREMENT:
                          "dont change to fire imoji for more then 5 days steck only change if problem done 5 or more then 5"
                      */}
                      {myRankInfo?.todayStatus === 'FIRE' ? (
                        <span className="text-base" title="🔥 Fire Day! (5+ problems solved today)">🔥</span>
                      ) : (myRankInfo?.currentStreak ?? 0) > 0 ? (
                        <span className="text-xs text-emerald-400 font-mono font-bold" title="🟢 Active Streak (1-4 problems solved today)">🟢</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-gray-400 font-mono">Highest Streak</div>
                  <div className="text-xs font-bold text-amber-400 font-mono flex items-center justify-end gap-1">
                    <Trophy className="w-3 h-3" />
                    {myRankInfo?.highestStreak ?? 0}d
                  </div>
                </div>
              </div>

              {/* Status summary */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-gray-400">Today&apos;s Solves:</span>
                <span>
                  {myRankInfo?.todayStatus === 'FIRE' ? (
                    <span className="text-orange-400 font-bold flex items-center gap-1">
                      🔥 {myRankInfo.todaySolves} Solved (Fire Active)
                    </span>
                  ) : (myRankInfo?.todaySolves ?? 0) > 0 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      🟢 {myRankInfo?.todaySolves} Solved (Normal)
                    </span>
                  ) : (
                    <span className="text-gray-400">0 Solved (Solve 1 to extend)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Total Points & Sheet Progress Card */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 bg-black/60 space-y-2.5 w-full sm:w-[290px] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20">
                    <Award className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Earned Points
                    </div>
                    <div className="text-xl font-extrabold text-amber-400 font-mono flex items-baseline gap-1">
                      <span>{myRankInfo?.points ?? (Object.values(completedMap).filter(Boolean).length * 10)}</span>
                      <span className="text-xs text-gray-400 font-sans font-normal">pts</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-gray-400 font-mono">Global Rank</div>
                  <div className="text-sm font-bold text-white font-mono flex items-center justify-end gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    {myRankInfo ? `#${myRankInfo.rank}` : 'Unranked'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-300">
                  <span>{activeSheet === 'LEADERBOARD' ? 'Global Solvers' : 'Sheet Progress'}</span>
                  <span className="text-amber-400 font-mono">
                    {activeSheet === 'LEADERBOARD' ? `${leaderboardData.length} Users` : `${sheetStats.percentage}% (${sheetStats.completed}/${sheetStats.total})`}
                  </span>
                </div>
                {activeSheet !== 'LEADERBOARD' ? (
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${sheetStats.percentage}%` }}
                    />
                  </div>
                ) : null}
                <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between">
                  <span className="text-amber-400/90 font-semibold">10 pts / problem</span>
                  <span>{sheetStats.completed} completed in sheet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 365-Day Problem Solve Activity Matrix */}
      <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header with Title and Telemetry Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              365-Day Problem Solve Activity Matrix
            </h2>
          </div>

          {/* Metric Quick Chips */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300">
              <span className="text-amber-500 dark:text-amber-400 font-bold">{calendarStats.total365Solves}</span> Solves
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <span className="font-bold">{calendarStats.activeDays}</span> Active Days
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
              <span className="font-bold">🔥 {calendarStats.fireDays}</span> Fire Days (≥5 solves)
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <span className="font-bold">🏆 {calendarStats.maxStreak}d</span> Longest Streak
            </div>
          </div>
        </div>

        {/* Heatmap Grid with Month Headers */}
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="min-w-[840px] space-y-1.5">
            {/* Month Labels Bar */}
            <div className="text-[10px] text-slate-500 dark:text-gray-400 font-mono h-4 relative pl-7">
              {monthLabels.map((ml) => (
                <div
                  key={ml.name + ml.weekIndex}
                  style={{ left: `${ml.weekIndex * 16}px` }}
                  className="absolute whitespace-nowrap font-semibold text-slate-500 dark:text-gray-400"
                >
                  {ml.name}
                </div>
              ))}
            </div>

            {/* Week Columns & Day Rows */}
            <div className="flex items-start gap-2">
              {/* Day of Week Labels (Mon, Wed, Fri) */}
              <div className="flex flex-col gap-1 text-[9px] text-slate-400 dark:text-gray-500 font-mono pt-0.5 w-5 text-right select-none">
                <span className="h-[12px] leading-[12px]">Mon</span>
                <span className="h-[12px] leading-[12px]" />
                <span className="h-[12px] leading-[12px]">Wed</span>
                <span className="h-[12px] leading-[12px]" />
                <span className="h-[12px] leading-[12px]">Fri</span>
                <span className="h-[12px] leading-[12px]" />
                <span className="h-[12px] leading-[12px]" />
              </div>

              {/* 53 Columns x 7 Rows */}
              <div className="flex gap-1">
                {calendarWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.days.map((day, dIdx) => {
                      if (!day) {
                        return <div key={`empty-${dIdx}`} className="w-[12px] h-[12px]" />;
                      }

                      const isFire = day.status === 'FIRE';
                      const isNormal = day.status === 'NORMAL';

                      const tooltip = `${day.date}: ${day.count} ${
                        day.count === 1 ? 'problem' : 'problems'
                      } solved ${
                        isFire
                          ? '(🔥 Fire Day: ≥5 solves)'
                          : isNormal
                          ? '(🟢 Normal Streak Day: 1-4 solves)'
                          : '(0 solves)'
                      }`;

                      return (
                        <div
                          key={day.date}
                          title={tooltip}
                          className={`w-[12px] h-[12px] rounded-[3px] transition-all cursor-pointer flex items-center justify-center text-[7px] ${
                            isFire
                              ? 'activity-day-fire hover:scale-150 z-10'
                              : isNormal
                              ? 'activity-day-normal hover:scale-125 z-10'
                              : 'activity-day-empty'
                          }`}
                        >
                          {isFire ? '🔥' : ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Legend and Rule Clarification */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-white/5 text-xs text-slate-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <span>
              Fire icon (<strong className="text-orange-500">🔥</strong>) triggers <em>ONLY</em> when 5 or more problems are solved on a single day. Daily streaks (even &gt;5 days) remain normal green (🟢) unless 5+ problems are solved today.
            </span>
          </div>

          {/* Legend Dots */}
          <div className="flex items-center gap-2 text-[11px] font-mono self-end sm:self-auto text-slate-600 dark:text-gray-300">
            <span>0 Solved</span>
            <div className="w-3 h-3 rounded-[3px] activity-day-empty" />
            <span className="ml-1">1-4 Solved</span>
            <div className="w-3 h-3 rounded-[3px] activity-day-normal" />
            <span className="ml-1">≥5 Solved</span>
            <div className="w-3 h-3 rounded-[3px] activity-day-fire flex items-center justify-center text-[6px]">
              🔥
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none">
        <button
          onClick={() => setActiveSheet('CRACK_THE_INTERVIEW')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap ${
            activeSheet === 'CRACK_THE_INTERVIEW'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
              : 'glass-card text-gray-300 hover:text-white hover:bg-white/5 border border-white/10'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>1. Crack the Interview</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-black/30">
            Topic-Wise
          </span>
        </button>

        <button
          onClick={() => setActiveSheet('SDE_SHEET')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap ${
            activeSheet === 'SDE_SHEET'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
              : 'glass-card text-gray-300 hover:text-white hover:bg-white/5 border border-white/10'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. SDE Sheet</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-black/30">
            LeetCode
          </span>
        </button>

        <button
          onClick={() => setActiveSheet('CP_SHEET')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap ${
            activeSheet === 'CP_SHEET'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
              : 'glass-card text-gray-300 hover:text-white hover:bg-white/5 border border-white/10'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>3. CP Sheet</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-black/30">
            Rating-Wise
          </span>
        </button>

        <button
          onClick={() => setActiveSheet('KNOWLEDGE_SHEET')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap ${
            activeSheet === 'KNOWLEDGE_SHEET'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
              : 'glass-card text-gray-300 hover:text-white hover:bg-white/5 border border-white/10'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>4. Knowledge Sheet</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-black/30">
            Random Practice &amp; Pool
          </span>
        </button>

        <button
          onClick={() => setActiveSheet('LEADERBOARD')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap ${
            activeSheet === 'LEADERBOARD'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
              : 'glass-card text-gray-300 hover:text-white hover:bg-white/5 border border-white/10'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>5. Global Leaderboard</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-black/30">
            Top Solvers &amp; Streaks
          </span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls Bar (Hidden on Leaderboard) */}
      {activeSheet !== 'LEADERBOARD' && (
        <>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 glass-card rounded-2xl border border-white/10 bg-white/[0.02]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems, topics, or ratings..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs glass-card border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter and Sort Group */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-[11px] font-bold text-gray-400 hidden xl:inline">Level:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs glass-card border border-white/10 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
              title="Filter by Difficulty Level"
            >
              <option value="ALL">All Levels</option>
              <option value="EASY">🟢 Easy</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HARD">🔴 Hard</option>
            </select>
          </div>

          {/* Status Filter (Complete / Uncomplete) */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-[11px] font-bold text-gray-400 hidden xl:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs glass-card border border-white/10 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
              title="Filter by Completion Status"
            >
              <option value="ALL">All Status</option>
              <option value="UNCOMPLETED">⭕ Uncompleted</option>
              <option value="COMPLETED">✅ Completed</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-[11px] font-bold text-gray-400 hidden xl:inline">Platform:</span>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs glass-card border border-white/10 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
              title="Filter by Platform"
            >
              <option value="ALL">All Platforms</option>
              <option value="LeetCode">LeetCode</option>
              <option value="Self-Created (Code & Coffee)">Self-Created</option>
              <option value="Internal">Internal (Readme)</option>
              <option value="Codeforces">Codeforces</option>
              <option value="CodeChef">CodeChef</option>
            </select>
          </div>

          {/* Sort Option (Level & Complete/Uncomplete) */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-amber-400 hidden sm:flex">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs glass-card border border-amber-500/25 text-amber-300 bg-slate-900 focus:outline-none focus:border-amber-400 font-semibold"
              title="Sort questions by Level or Completion Status"
            >
              <option value="DEFAULT">↕️ Curated Order</option>
              <option value="LEVEL_ASC">🟢 Level: Easy ➔ Hard</option>
              <option value="LEVEL_DESC">🔴 Level: Hard ➔ Easy</option>
              <option value="UNSOLVED_FIRST">⭕ Incomplete First</option>
              <option value="SOLVED_FIRST">✅ Completed First</option>
              <option value="TITLE_ASC">🔤 Title: A ➔ Z</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors whitespace-nowrap"
              title="Reset all filters and sorting"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Stats & Active Chips */}
      <div className="flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-gray-300">
            Showing <strong className="text-amber-400">{totalMatchingQuestions}</strong> of {questions.length} problems
          </span>

          {selectedDifficulty !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Level: {selectedDifficulty}
              <button onClick={() => setSelectedDifficulty('ALL')} className="hover:text-white ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {selectedStatus !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Status: {selectedStatus}
              <button onClick={() => setSelectedStatus('ALL')} className="hover:text-white ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {selectedPlatform !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Platform: {selectedPlatform}
              <button onClick={() => setSelectedPlatform('ALL')} className="hover:text-white ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {sortBy !== 'DEFAULT' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Sorted: {
                sortBy === 'LEVEL_ASC' ? 'Level: Easy ➔ Hard' :
                sortBy === 'LEVEL_DESC' ? 'Level: Hard ➔ Easy' :
                sortBy === 'UNSOLVED_FIRST' ? 'Incomplete First' :
                sortBy === 'SOLVED_FIRST' ? 'Completed First' : 'Title: A-Z'
              }
              <button onClick={() => setSortBy('DEFAULT')} className="hover:text-white ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-emerald-400">● {sheetStats.completed} Solved</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">○ {sheetStats.total - sheetStats.completed} Pending</span>
        </div>
      </div>

      {/* Sheet Description Sub-banner */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs text-gray-300">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>
            {activeSheet === 'CRACK_THE_INTERVIEW' &&
              'Curated interview questions organized by Topic with in-depth Readme problem statements, sample testcases, and optimal time-space proofs.'}
            {activeSheet === 'SDE_SHEET' &&
              'The most-frequently asked SDE interview problems with direct links to LeetCode for live execution and submission.'}
            {activeSheet === 'CP_SHEET' &&
              'Competitive programming challenges sequenced by Rating (Codeforces & CodeChef) to build problem-solving muscle from Div 4 up to Div 1.'}
          </span>
        </div>
        {!user && (
          <span className="hidden md:inline-flex text-[11px] text-amber-400 font-mono">
            💡 Progress saved locally (Sign in to sync across devices)
          </span>
        )}
      </div>
    </>
  )}

      {/* Content Area */}
      {activeSheet === 'LEADERBOARD' ? (
        /* ============================================================ */
        /* GLOBAL LEADERBOARD & STREAKS TAB */
        /* ============================================================ */
        <div className="space-y-8 animate-fade-in">
          {/* Rules & Scoring Banner */}
          <div className="p-5 rounded-2xl glass-card border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-purple-500/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20">
                  <Trophy className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Global Solvers League &amp; Daily Streaks
                  </h3>
                  <p className="text-xs text-gray-300">
                    Solve daily problems to build consecutive streaks like LeetCode and climb the global ranks!
                  </p>
                </div>
              </div>

              {/* Rules Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-amber-300" />
                  +10 pts / Problem
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  🟢 1-4 Solves = Normal Day
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1.5 animate-pulse">
                  🔥 ≥5 Solves = Fire Day
                </span>
              </div>
            </div>
          </div>

          {/* Top 3 Podium & Leaderboard Table */}
          {loadingLeaderboard ? (
            <PracticeLeaderboardSkeleton />
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboardData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 items-end">
              {/* Rank 2 - Silver (Left) */}
              {leaderboardData[1] && (
                <div className="glass-card rounded-2xl border border-slate-300/30 bg-gradient-to-b from-slate-400/10 to-transparent p-6 text-center space-y-3 relative order-2 md:order-1 hover:border-slate-300/50 transition-all">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-300 text-slate-950 shadow-md">
                    🥈 Rank #2
                  </div>
                  <div className="relative inline-block mt-2">
                    <img
                      src={
                        leaderboardData[1].avatar ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                          leaderboardData[1].name
                        )}`
                      }
                      alt={leaderboardData[1].name}
                      className="w-16 h-16 rounded-full mx-auto border-2 border-slate-300 shadow-lg object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-300 text-slate-950">
                      <Medal className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white truncate">
                      {leaderboardData[1].name}
                    </h4>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">
                      {leaderboardData[1].role}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="text-xl font-extrabold text-amber-400 font-mono">
                      {leaderboardData[1].points} <span className="text-xs font-normal text-gray-400">pts</span>
                    </div>
                    <div className="text-xs text-gray-300 font-mono">
                      {leaderboardData[1].totalCompleted} Problems Solved
                    </div>
                    <div className="text-[11px] font-mono text-gray-400 flex items-center justify-center gap-1.5 pt-1">
                      <span>Streak: {leaderboardData[1].currentStreak}d {leaderboardData[1].todayStatus === 'FIRE' ? '🔥' : '🟢'}</span>
                      <span>•</span>
                      <span>Max: {leaderboardData[1].highestStreak}d</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rank 1 - Gold (Center, Elevated) */}
              {leaderboardData[0] && (
                <div className="glass-card rounded-2xl border-2 border-amber-400/50 bg-gradient-to-b from-amber-500/20 via-black/40 to-black/60 p-7 text-center space-y-3.5 relative order-1 md:order-2 shadow-xl shadow-amber-500/20 md:-translate-y-3 hover:border-amber-400 transition-all">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-extrabold font-mono bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 fill-slate-950" />
                    🥇 Champion #1
                  </div>
                  <div className="relative inline-block mt-3">
                    <img
                      src={
                        leaderboardData[0].avatar ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                          leaderboardData[0].name
                        )}`
                      }
                      alt={leaderboardData[0].name}
                      className="w-20 h-20 rounded-full mx-auto border-3 border-amber-400 shadow-xl object-cover ring-4 ring-amber-400/20"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-400 text-slate-950 shadow-md">
                      <Crown className="w-4 h-4 fill-slate-950" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white truncate">
                      {leaderboardData[0].name}
                    </h4>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {leaderboardData[0].role}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 space-y-1">
                    <div className="text-2xl font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                      <Zap className="w-5 h-5 fill-amber-400" />
                      {leaderboardData[0].points} <span className="text-xs font-normal text-gray-400">pts</span>
                    </div>
                    <div className="text-xs text-white font-mono font-semibold">
                      {leaderboardData[0].totalCompleted} Problems Mastered
                    </div>
                    <div className="text-xs font-mono text-emerald-400 flex items-center justify-center gap-2 pt-1">
                      <span className="flex items-center gap-1">
                        Current Streak: <strong>{leaderboardData[0].currentStreak}d</strong>
                        {leaderboardData[0].todayStatus === 'FIRE' ? '🔥' : '🟢'}
                      </span>
                      <span>•</span>
                      <span>Max: <strong>{leaderboardData[0].highestStreak}d</strong></span>
                    </div>
                    {leaderboardData[0].fireDaysCount > 0 && (
                      <div className="text-[10px] text-orange-400 font-mono">
                        🔥 {leaderboardData[0].fireDaysCount} Fire Days (≥5 solves/day)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rank 3 - Bronze (Right) */}
              {leaderboardData[2] && (
                <div className="glass-card rounded-2xl border border-amber-700/40 bg-gradient-to-b from-amber-700/15 to-transparent p-6 text-center space-y-3 relative order-3 md:order-3 hover:border-amber-700/60 transition-all">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-700 text-white shadow-md">
                    🥉 Rank #3
                  </div>
                  <div className="relative inline-block mt-2">
                    <img
                      src={
                        leaderboardData[2].avatar ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                          leaderboardData[2].name
                        )}`
                      }
                      alt={leaderboardData[2].name}
                      className="w-16 h-16 rounded-full mx-auto border-2 border-amber-700 shadow-lg object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-700 text-white">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white truncate">
                      {leaderboardData[2].name}
                    </h4>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">
                      {leaderboardData[2].role}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="text-xl font-extrabold text-amber-400 font-mono">
                      {leaderboardData[2].points} <span className="text-xs font-normal text-gray-400">pts</span>
                    </div>
                    <div className="text-xs text-gray-300 font-mono">
                      {leaderboardData[2].totalCompleted} Problems Solved
                    </div>
                    <div className="text-[11px] font-mono text-gray-400 flex items-center justify-center gap-1.5 pt-1">
                      <span>Streak: {leaderboardData[2].currentStreak}d {leaderboardData[2].todayStatus === 'FIRE' ? '🔥' : '🟢'}</span>
                      <span>•</span>
                      <span>Max: {leaderboardData[2].highestStreak}d</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User's Own Standing Card (If Logged In) */}
          {user && myRankInfo && (
            <div className="p-4 rounded-2xl glass-card border border-amber-500/30 bg-amber-500/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-mono font-black text-sm">
                  #{myRankInfo.rank}
                </div>
                <div>
                  <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                    Your Current Standing
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{myRankInfo.name}</span>
                    <span className="text-xs text-gray-400 font-mono">
                      ({myRankInfo.points} pts • {myRankInfo.totalCompleted} solved)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-200">
                  Current Streak: <strong className="text-white">{myRankInfo.currentStreak}d</strong> {myRankInfo.todayStatus === 'FIRE' ? '🔥' : '🟢'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-amber-300">
                  Best: <strong className="text-white">{myRankInfo.highestStreak}d</strong>
                </span>
              </div>
            </div>
          )}

          {/* Search Table Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 glass-card rounded-2xl border border-white/10">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={leaderboardSearch}
                onChange={(e) => setLeaderboardSearch(e.target.value)}
                placeholder="Search solver by name..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs glass-card border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
              {leaderboardSearch && (
                <button
                  onClick={() => setLeaderboardSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
              <span>Total Solvers: <strong className="text-amber-400">{filteredLeaderboard.length}</strong></span>
              <span>•</span>
              <button
                onClick={loadLeaderboard}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                title="Refresh Leaderboard"
              >
                <RotateCcw className="w-3 h-3" /> Refresh
              </button>
            </div>
          </div>

          {/* Full Solvers Table */}
          {filteredLeaderboard.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl border border-white/10 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No solvers match search</h3>
              <p className="text-gray-400 text-xs">Try clearing the search query.</p>
            </div>
          ) : (
            <>
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                      <th className="px-5 py-3.5 text-center">Rank</th>
                      <th className="px-5 py-3.5">Coder</th>
                      <th className="px-5 py-3.5 text-center">Problems Solved</th>
                      <th className="px-5 py-3.5 text-center">Total Score</th>
                      <th className="px-5 py-3.5 text-center">Current Streak</th>
                      <th className="px-5 py-3.5 text-center">Max Streak</th>
                      <th className="px-5 py-3.5 text-center">Fire Days (≥5)</th>
                      <th className="px-5 py-3.5 text-center">14-Day Activity</th>
                      <th className="px-5 py-3.5 text-right">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {paginatedLeaderboard.map((coder) => {
                      const isMe = user?.id === coder.id;
                      return (
                        <tr
                          key={coder.id}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.12] border-l-2 border-l-amber-400'
                              : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          {/* Rank */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-center font-mono font-bold">
                            {coder.rank === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black shadow-sm">
                                🥇 #1
                              </span>
                            ) : coder.rank === 2 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-300 text-slate-950 font-black shadow-sm">
                                🥈 #2
                              </span>
                            ) : coder.rank === 3 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-700 text-white font-black shadow-sm">
                                🥉 #3
                              </span>
                            ) : (
                              <span className="text-gray-400">#{coder.rank}</span>
                            )}
                          </td>

                          {/* Coder */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  coder.avatar ||
                                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                                    coder.name
                                  )}`
                                }
                                alt={coder.name}
                                className="w-8 h-8 rounded-full border border-white/20 object-cover"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                  <span>{coder.name}</span>
                                  {isMe && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-400 text-slate-950">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">
                                  {coder.role}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Problems Solved */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-center font-mono">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-white/5 text-gray-200 border border-white/10">
                              {coder.totalCompleted} solved
                            </span>
                            {(coder.crackCount > 0 || coder.sdeCount > 0 || coder.cpCount > 0 || (coder.knowledgeCount ?? 0) > 0) && (
                              <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400 mt-1">
                                {coder.crackCount > 0 && <span>Int: {coder.crackCount}</span>}
                                {coder.sdeCount > 0 && <span>• SDE: {coder.sdeCount}</span>}
                                {coder.cpCount > 0 && <span>• CP: {coder.cpCount}</span>}
                                {(coder.knowledgeCount ?? 0) > 0 && <span>• Know: {coder.knowledgeCount}</span>}
                              </div>
                            )}
                          </td>

                          {/* Total Score */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-center font-mono">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Zap className="w-3.5 h-3.5 fill-amber-300" />
                              {coder.points} pts
                            </span>
                          </td>

                          {/* Current Streak */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-center font-mono">
                            {coder.currentStreak > 0 ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                                  coder.todayStatus === 'FIRE'
                                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm shadow-orange-500/20'
                                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                }`}
                                title={
                                  coder.todayStatus === 'FIRE'
                                    ? '🔥 Fire Day Active! (≥5 problems solved today)'
                                    : '🟢 Active solve streak'
                                }
                              >
                                {coder.todayStatus === 'FIRE' ? '🔥' : '🟢'}
                                {coder.currentStreak} {coder.currentStreak === 1 ? 'day' : 'days'}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">0 days</span>
                            )}
                          </td>

                          {/* Highest Streak */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-center font-mono text-gray-300">
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              {coder.highestStreak}d
                            </span>
                          </td>

                          {/* Fire Days */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-center font-mono">
                            {coder.fireDaysCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20">
                                🔥 {coder.fireDaysCount}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>

                          {/* 14-Day Activity Matrix */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-center">
                            <div className="inline-flex items-center gap-1">
                              {(coder.recentDays || []).slice(-14).map((d, i) => (
                                <div
                                  key={d.date || i}
                                  title={`${d.date}: ${d.count} solved ${
                                    d.status === 'FIRE'
                                      ? '(🔥 Fire Day: ≥5 solves)'
                                      : d.status === 'NORMAL'
                                      ? '(🟢 Normal Day: 1-4 solves)'
                                      : '(0 solves)'
                                  }`}
                                  className={`w-3 h-3 rounded-xs flex items-center justify-center text-[7px] ${
                                    d.status === 'FIRE'
                                      ? 'activity-day-fire'
                                      : d.status === 'NORMAL'
                                      ? 'activity-day-normal'
                                      : 'activity-day-empty'
                                  }`}
                                >
                                  {d.status === 'FIRE' ? '🔥' : ''}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Last Active */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono text-[11px] text-gray-400">
                            {formatRelativeTime(coder.lastActive)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leaderboard Pagination */}
            {filteredLeaderboard.length > 0 && (
              <Pagination
                currentPage={leaderboardPage}
                totalPages={totalLeaderboardPages}
                totalItems={filteredLeaderboard.length}
                pageSize={leaderboardPageSize}
                pageSizeOptions={[10, 20, 50, 100]}
                onPageChange={setLeaderboardPage}
                onPageSizeChange={setLeaderboardPageSize}
                itemLabel="solvers"
                className="mt-4"
              />
            )}
            </>
          )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Knowledge Sheet Random Practice Arena Banner */}
          {activeSheet === 'KNOWLEDGE_SHEET' && (
            <div className="glass-card rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-cyan-500/10 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      Knowledge Sheet &amp; Random Problem Arena
                    </h2>
                  </div>
                  <p className="text-xs text-gray-300">
                    Comprehensive master collection of LeetCode problems and Self-Created engineering challenges for spontaneous and targeted practice.
                  </p>
                </div>

                {/* Pick Random Problem Button */}
                <button
                  onClick={handlePickRandomProblem}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>🎲 Pick Random Problem</span>
                </button>
              </div>

              {/* Highlight Banner if a Random Problem was selected */}
              {randomPickedQuestion && (
                <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs min-w-0">
                    <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 animate-spin" />
                    <div className="truncate">
                      <span className="text-gray-300">Random Pick: </span>
                      <strong className="text-white font-bold">{randomPickedQuestion.title}</strong>
                      <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-amber-300">
                        {randomPickedQuestion.difficulty}
                      </span>
                      <span className="ml-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-cyan-300">
                        {randomPickedQuestion.platform}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    {randomPickedQuestion.content && (
                      <button
                        onClick={() => setActiveReadmeQuestion(randomPickedQuestion)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                      >
                        📖 Read Problem
                      </button>
                    )}
                    {randomPickedQuestion.externalUrl && (
                      <a
                        href={randomPickedQuestion.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          const targetSheet = randomPickedQuestion.sheetType || activeSheet;
                          if (
                            (targetSheet === 'SDE_SHEET' && user && !user.leetcodeUrl) ||
                            (targetSheet === 'CP_SHEET' && user && (!user.codeforcesUrl || !user.codechefUrl))
                          ) {
                            e.preventDefault();
                            executeWithProfileCheck(targetSheet, () => {
                              window.open(randomPickedQuestion.externalUrl!, '_blank');
                            });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Solve on {randomPickedQuestion.platform}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleToggleComplete(randomPickedQuestion.id, randomPickedQuestion.sheetType)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                        completedMap[randomPickedQuestion.id]
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{completedMap[randomPickedQuestion.id] ? 'Completed (+10 pts)' : 'Mark Done (+10 pts)'}</span>
                    </button>
                    <button
                      onClick={handlePickRandomProblem}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10"
                      title="Pick another random problem"
                    >
                      🎲 Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <PracticeQuestionsSkeleton />
          ) : Object.keys(groupedQuestions).length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">
              {questions.length === 0
                ? 'This sheet is currently blank'
                : 'No matching problems found'}
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              {questions.length === 0
                ? 'No questions added to this sheet yet. Practice Chapter 1 (Arrays & Strings) in "Crack the Interview" or add new problems from the Admin Panel.'
                : 'Try adjusting your search query, difficulty level, or completion status filters.'}
            </p>
          </div>
          {questions.length === 0 ? (
            <button
              onClick={() => setActiveSheet('CRACK_THE_INTERVIEW')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <span>Explore Crack the Interview (Arrays &amp; Strings)</span>
            </button>
          ) : hasActiveFilters ? (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedGroupEntries.map(([groupTitle, items]) => {
            const isExpanded = isGroupExpanded(groupTitle);
            const groupCompleted = items.filter((it) => completedMap[it.id]).length;

            return (
              <div
                key={groupTitle}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all duration-200"
              >
                {/* Group Accordion Header */}
                <button
                  onClick={() => toggleGroup(groupTitle)}
                  className="w-full px-5 py-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {activeSheet === 'CP_SHEET' ? (
                        <Award className="w-4 h-4" />
                      ) : (
                        <Flame className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {groupTitle}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-gray-300">
                          {items.length} {items.length === 1 ? 'problem' : 'problems'}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400">
                      {groupCompleted}/{items.length} Solved
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Group Questions List */}
                {isExpanded && (
                  <div className="divide-y divide-white/5">
                    {items.map((item, idx) => {
                      const isDone = Boolean(completedMap[item.id]);
                      const hasNote = Boolean(notesMap[item.id]);

                      return (
                        <div
                          id={`question-card-${item.id}`}
                          key={item.id}
                          className={`p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all rounded-xl ${
                            randomPickedQuestion?.id === item.id
                              ? 'ring-2 ring-amber-400 bg-amber-500/[0.12] shadow-lg shadow-amber-500/20'
                              : isDone
                              ? 'bg-green-500/[0.03]'
                              : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          {/* Left: Checkmark + Title + Tags */}
                          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                            {/* Checkmark Button */}
                            <button
                              onClick={() => handleToggleComplete(item.id, item.sheetType)}
                              className={`p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none cursor-pointer ${
                                isDone ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
                              }`}
                              title={isDone ? 'Mark as Incomplete' : 'Mark as Done'}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5 fill-green-500/20" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-semibold truncate ${
                                    isDone ? 'line-through text-gray-400' : 'text-white'
                                  }`}
                                >
                                  {idx + 1}. {item.title}
                                </span>

                                {/* Difficulty Badge */}
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                                    item.difficulty === 'EASY'
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                      : item.difficulty === 'MEDIUM'
                                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                  }`}
                                >
                                  {item.difficulty}
                                </span>

                                {/* Platform Badge */}
                                {item.platform && (
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                      item.platform === 'Codeforces'
                                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                        : item.platform === 'CodeChef'
                                        ? 'bg-amber-700/20 text-amber-300 border-amber-700/30'
                                        : item.platform === 'Self-Created (Code & Coffee)' || item.platform === 'Internal'
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                        : 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                                    }`}
                                  >
                                    {item.platform}
                                  </span>
                                )}

                                {hasNote && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                                    <StickyNote className="w-3 h-3" /> Note Saved
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions (Readme / Link / Notes / Video / Solution) */}
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                            {/* Readme Button (for questions with Markdown editorial/statement) */}
                            {item.content && (
                              <button
                                onClick={() => setActiveReadmeQuestion(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-[1.02]"
                                title="Read problem statement and optimal approach breakdown"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Read Problem</span>
                              </button>
                            )}

                            {/* External Link (Solve on LeetCode / Platform) */}
                            {item.externalUrl && (
                              <a
                                href={item.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  const targetSheet = item.sheetType || activeSheet;
                                  if (
                                    (targetSheet === 'SDE_SHEET' && user && !user.leetcodeUrl) ||
                                    (targetSheet === 'CP_SHEET' && user && (!user.codeforcesUrl || !user.codechefUrl))
                                  ) {
                                    e.preventDefault();
                                    executeWithProfileCheck(targetSheet, () => {
                                      window.open(item.externalUrl!, '_blank');
                                    });
                                  }
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer ${
                                  item.platform === 'LeetCode' || item.externalUrl.includes('leetcode')
                                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10'
                                }`}
                                title={`Solve on ${item.platform || (item.externalUrl.includes('leetcode') ? 'LeetCode' : 'Platform')}`}
                              >
                                <span>Solve on {item.platform || (item.externalUrl.includes('leetcode') ? 'LeetCode' : 'Platform')}</span>
                                <ExternalLink className="w-3 h-3 text-amber-400" />
                              </a>
                            )}

                            {/* Revision Notes Button */}
                            <button
                              onClick={() => handleOpenNote(item)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                hasNote
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-white/5 text-gray-300 hover:text-white border-white/10 hover:bg-white/10'
                              }`}
                              title="Write or edit personal revision note"
                            >
                              <StickyNote className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Notes</span>
                            </button>

                            {/* Solution Video Button (Coming soon) */}
                            <button
                              onClick={() =>
                                setComingSoonModal({
                                  open: true,
                                  type: 'video',
                                  questionTitle: item.title,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 transition-colors"
                              title="Solution Video (Coming Soon)"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Video</span>
                            </button>

                            {/* Solution Notes Button (Coming soon) */}
                            <button
                              onClick={() =>
                                setComingSoonModal({
                                  open: true,
                                  type: 'notes',
                                  questionTitle: item.title,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-blue-300 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 transition-colors"
                              title="Solution Editorial Notes (Coming Soon)"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Editorial</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Group-based Pagination for Questions */}
          {groupEntries.length > 0 && (
            <Pagination
              currentPage={groupPage}
              totalPages={totalGroupPages}
              totalItems={groupEntries.length}
              pageSize={groupsPerPage}
              pageSizeOptions={[3, 4, 5, 8, 10]}
              onPageChange={setGroupPage}
              onPageSizeChange={setGroupsPerPage}
              itemLabel="topic sections"
              className="mt-6"
            />
          )}
        </div>
      )}
    </>
  )}

      {/* ============================================================ */}
      {/* README MODAL FOR CRACK THE INTERVIEW */}
      {/* ============================================================ */}
      {activeReadmeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] glass-card rounded-3xl border border-white/20 flex flex-col overflow-hidden shadow-2xl bg-slate-950/95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white truncate">
                    {activeReadmeQuestion.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Topic: {activeReadmeQuestion.topic || 'General'}</span>
                    <span>•</span>
                    <span className="uppercase text-amber-400 font-mono">
                      {activeReadmeQuestion.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-end">
                {activeReadmeQuestion.externalUrl && (
                  <a
                    href={activeReadmeQuestion.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      const targetSheet = activeReadmeQuestion.sheetType || activeSheet;
                      if (
                        (targetSheet === 'SDE_SHEET' && user && !user.leetcodeUrl) ||
                        (targetSheet === 'CP_SHEET' && user && (!user.codeforcesUrl || !user.codechefUrl))
                      ) {
                        e.preventDefault();
                        executeWithProfileCheck(targetSheet, () => {
                          window.open(activeReadmeQuestion.externalUrl!, '_blank');
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all hover:scale-105 shadow-sm shadow-amber-500/10 cursor-pointer"
                    title={`Solve ${activeReadmeQuestion.title} on ${activeReadmeQuestion.platform || 'LeetCode'}`}
                  >
                    <span>Solve on {activeReadmeQuestion.platform || (activeReadmeQuestion.externalUrl.includes('leetcode') ? 'LeetCode' : 'Platform')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  onClick={() => handleToggleComplete(activeReadmeQuestion.id, activeReadmeQuestion.sheetType)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    completedMap[activeReadmeQuestion.id]
                      ? 'bg-green-500 text-slate-950 border-green-400 shadow-md shadow-green-500/20'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {completedMap[activeReadmeQuestion.id] ? 'Completed' : 'Mark as Done'}
                  </span>
                </button>
                <button
                  onClick={() => setActiveReadmeQuestion(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Markdown Viewer */}
            <div className="p-6 overflow-y-auto space-y-4">
              {activeReadmeQuestion.content ? (
                <MarkdownViewer content={activeReadmeQuestion.content} />
              ) : (
                <p className="text-gray-400 text-sm">No Readme content specified for this problem.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-gray-400">
              <span className="font-mono">Code &amp; Coffee Technical Journal</span>
              <button
                onClick={() => handleOpenNote(activeReadmeQuestion)}
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>Open Revision Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* REVISION NOTES MODAL */}
      {/* ============================================================ */}
      {activeNoteQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg glass-card rounded-3xl border border-white/20 flex flex-col overflow-hidden shadow-2xl bg-slate-950/95">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Personal Revision Note</h3>
                  <p className="text-xs text-gray-400 truncate max-w-[280px]">
                    {activeNoteQuestion.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveNoteQuestion(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note Editor */}
            <div className="p-6 space-y-3">
              <textarea
                value={currentNoteText}
                onChange={(e) => setCurrentNoteText(e.target.value)}
                placeholder="Write your intuition, key tricky testcases, time-space complexity, or memory hooks for revision..."
                rows={6}
                className="w-full p-4 rounded-2xl glass-card border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 bg-black/50 resize-none font-mono"
              />
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>{currentNoteText.length} characters</span>
                <span>Supports markdown &amp; bullet points</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
              <button
                onClick={() => setActiveNoteQuestion(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25 transition-all"
              >
                {noteSaveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-950" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{savingNote ? 'Saving...' : 'Save Note'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* COMING SOON MODAL (For Solution Video & Solution Notes) */}
      {/* ============================================================ */}
      {comingSoonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md glass-card rounded-3xl border border-white/20 p-6 sm:p-8 text-center space-y-4 shadow-2xl bg-slate-950/95">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-transparent border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              {comingSoonModal.type === 'video' ? (
                <Video className="w-8 h-8" />
              ) : (
                <FileCode className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                In Production
              </span>
              <h3 className="text-xl font-bold text-white">
                {comingSoonModal.type === 'video'
                  ? 'Solution Video: Coming soon..!'
                  : 'Solution Notes: Coming soon..!'}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {comingSoonModal.type === 'video'
                  ? `We're recording high-definition video walkthroughs with memory layout diagrams and algorithmic edge cases for "${comingSoonModal.questionTitle}".`
                  : `Curated multi-language editorial solutions (C++, Java, Python, TypeScript) and mathematical proofs for "${comingSoonModal.questionTitle}" are being authored.`}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setComingSoonModal({ open: false, type: 'video', questionTitle: '' })}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all"
              >
                Got it
              </button>
              <Link
                href="/whats-coming"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl glass-card text-white font-semibold text-xs border border-white/10 hover:bg-white/10 transition-colors"
              >
                View Roadmap
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PROFILE PREREQUISITE WARNING MODAL (SDE & CP Sheets) */}
      {/* ============================================================ */}
      {profilePromptModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg glass-card rounded-3xl border-2 border-amber-500/40 p-6 sm:p-8 space-y-5 shadow-2xl bg-slate-950/95 text-left">
            <button
              onClick={() => setProfilePromptModal({ open: false, sheet: 'SDE_SHEET' })}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning Header */}
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    One-Time Verification
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {profilePromptModal.sheet === 'SDE_SHEET'
                    ? 'LeetCode Profile Link Required'
                    : 'Competitive Programming Profiles Required'}
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {profilePromptModal.sheet === 'SDE_SHEET'
                ? 'To solve problems on the SDE Sheet and verify algorithmic submissions, please enter your LeetCode profile handle or URL. We only ask this once, and it will be visible on your profile and leaderboards.'
                : 'To solve problems on the Competitive Programming Sheet, please link both your Codeforces and CodeChef handles or URLs. This is required once to verify submissions and rank CP solvers.'}
            </p>

            {profileError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfilePrerequisites} className="space-y-4">
              {profilePromptModal.sheet === 'SDE_SHEET' ? (
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-amber-400" />
                    LeetCode Profile URL or Handle
                  </label>
                  <input
                    type="text"
                    value={modalLeetcode}
                    onChange={(e) => setModalLeetcode(e.target.value)}
                    placeholder="e.g. alex_coder or https://leetcode.com/u/alex_coder"
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-white placeholder-gray-500 font-mono border border-amber-500/30 focus:border-amber-400"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Enter either your username or full URL (e.g. <code>https://leetcode.com/u/your_handle</code>)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-blue-300 mb-1.5 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-blue-400" />
                      Codeforces Profile URL or Handle
                    </label>
                    <input
                      type="text"
                      value={modalCodeforces}
                      onChange={(e) => setModalCodeforces(e.target.value)}
                      placeholder="e.g. tourist or https://codeforces.com/profile/tourist"
                      required
                      autoFocus
                      className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-white placeholder-gray-500 font-mono border border-blue-500/30 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-orange-300 mb-1.5 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-400" />
                      CodeChef Profile URL or Handle
                    </label>
                    <input
                      type="text"
                      value={modalCodechef}
                      onChange={(e) => setModalCodechef(e.target.value)}
                      placeholder="e.g. chef_pro or https://www.codechef.com/users/chef_pro"
                      required
                      className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-white placeholder-gray-500 font-mono border border-orange-500/30 focus:border-orange-400"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/user/profile"
                  target="_blank"
                  className="text-xs text-gray-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  <span>Edit all links in Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProfilePromptModal({ open: false, sheet: 'SDE_SHEET' })}
                    className="px-4 py-2 rounded-xl glass-card text-gray-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfiles}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    {savingProfiles ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save &amp; Start Solving</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
