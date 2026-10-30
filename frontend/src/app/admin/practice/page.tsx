'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { fetchApi } from '../../../lib/api';
import AdminPracticeSkeleton from '../../../components/skeletons/AdminPracticeSkeleton';
import AdminActivitySkeleton from '../../../components/skeletons/AdminActivitySkeleton';
import Pagination from '../../../components/Pagination';
import { useToast } from '../../../context/ToastContext';
import WarningCardModal, { WarningDetail } from '../../../components/WarningCardModal';
import {
  Code2,
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Layers,
  Sparkles,
  Award,
  Zap,
  Activity,
  Users,
  Trophy,
  StickyNote,
  Clock,
  Flame,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

type SheetType = 'CRACK_THE_INTERVIEW' | 'SDE_SHEET' | 'CP_SHEET' | 'KNOWLEDGE_SHEET';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type AdminTab = 'CURRICULUM' | 'ACTIVITY';

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
  isPublished: boolean;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    role: string;
  };
}

interface DailySolveSummary {
  date: string;
  count: number;
  status: 'NONE' | 'NORMAL' | 'FIRE';
}

interface UserActivityData {
  metrics: {
    totalCompletions: number;
    totalNotes: number;
    uniqueStudentsCount: number;
    sheetCompletions: {
      CRACK_THE_INTERVIEW: number;
      SDE_SHEET: number;
      CP_SHEET: number;
      KNOWLEDGE_SHEET: number;
    };
  };
  recentActivity: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
      role: string;
    };
    question: {
      id: string;
      title: string;
      sheetType: SheetType;
      topic?: string | null;
      rating?: number | null;
      platform: string;
      difficulty: Difficulty;
    };
    isCompleted: boolean;
    hasNote: boolean;
    noteSnippet?: string | null;
    completedAt?: string | null;
    updatedAt: string;
  }>;
  topQuestions: Array<{
    id: string;
    title: string;
    sheetType: SheetType;
    topic?: string | null;
    difficulty: Difficulty;
    solveCount: number;
  }>;
  leaderboard: Array<{
    id: string;
    name: string;
    email: string;
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
    totalNotes: number;
    lastActive: string | null;
    crackCount: number;
    sdeCount: number;
    cpCount: number;
  }>;
}

