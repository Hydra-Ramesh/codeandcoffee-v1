'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../lib/api';
import MarkdownViewer from '../../components/MarkdownViewer';
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
} from 'lucide-react';

type SheetType = 'CRACK_THE_INTERVIEW' | 'SDE_SHEET' | 'CP_SHEET';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

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
  const { user } = useAuth();
  const [activeSheet, setActiveSheet] = useState<SheetType>('CRACK_THE_INTERVIEW');
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

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

  // Load questions whenever activeSheet changes
  useEffect(() => {
    loadSheetQuestions(activeSheet);
  }, [activeSheet]);

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

  const loadSheetQuestions = async (sheet: SheetType) => {
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

  // Toggle question completion
  const handleToggleComplete = async (questionId: string) => {
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
      } catch (err) {
        console.error('Failed to sync progress with server:', err);
      }
    }
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

  // Group questions by Topic (for Crack the Interview & SDE Sheet) or Rating (for CP Sheet)
  const groupedQuestions = useMemo(() => {
    let filtered = questions;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.topic && item.topic.toLowerCase().includes(q)) ||
          (item.rating && item.rating.toString().includes(q))
      );
    }

    if (selectedDifficulty !== 'ALL') {
      filtered = filtered.filter((item) => item.difficulty === selectedDifficulty);
    }

    const groups: Record<string, PracticeQuestion[]> = {};

    filtered.forEach((item) => {
      let key = '';
      if (activeSheet === 'CP_SHEET') {
        key = item.rating ? `Rating: ${item.rating}` : 'Unrated Challenges';
      } else {
        key = item.topic || 'General Algorithms';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  }, [questions, searchQuery, selectedDifficulty, activeSheet]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass-card border border-white/10 p-6 sm:p-10 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-cyan-500/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Code2 className="w-3.5 h-3.5" />
              Algorithmic Mastery Hub
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Code &amp; Coffee <span className="gradient-text-amber">Practice Arena</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Curated problem sheets benchmarked for Tier-1 Tech Interviews and Competitive Programming.
              Track your daily solve streak, write personal revision notes, and master core computer science patterns.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-5 w-full md:w-auto min-w-[260px] bg-black/40">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                <span>Sheet Progress</span>
                <span className="text-amber-400 font-mono text-sm">{sheetStats.percentage}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${sheetStats.percentage}%` }}
                />
              </div>
              <div className="text-[11px] text-gray-400 font-mono">
                {sheetStats.completed} of {sheetStats.total} Solved
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
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
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problem or topic..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-card border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-card border border-white/10 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Levels</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
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

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4 py-12 text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-xs font-mono">Loading curated problem collection...</p>
        </div>
      ) : Object.keys(groupedQuestions).length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-white/10 space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No questions found</h3>
          <p className="text-gray-400 text-xs">Try adjusting your search query or difficulty filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedQuestions).map(([groupTitle, items]) => {
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
                          key={item.id}
                          className={`p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                            isDone ? 'bg-green-500/[0.03]' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          {/* Left: Checkmark + Title + Tags */}
                          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                            {/* Checkmark Button */}
                            <button
                              onClick={() => handleToggleComplete(item.id)}
                              className={`p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none ${
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

                                {/* Platform Badge for CP Sheet / SDE */}
                                {item.platform && (
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                      item.platform === 'Codeforces'
                                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                        : item.platform === 'CodeChef'
                                        ? 'bg-amber-700/20 text-amber-300 border-amber-700/30'
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
                            {/* Readme Button for Crack the Interview */}
                            {activeSheet === 'CRACK_THE_INTERVIEW' && item.content && (
                              <button
                                onClick={() => setActiveReadmeQuestion(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Read Problem</span>
                              </button>
                            )}

                            {/* External Link for SDE Sheet & CP Sheet */}
                            {item.externalUrl && (
                              <a
                                href={item.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 transition-colors"
                              >
                                <span>Solve on {item.platform || 'Platform'}</span>
                                <ExternalLink className="w-3 h-3 text-gray-400" />
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
        </div>
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

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleComplete(activeReadmeQuestion.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
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
    </div>
  );
}
