'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { fetchApi } from '../../../lib/api';
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
  isPublished: boolean;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    role: string;
  };
}

export default function AdminPracticePage() {
  const { user, isAdmin } = useAuth();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSheet, setFilterSheet] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<PracticeQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [formSheetType, setFormSheetType] = useState<SheetType>('CRACK_THE_INTERVIEW');
  const [formTopic, setFormTopic] = useState('Arrays');
  const [formRating, setFormRating] = useState('800');
  const [formPlatform, setFormPlatform] = useState('LeetCode');
  const [formTitle, setFormTitle] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('MEDIUM');
  const [formContent, setFormContent] = useState('');
  const [formExternalUrl, setFormExternalUrl] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [formIsPublished, setFormIsPublished] = useState(true);

  useEffect(() => {
    loadAllQuestions();
  }, []);

  const loadAllQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/practice/admin/all');
      if (res.success && res.data) {
        setQuestions(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin practice questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setFormSheetType('CRACK_THE_INTERVIEW');
    setFormTopic('Arrays');
    setFormRating('800');
    setFormPlatform('LeetCode');
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
    setFormPlatform(q.platform || (q.sheetType === 'CP_SHEET' ? 'Codeforces' : 'LeetCode'));
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
      return;
    }

    if (formSheetType !== 'CP_SHEET' && !formTopic.trim()) {
      setErrorMessage('Topic is required for Crack the Interview & SDE Sheet.');
      return;
    }

    if (formSheetType === 'CP_SHEET' && (!formRating || isNaN(parseInt(formRating, 10)))) {
      setErrorMessage('A valid numerical rating (e.g. 800, 1000, 1200) is required for CP Sheet.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sheetType: formSheetType,
        topic: formSheetType === 'CP_SHEET' ? null : formTopic.trim(),
        rating: formSheetType === 'CP_SHEET' ? parseInt(formRating, 10) : null,
        platform: formPlatform,
        title: formTitle.trim(),
        difficulty: formDifficulty,
        content: formContent.trim() || null,
        externalUrl: formExternalUrl.trim() || null,
        order: parseInt(formOrder, 10) || 0,
        isPublished: formIsPublished,
      };

      let res;
      if (editingQuestion) {
        res = await fetchApi(`/practice/admin/question/${editingQuestion.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchApi('/practice/admin/question', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res.success) {
        setSuccessMessage(
          editingQuestion ? 'Question updated successfully!' : 'New question added successfully!'
        );
        setIsModalOpen(false);
        loadAllQuestions();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(res.message || 'Operation failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetchApi(`/practice/admin/question/${deleteId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setSuccessMessage('Question deleted successfully');
        setDeleteId(null);
        loadAllQuestions();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
    } finally {
      setDeleting(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <Code2 className="w-3.5 h-3.5" />
            Curriculum Governance
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Practice Arena Management</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Author and manage questions across Crack the Interview (Readme format), SDE Sheet (LeetCode links), and CP Sheet (Codeforces/CodeChef ratings).
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all scale-100 hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

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
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-xs font-mono mt-2">Loading practice inventory...</p>
        </div>
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
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">
                          {q.sheetType === 'CRACK_THE_INTERVIEW' && '🎯 Crack Interview'}
                          {q.sheetType === 'SDE_SHEET' && '🚀 SDE Sheet'}
                          {q.sheetType === 'CP_SHEET' && '⚔️ CP Sheet'}
                        </span>
                        <span className="text-[11px] text-amber-400 font-mono">
                          {q.sheetType === 'CP_SHEET'
                            ? `Rating: ${q.rating || 'N/A'}`
                            : `Topic: ${q.topic || 'General'}`}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 max-w-xs">
                        <span className="font-bold text-white truncate">{q.title}</span>
                        {q.content && (
                          <span
                            title="Has Readme problem statement"
                            className="p-1 rounded bg-cyan-500/10 text-cyan-400"
                          >
                            <BookOpen className="w-3 h-3" />
                          </span>
                        )}
                        {q.externalUrl && (
                          <a
                            href={q.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-white/5 text-gray-400 hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
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
                          onClick={() => setDeleteId(q.id)}
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
                <div className="grid grid-cols-3 gap-2">
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
                </div>
              </div>

              {/* Dynamic Topic (for Interview/SDE) OR Rating (for CP) */}
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
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Topic Name
                    </label>
                    <input
                      type="text"
                      value={formTopic}
                      onChange={(e) => setFormTopic(e.target.value)}
                      placeholder="e.g. Arrays, Dynamic Programming, Trees"
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
                      <option value="Internal">Internal (Readme)</option>
                      <option value="GeeksforGeeks">GeeksforGeeks</option>
                    </select>
                  </div>
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

              {/* External URL for SDE Sheet & CP Sheet */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  External Problem URL (LeetCode, Codeforces, or CodeChef)
                </label>
                <input
                  type="url"
                  value={formExternalUrl}
                  onChange={(e) => setFormExternalUrl(e.target.value)}
                  placeholder="https://leetcode.com/problems/... or https://codeforces.com/..."
                  className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-white/15 text-white bg-slate-900 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Content / Readme for Crack the Interview */}
              {formSheetType === 'CRACK_THE_INTERVIEW' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                    <span>Readme Format Problem Statement (Markdown)</span>
                    <span className="text-[10px] text-amber-400 font-mono">Supports GFM</span>
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
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm glass-card rounded-2xl border border-red-500/30 p-6 text-center space-y-4 bg-slate-950/95 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Practice Question?</h3>
              <p className="text-xs text-gray-400 mt-1">
                This action is permanent and will remove user progress records for this question.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