export default function AdminPracticePage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('CURRICULUM');

  // Curriculum State
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [filterSheet, setFilterSheet] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Activity State
  const [activityData, setActivityData] = useState<UserActivityData | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const { toast } = useToast();

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<PracticeQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Warning Confirmation Modal State
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionVerb?: string;
    badgeText?: string;
    variant?: 'danger' | 'warning' | 'success';
    details?: WarningDetail[];
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });
  const [warningModalLoading, setWarningModalLoading] = useState(false);

  // Pagination State for Curriculum Management Table
  const [curriculumPage, setCurriculumPage] = useState(1);
  const [curriculumPageSize, setCurriculumPageSize] = useState(15);

  // Form Fields
  const [formSheetType, setFormSheetType] = useState<SheetType>('CRACK_THE_INTERVIEW');
  const [formTopic, setFormTopic] = useState('Arrays');
  const [formRating, setFormRating] = useState('800');
  const [formPlatform, setFormPlatform] = useState('LeetCode');
  const [formCustomPlatform, setFormCustomPlatform] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('MEDIUM');
  const [formContent, setFormContent] = useState('');
  const [formExternalUrl, setFormExternalUrl] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [formIsPublished, setFormIsPublished] = useState(true);

  useEffect(() => {
    loadAllQuestions();
    if (isAdmin) {
      loadActivityData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'ACTIVITY') {
      setActiveTab('CURRICULUM');
    }
  }, [isAdmin, activeTab]);

  const loadAllQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetchApi('/practice/admin/all');
      if (res.success && res.data) {
        setQuestions(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin practice questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadActivityData = async () => {
    if (!isAdmin) return;
    setLoadingActivity(true);
    try {
      const res = await fetchApi('/practice/admin/activity');
      if (res.success && res.data) {
        setActivityData(res.data);
      }
    } catch (err) {
      console.error('Failed to load practice activity:', err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setFormSheetType('CRACK_THE_INTERVIEW');
    setFormTopic('Arrays');
    setFormRating('800');
    setFormPlatform('LeetCode');
    setFormCustomPlatform('');
    setFormTitle('');
    setFormDifficulty('MEDIUM');
    setFormContent(
      `# Problem Title\n\n## Problem Statement\nDescribe the problem here...\n\n### Example 1:\n\`\`\`\nInput: \nOutput: \n\`\`\`\n\n### Constraints:\n- \n\n### Optimal Approach:\n1. Step 1\n- **Time Complexity:** O(N)\n- **Space Complexity:** O(1)`
    );
    setFormExternalUrl('');
    setFormOrder('0');
    setFormIsPublished(true);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (q: PracticeQuestion) => {
    setEditingQuestion(q);
    setFormSheetType(q.sheetType);
    setFormTopic(q.topic || '');
    setFormRating(q.rating ? q.rating.toString() : '800');
    const standardPlatforms = ['LeetCode', 'Codeforces', 'CodeChef', 'InterviewBit', 'Hello Interview', 'AtCoder', 'GeeksforGeeks', 'Self-Created (Code & Coffee)', 'Internal'];
    if (q.platform && !standardPlatforms.includes(q.platform)) {
      setFormPlatform('Other');
      setFormCustomPlatform(q.platform);
    } else {
      setFormPlatform(q.platform || (q.sheetType === 'CP_SHEET' ? 'Codeforces' : 'LeetCode'));
      setFormCustomPlatform('');
    }
    setFormTitle(q.title);
    setFormDifficulty(q.difficulty);
    setFormContent(q.content || '');
    setFormExternalUrl(q.externalUrl || '');
    setFormOrder(q.order.toString());
    setFormIsPublished(q.isPublished);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formTitle.trim()) {
      setErrorMessage('Please enter a problem title.');
      toast.warning('Please enter a problem title.');
      return;
    }

    if ((formSheetType === 'CRACK_THE_INTERVIEW' || formSheetType === 'SDE_SHEET') && !formTopic.trim()) {
      setErrorMessage('Topic is required for Crack the Interview & SDE Sheet.');
      toast.warning('Topic is required for Crack the Interview & SDE Sheet.');
      return;
    }

    if (formSheetType === 'CP_SHEET' && (!formRating || isNaN(parseInt(formRating, 10)))) {
      setErrorMessage('A valid numerical rating (e.g. 800, 1000, 1200) is required for CP Sheet.');
      toast.warning('A valid numerical rating is required for CP Sheet.');
      return;
    }

    if (formSheetType === 'CRACK_THE_INTERVIEW' && !formContent.trim() && !formExternalUrl.trim()) {
      setErrorMessage('Please provide either a Readme problem statement or a LeetCode / external URL (or both).');
      toast.warning('Please provide a problem statement or external URL.');
      return;
    }

    const payload = {
      sheetType: formSheetType,
      topic: formSheetType === 'CP_SHEET' ? null : (formTopic.trim() || 'General Practice'),
      rating: formSheetType === 'CP_SHEET' ? parseInt(formRating, 10) : null,
      platform: formPlatform === 'Other' ? (formCustomPlatform.trim() || 'Other') : formPlatform,
      title: formTitle.trim(),
      difficulty: formDifficulty,
      content: formContent.trim() || null,
      externalUrl: formExternalUrl.trim() || null,
      order: parseInt(formOrder, 10) || 0,
      isPublished: formIsPublished,
    };

    if (editingQuestion) {
      setWarningModal({
        isOpen: true,
        title: 'Update Practice Question',
        description: `Are you sure you want to update practice question "${payload.title}"? Changes will be immediately reflected across student practice sheets.`,
        actionVerb: 'Confirm & Update',
        variant: 'warning',
        details: [
          { label: 'Title', value: payload.title },
          { label: 'Sheet Type', value: payload.sheetType },
          { label: 'Difficulty', value: payload.difficulty },
          { label: 'Platform', value: payload.platform },
        ],
        onConfirm: async () => {
          setWarningModalLoading(true);
          try {
            const res = await fetchApi(`/practice/admin/question/${editingQuestion.id}`, {
              method: 'PUT',
              body: JSON.stringify(payload),
            });
            if (res.success) {
              toast.success('Question updated successfully!');
              setSuccessMessage('Question updated successfully!');
              setIsModalOpen(false);
              loadAllQuestions();
              loadActivityData();
              setTimeout(() => setSuccessMessage(''), 3000);
              setWarningModal((m) => ({ ...m, isOpen: false }));
            } else {
              setErrorMessage(res.message || 'Operation failed');
              toast.error(res.message || 'Failed to update question.');
            }
          } catch (err: any) {
            setErrorMessage(err.message || 'An unexpected error occurred');
            toast.error(err.message || 'An unexpected error occurred');
          } finally {
            setWarningModalLoading(false);
          }
        },
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetchApi('/practice/admin/question', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success('New question added successfully!');
        setSuccessMessage('New question added successfully!');
        setIsModalOpen(false);
        loadAllQuestions();
        loadActivityData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(res.message || 'Operation failed');
        toast.error(res.message || 'Failed to create question.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDelete = (q: PracticeQuestion) => {
    setWarningModal({
      isOpen: true,
      title: 'Delete Practice Question',
      description: `Are you sure you want to permanently delete question "${q.title}"? This action cannot be undone and will remove all student solve logs and telemetry for this question.`,
      actionVerb: 'Delete Question',
      badgeText: 'Destructive Action',
      variant: 'danger',
      details: [
        { label: 'Title', value: q.title },
        { label: 'Sheet Type', value: q.sheetType },
        { label: 'Difficulty', value: q.difficulty },
        { label: 'Platform', value: q.platform || 'LeetCode' },
      ],
      onConfirm: async () => {
        setWarningModalLoading(true);
        try {
          const res = await fetchApi(`/practice/admin/question/${q.id}`, {
            method: 'DELETE',
          });
          if (res.success) {
            toast.success(`Question "${q.title}" deleted successfully.`);
            setSuccessMessage('Question deleted successfully');
            loadAllQuestions();
            loadActivityData();
            setTimeout(() => setSuccessMessage(''), 3000);
            setWarningModal((m) => ({ ...m, isOpen: false }));
          } else {
            toast.error(res.message || 'Failed to delete question.');
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to delete question.');
        } finally {
          setWarningModalLoading(false);
        }
      },
    });
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Filtered list
  const filteredQuestions = questions.filter((q) => {
    const matchesSheet = filterSheet === 'ALL' || q.sheetType === filterSheet;
    const matchesSearch =
      !searchQuery.trim() ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.rating && q.rating.toString().includes(searchQuery));
    return matchesSheet && matchesSearch;
  });

  // Curriculum Table Pagination
  useEffect(() => {
    setCurriculumPage(1);
  }, [filterSheet, searchQuery]);

  const totalCurriculumPages = Math.ceil(filteredQuestions.length / curriculumPageSize);
  const paginatedQuestions = React.useMemo(() => {
    const start = (curriculumPage - 1) * curriculumPageSize;
    return filteredQuestions.slice(start, start + curriculumPageSize);
  }, [filteredQuestions, curriculumPage, curriculumPageSize]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <Code2 className="w-3.5 h-3.5" />
            {isAdmin ? 'Curriculum & Activity Governance' : 'Curriculum & Problem Authoring'}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {isAdmin ? 'Practice Arena Control Center' : 'Practice Arena Contributor Portal'}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            {isAdmin
              ? 'Manage practice problem sheets and monitor real-time student activity, solve streaks, and revision notes.'
              : 'Create, curate, and maintain practice questions across interview and competitive programming sheets.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'CURRICULUM' && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all scale-100 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Question</span>
            </button>
          )}
          {activeTab === 'ACTIVITY' && isAdmin && (
            <button
              onClick={loadActivityData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-card border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Refresh Feed</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('CURRICULUM')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'CURRICULUM'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'glass-card text-gray-300 hover:text-white border border-white/10'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Curriculum Management</span>
          <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-black/25">
            {questions.length}
          </span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('ACTIVITY')}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'ACTIVITY'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'glass-card text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>User Activity &amp; Analytics</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: CURRICULUM MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === 'CURRICULUM' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Sheet Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setFilterSheet('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterSheet === 'ALL'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'glass-card text-gray-300 hover:text-white border border-white/10'
                }`}
              >
                All Sheets ({questions.length})
              </button>
              <button
                onClick={() => setFilterSheet('CRACK_THE_INTERVIEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterSheet === 'CRACK_THE_INTERVIEW'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'glass-card text-gray-300 hover:text-white border border-white/10'
                }`}
              >
                1. Crack the Interview
              </button>
              <button
                onClick={() => setFilterSheet('SDE_SHEET')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterSheet === 'SDE_SHEET'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'glass-card text-gray-300 hover:text-white border border-white/10'
                }`}
              >
                2. SDE Sheet
              </button>
              <button
                onClick={() => setFilterSheet('CP_SHEET')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterSheet === 'CP_SHEET'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'glass-card text-gray-300 hover:text-white border border-white/10'
                }`}
              >
                3. CP Sheet
              </button>
              <button
                onClick={() => setFilterSheet('KNOWLEDGE_SHEET')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterSheet === 'KNOWLEDGE_SHEET'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'glass-card text-gray-300 hover:text-white border border-white/10'
                }`}
              >
                4. Knowledge Sheet
              </button>
            </div>

            {/* Search */}
            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, topic..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs glass-card border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Table / List View */}
          {loadingQuestions ? (
            <AdminPracticeSkeleton />
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl border border-white/10 space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No questions found</h3>
              <p className="text-gray-400 text-xs">Click &ldquo;Add New Question&rdquo; to author your first problem.</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-white/[0.03] text-gray-400 font-mono text-[11px] uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="px-5 py-3.5">Sheet / Category</th>
                      <th className="px-5 py-3.5">Problem Title</th>
                      <th className="px-5 py-3.5">Platform</th>
                      <th className="px-5 py-3.5">Difficulty</th>
                      <th className="px-5 py-3.5">Author</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">
                              {q.sheetType === 'CRACK_THE_INTERVIEW' && '🎯 Crack Interview'}
                              {q.sheetType === 'SDE_SHEET' && '🚀 SDE Sheet'}
                              {q.sheetType === 'CP_SHEET' && '⚔️ CP Sheet'}
                              {q.sheetType === 'KNOWLEDGE_SHEET' && '🧠 Knowledge Sheet'}
                            </span>
                            <span className="text-[11px] text-amber-400 font-mono">
                              {q.sheetType === 'CP_SHEET'
                                ? `Rating: ${q.rating || 'N/A'}`
                                : `Topic: ${q.topic || 'General'}`}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 max-w-sm flex-wrap">
                            <span className="font-bold text-white truncate max-w-[200px]">{q.title}</span>
                            {q.content && (
                              <span
                                title="Has Readme problem statement"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              >
                                <BookOpen className="w-2.5 h-2.5" />
                                <span>Readme</span>
                              </span>
                            )}
                            {q.externalUrl && (
                              <a
                                href={q.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                                title={q.externalUrl}
                              >
                                <span>{q.platform || (q.externalUrl.includes('leetcode') ? 'LeetCode' : 'Link')}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-gray-300">
                          {q.platform}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              q.difficulty === 'EASY'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : q.difficulty === 'MEDIUM'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-400 text-[11px]">
                          {q.author?.name || 'Admin'}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(q)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                              title="Edit Question"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRequestDelete(q)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Curriculum Pagination */}
              {filteredQuestions.length > 0 && (
                <Pagination
                  currentPage={curriculumPage}
                  totalPages={totalCurriculumPages}
                  totalItems={filteredQuestions.length}
                  pageSize={curriculumPageSize}
                  pageSizeOptions={[10, 15, 25, 50, 100]}
                  onPageChange={setCurriculumPage}
                  onPageSizeChange={setCurriculumPageSize}
                  itemLabel="curriculum questions"
                  className="border-t border-white/10 rounded-t-none"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: USER PRACTICE ACTIVITY & TELEMETRY (ADMIN ONLY) */}
      {/* ============================================================ */}
      {activeTab === 'ACTIVITY' && isAdmin && (
        <div className="space-y-6">
          {loadingActivity || !activityData ? (
            <AdminActivitySkeleton />
          ) : (
            <>
              {/* Top 4 Telemetry Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent space-y-2">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>Total Solves</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {activityData.metrics.totalCompletions}
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                    <TrendingUp className="w-3 h-3" /> Verified problem submissions
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent space-y-2">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>Active Solvers</span>
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {activityData.metrics.uniqueStudentsCount}
                  </div>
                  <div className="text-[11px] text-cyan-400 flex items-center gap-1 font-mono">
                    <Users className="w-3 h-3" /> Unique students practicing
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent space-y-2">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>Revision Notes</span>
                    <StickyNote className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {activityData.metrics.totalNotes}
                  </div>
                  <div className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                    <BookOpen className="w-3 h-3" /> Notes written for review
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent space-y-2">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>Platform Distribution</span>
                    <Award className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-[11px] font-mono flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Interview: {activityData.metrics.sheetCompletions.CRACK_THE_INTERVIEW}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      SDE: {activityData.metrics.sheetCompletions.SDE_SHEET}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      CP: {activityData.metrics.sheetCompletions.CP_SHEET}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Knowledge: {activityData.metrics.sheetCompletions.KNOWLEDGE_SHEET || 0}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">Total sheet engagement</div>
                </div>
              </div>

              {/* Main Activity Grid: Live Feed (Left) & Leaderboard + Trending (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Cols: Live Activity Feed */}
                <div className="lg:col-span-7 glass-card rounded-2xl border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white">Live Student Activity Stream</h3>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      Last {activityData.recentActivity.length} events
                    </span>
                  </div>

                  {activityData.recentActivity.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      No student practice activity recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                      {activityData.recentActivity.map((act) => (
                        <div
                          key={act.id}
                          className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 flex items-start gap-3 transition-colors"
                        >
                          <img
                            src={
                              act.user.avatar ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                                act.user.name
                              )}`
                            }
                            alt={act.user.name}
                            className="w-8 h-8 rounded-full border border-white/20 mt-0.5"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white truncate">{act.user.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(act.updatedAt)}
                              </span>
                            </div>

                            <p className="text-xs text-gray-300">
                              {act.isCompleted ? (
                                <span className="text-emerald-400 font-medium">Solved</span>
                              ) : (
                                <span className="text-amber-400 font-medium">Updated note on</span>
                              )}{' '}
                              <span className="text-white font-semibold">
                                {act.question?.title || 'Problem'}
                              </span>
                            </p>

                            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 text-gray-300">
                                {act.question?.sheetType === 'CRACK_THE_INTERVIEW'
                                  ? '🎯 Interview'
                                  : act.question?.sheetType === 'SDE_SHEET'
                                  ? '🚀 SDE'
                                  : '⚔️ CP'}
                              </span>
                              {act.question?.topic && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {act.question.topic}
                                </span>
                              )}
                              {act.hasNote && act.noteSnippet && (
                                <span className="text-[10px] text-amber-300 italic bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate max-w-xs">
                                  &ldquo;{act.noteSnippet}...&rdquo;
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right 5 Cols: Student Leaderboard & Trending Problems */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Student Streaks & Points Monitor */}
                  <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-white">Student Streaks &amp; Points Monitor</h3>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400">10 pts / solve</span>
                    </div>

                    {activityData.leaderboard.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-xs">
                        No student practice data recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {activityData.leaderboard.map((student, idx) => (
                          <div
                            key={student.id}
                            className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 space-y-2 transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`w-5 text-center font-bold font-mono ${
                                    idx === 0
                                      ? 'text-amber-400'
                                      : idx === 1
                                      ? 'text-gray-300'
                                      : idx === 2
                                      ? 'text-amber-600'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  #{idx + 1}
                                </span>
                                <img
                                  src={
                                    student.avatar ||
                                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                                      student.name
                                    )}`
                                  }
                                  alt={student.name}
                                  className="w-7 h-7 rounded-full border border-white/20"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate max-w-[130px]">
                                    {student.name}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono truncate max-w-[130px]">
                                    {student.email}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  {student.points ?? student.totalCompleted * 10} pts
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-white/5 text-gray-300">
                                  {student.totalCompleted} solved
                                </span>
                              </div>
                            </div>

                            {/* Streaks & Fire Days Sub-bar */}
                            <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-white/5 text-gray-300">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 font-semibold">
                                  Streak:
                                  <strong className={student.todayStatus === 'FIRE' ? 'text-orange-400' : 'text-emerald-400'}>
                                    {student.currentStreak || 0}d
                                  </strong>
                                  {student.todayStatus === 'FIRE' ? (
                                    <span title="Fire Day Active! (≥5 problems solved today)">🔥</span>
                                  ) : (student.currentStreak || 0) > 0 ? (
                                    <span title="Normal streak day (1-4 problems solved)">🟢</span>
                                  ) : null}
                                </span>
                                <span className="text-gray-600">|</span>
                                <span className="text-gray-400">
                                  Max: {student.highestStreak || 0}d
                                </span>
                                {student.fireDaysCount > 0 && (
                                  <>
                                    <span className="text-gray-600">|</span>
                                    <span className="text-orange-400">
                                      🔥 {student.fireDaysCount} {student.fireDaysCount === 1 ? 'Fire Day' : 'Fire Days'}
                                    </span>
                                  </>
                                )}
                              </div>

                              {student.todaySolves > 0 ? (
                                <span className="text-[10px] text-emerald-400 font-semibold">
                                  +{student.todaySolves} today
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-500">
                                  0 today
                                </span>
                              )}
                            </div>

                            {/* 14-Day Activity Heat Strip */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[9px] font-mono text-gray-500">14-Day Activity:</span>
                              <div className="flex items-center gap-1">
                                {(student.recentDays || []).slice(-14).map((d, i) => (
                                  <div
                                    key={d.date || i}
                                    title={`${d.date}: ${d.count} solved ${
                                      d.status === 'FIRE'
                                        ? '(🔥 Fire Day: ≥5 solves)'
                                        : d.status === 'NORMAL'
                                        ? '(🟢 Normal Day: 1-4 solves)'
                                        : '(0 solves)'
                                    }`}
                                    className={`w-2.5 h-2.5 rounded-xs flex items-center justify-center text-[6px] ${
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
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Most Attempted / Top Solved Problems */}
                  <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                          <Flame className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-white">Most Practiced Problems</h3>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {activityData.topQuestions.slice(0, 5).map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-2.5 rounded-xl bg-white/[0.02] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-gray-400 text-xs">#{idx + 1}</span>
                            <span className="font-medium text-white truncate max-w-[160px]">
                              {q.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                q.difficulty === 'EASY'
                                  ? 'text-emerald-400'
                                  : q.difficulty === 'MEDIUM'
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {q.difficulty}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/10 text-gray-200 font-mono font-bold text-[11px]">
                              {q.solveCount} solves
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD / EDIT QUESTION MODAL */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 glass-card rounded-3xl border border-white/20 flex flex-col shadow-2xl bg-slate-950/95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingQuestion ? 'Edit Practice Question' : 'Add New Practice Question'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Sheet Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Target Sheet Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormSheetType('CRACK_THE_INTERVIEW');
                      setFormPlatform('LeetCode');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                      formSheetType === 'CRACK_THE_INTERVIEW'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'glass-card text-gray-300 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    1. Crack Interview
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormSheetType('SDE_SHEET');
                      setFormPlatform('LeetCode');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                      formSheetType === 'SDE_SHEET'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'glass-card text-gray-300 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    2. SDE Sheet
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormSheetType('CP_SHEET');
                      setFormPlatform('Codeforces');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                      formSheetType === 'CP_SHEET'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'glass-card text-gray-300 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    3. CP Sheet
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormSheetType('KNOWLEDGE_SHEET');
                      setFormPlatform('LeetCode');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                      formSheetType === 'KNOWLEDGE_SHEET'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'glass-card text-gray-300 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    4. Knowledge Sheet
                  </button>
                </div>
              </div>

              {/* Dynamic Topic (for Interview/SDE/Knowledge) OR Rating (for CP) */}
              {formSheetType === 'CP_SHEET' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Problem Rating (Codeforces / CodeChef)
                    </label>
                    <input
                      type="number"
                      value={formRating}
                      onChange={(e) => setFormRating(e.target.value)}
                      placeholder="e.g. 800, 1000, 1200, 1400"
                      className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-white/15 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Platform</label>
                    <select
                      value={formPlatform}
                      onChange={(e) => setFormPlatform(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-white/15 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
                    >
                      <option value="Codeforces">Codeforces</option>
                      <option value="CodeChef">CodeChef</option>
                      <option value="AtCoder">AtCoder</option>
                      <option value="LeetCode">LeetCode</option>
                      <option value="InterviewBit">InterviewBit</option>
                      <option value="Hello Interview">Hello Interview</option>
                      <option value="Self-Created (Code & Coffee)">Self-Created (Code & Coffee)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Topic Name {formSheetType === 'KNOWLEDGE_SHEET' && '(Optional)'}
                      </label>
                      <input
                        type="text"
                        value={formTopic}
                        onChange={(e) => setFormTopic(e.target.value)}
                        placeholder={
                          formSheetType === 'KNOWLEDGE_SHEET'
                            ? 'e.g. Arrays, System Design, Random Practice'
                            : 'e.g. Arrays, Dynamic Programming, Trees'
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-white/15 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Platform</label>
                      <select
                        value={formPlatform}
                        onChange={(e) => setFormPlatform(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-white/15 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
                      >
                        <option value="LeetCode">LeetCode</option>
                        <option value="Self-Created (Code & Coffee)">Self-Created (Code & Coffee)</option>
                        <option value="Internal">Internal (Readme)</option>
                        <option value="InterviewBit">InterviewBit</option>
                        <option value="Hello Interview">Hello Interview</option>
                        <option value="Codeforces">Codeforces</option>
                        <option value="CodeChef">CodeChef</option>
                        <option value="GeeksforGeeks">GeeksforGeeks</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* If Platform === 'Other', custom platform name input */}
              {formPlatform === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    Website / Platform Name *
                  </label>
                  <input
                    type="text"
                    value={formCustomPlatform}
                    onChange={(e) => setFormCustomPlatform(e.target.value)}
                    placeholder="e.g. HackerRank, CSES, Spoj, Kattis"
                    className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-amber-500/40 text-white bg-slate-900 placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Title & Difficulty */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Trapping Rain Water"
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-white/15 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as Difficulty)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-white/15 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* External URL / LeetCode link */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                  <span>
                    {formSheetType === 'CRACK_THE_INTERVIEW'
                      ? 'LeetCode / External Problem URL (Optional)'
                      : 'External Problem URL (LeetCode, Codeforces, or CodeChef)'}
                  </span>
                  {formSheetType === 'CRACK_THE_INTERVIEW' && (
                    <span className="text-[10px] text-amber-400 font-mono">e.g. Single Number, Is Unique</span>
                  )}
                </label>
                <input
                  type="url"
                  value={formExternalUrl}
                  onChange={(e) => setFormExternalUrl(e.target.value)}
                  placeholder={
                    formSheetType === 'CRACK_THE_INTERVIEW'
                      ? 'https://leetcode.com/problems/single-number/ or https://leetcode.com/problems/contains-duplicate/'
                      : 'https://leetcode.com/problems/... or https://codeforces.com/...'
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-white/15 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
                />
                {formSheetType === 'CRACK_THE_INTERVIEW' && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    💡 For Crack the Interview, you can paste a direct LeetCode link. Users can click &ldquo;Solve on LeetCode&rdquo; right from the practice page!
                  </p>
                )}
              </div>

              {/* Content / Readme for Crack the Interview */}
              {formSheetType === 'CRACK_THE_INTERVIEW' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                    <span>Readme Problem Statement (Markdown)</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      {formExternalUrl ? 'Optional with LeetCode link' : 'Supports GFM'}
                    </span>
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={8}
                    className="w-full p-3 rounded-xl text-xs glass-card border border-white/15 text-white bg-slate-900 font-mono focus:outline-none focus:border-amber-400 resize-none"
                    placeholder="Enter complete markdown problem description, constraints, and testcases..."
                  />
                </div>
              )}

              {/* Order & Published */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-300 font-semibold">Display Order:</label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                    className="w-16 px-2 py-1 rounded-lg text-xs glass-card border border-white/15 text-white bg-slate-900"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="rounded bg-slate-900 border-white/20 text-amber-500 focus:ring-0"
                  />
                  <span>Published &amp; Live</span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="px-0 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* WARNING / CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <WarningCardModal
        isOpen={warningModal.isOpen}
        onClose={() => setWarningModal((m) => ({ ...m, isOpen: false }))}
        onConfirm={warningModal.onConfirm}
        title={warningModal.title}
        description={warningModal.description}
        actionVerb={warningModal.actionVerb}
        badgeText={warningModal.badgeText}
        variant={warningModal.variant}
        details={warningModal.details}
        confirmLoading={warningModalLoading}
      />
    </div>
  );
}
