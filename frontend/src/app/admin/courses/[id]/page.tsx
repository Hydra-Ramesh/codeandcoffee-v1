'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Layers,
  Plus,
  BookOpen,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Code2,
  Image as ImageIcon,
  ExternalLink,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { fetchApi } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';

interface QuizQuestionForm {
  id: string;
  questionText: string;
  type: 'MCQ' | 'MMQ' | 'CODE_OUTPUT';
  codeSnippet: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
}

interface CodingQuestionForm {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  description: string;
  leetcodeUrl: string;
  starterCode: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
}

interface SubtopicForm {
  id?: string;
  title: string;
  slug?: string;
  content: string;
  attachments: string[];
  hasQuiz: boolean;
  quizPassingScore: number;
  quizData: QuizQuestionForm[];
  codingQuestions: CodingQuestionForm[];
  isPublished: boolean;
}

interface SubtopicView {
  id: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  attachments: string[];
  hasQuiz: boolean;
  quizPassingScore: number;
  quizData: any;
  codingQuestions: any;
  isPublished: boolean;
}

interface TopicView {
  id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  subtopics: SubtopicView[];
}

interface CourseFull {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  bannerImage: string | null;
  isPublished: boolean;
  topics: TopicView[];
}

export default function CourseCurriculumBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseFull | null>(null);
  const [loading, setLoading] = useState(true);

  // Topic Modals State
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicForm, setTopicForm] = useState({ title: '', description: '' });
  const [savingTopic, setSavingTopic] = useState(false);

  // Subtopic Editor Modal State
  const [subtopicModalOpen, setSubtopicModalOpen] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [editingSubtopicId, setEditingSubtopicId] = useState<string | null>(null);
  const [subtopicForm, setSubtopicForm] = useState<SubtopicForm>({
    title: '',
    content: '',
    attachments: [],
    hasQuiz: true,
    quizPassingScore: 25,
    quizData: [],
    codingQuestions: [],
    isPublished: true,
  });
  const [savingSubtopic, setSavingSubtopic] = useState(false);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');

  // Active Tab in Subtopic Modal: 'CONTENT' | 'ATTACHMENTS' | 'PRACTICE' | 'QUIZ'
  const [activeSubtopicTab, setActiveSubtopicTab] = useState<'CONTENT' | 'ATTACHMENTS' | 'PRACTICE' | 'QUIZ'>('CONTENT');

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    setLoading(true);
    // Find course by ID or load all courses
    const allCoursesRes = await fetchApi('/courses');
    if (allCoursesRes.success && allCoursesRes.data?.courses) {
      const match = allCoursesRes.data.courses.find((c: any) => c.id === courseId);
      if (match) {
        const fullRes = await fetchApi(`/courses/${match.slug}`);
        if (fullRes.success && fullRes.data?.course) {
          setCourse(fullRes.data.course);
        }
      }
    }
    setLoading(false);
  };

  // Topic Handlers
  const openNewTopicModal = () => {
    setEditingTopicId(null);
    setTopicForm({ title: '', description: '' });
    setTopicModalOpen(true);
  };

  const openEditTopicModal = (topic: TopicView) => {
    setEditingTopicId(topic.id);
    setTopicForm({ title: topic.title, description: topic.description || '' });
    setTopicModalOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.title.trim()) return;

    setSavingTopic(true);
    if (editingTopicId) {
      const res = await fetchApi(`/courses/topics/${editingTopicId}`, {
        method: 'PUT',
        body: JSON.stringify(topicForm),
      });
      if (res.success) {
        setTopicModalOpen(false);
        loadCourse();
      } else {
        alert(res.message || 'Failed to update topic.');
      }
    } else {
      const res = await fetchApi(`/courses/${courseId}/topics`, {
        method: 'POST',
        body: JSON.stringify(topicForm),
      });
      if (res.success) {
        setTopicModalOpen(false);
        loadCourse();
      } else {
        alert(res.message || 'Failed to create topic.');
      }
    }
    setSavingTopic(false);
  };

  const handleDeleteTopic = async (topicId: string, title: string) => {
    if (!confirm(`Delete topic "${title}" and all its lessons?`)) return;
    const res = await fetchApi(`/courses/topics/${topicId}`, {
      method: 'DELETE',
    });
    if (res.success) {
      loadCourse();
    } else {
      alert(res.message || 'Failed to delete topic.');
    }
  };

  // Subtopic Handlers
  const openNewSubtopicModal = (topicId: string) => {
    setActiveTopicId(topicId);
    setEditingSubtopicId(null);
    setSubtopicForm({
      title: '',
      content: '# Lesson Title\n\nExplain key concepts here with codeblocks:\n\n```cpp\n// Code goes here\n```\n',
      attachments: [],
      hasQuiz: true,
      quizPassingScore: 25,
      quizData: [
        {
          id: 'q_0',
          questionText: 'What is the primary characteristic of this concept?',
          type: 'MCQ',
          codeSnippet: '',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswers: [0],
          explanation: 'Option A is correct according to the curriculum standard.',
        },
      ],
      codingQuestions: [],
      isPublished: true,
    });
    setActiveSubtopicTab('CONTENT');
    setSubtopicModalOpen(true);
  };

  const openEditSubtopicModal = async (topicId: string, sub: SubtopicView) => {
    setActiveTopicId(topicId);
    setEditingSubtopicId(sub.id);

    // Fetch full subtopic detail
    if (course) {
      const topic = course.topics.find((t) => t.id === topicId);
      if (topic) {
        const detailRes = await fetchApi(`/courses/${course.slug}/subtopics/${topic.slug}/${sub.slug}`);
        if (detailRes.success && detailRes.data?.subtopic) {
          const s = detailRes.data.subtopic;
          setSubtopicForm({
            id: s.id,
            title: s.title,
            slug: s.slug,
            content: s.content || '',
            attachments: s.attachments || [],
            hasQuiz: s.hasQuiz,
            quizPassingScore: s.quizPassingScore || 25,
            quizData: Array.isArray(s.quiz)
              ? s.quiz.map((q: any, i: number) => ({
                  id: q.id || `q_${i}`,
                  questionText: q.questionText || '',
                  type: q.type || 'MCQ',
                  codeSnippet: q.codeSnippet || '',
                  options: q.options || ['A', 'B', 'C', 'D'],
                  correctAnswers: q.correctAnswers || [0],
                  explanation: q.explanation || '',
                }))
              : [],
            codingQuestions: s.codingQuestions || [],
            isPublished: true,
          });
          setActiveSubtopicTab('CONTENT');
          setSubtopicModalOpen(true);
          return;
        }
      }
    }
  };

  const handleSaveSubtopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtopicForm.title.trim()) {
      alert('Lesson title is required.');
      return;
    }

    setSavingSubtopic(true);
    if (editingSubtopicId) {
      const res = await fetchApi(`/courses/subtopics/${editingSubtopicId}`, {
        method: 'PUT',
        body: JSON.stringify(subtopicForm),
      });
      if (res.success) {
        setSubtopicModalOpen(false);
        loadCourse();
      } else {
        alert(res.message || 'Failed to update lesson.');
      }
    } else if (activeTopicId) {
      const res = await fetchApi(`/courses/${activeTopicId}/subtopics`, {
        method: 'POST',
        body: JSON.stringify(subtopicForm),
      });
      if (res.success) {
        setSubtopicModalOpen(false);
        loadCourse();
      } else {
        alert(res.message || 'Failed to create lesson.');
      }
    }
    setSavingSubtopic(false);
  };

  const handleDeleteSubtopic = async (subtopicId: string, title: string) => {
    if (!confirm(`Delete lesson "${title}"?`)) return;
    const res = await fetchApi(`/courses/subtopics/${subtopicId}`, {
      method: 'DELETE',
    });
    if (res.success) {
      loadCourse();
    } else {
      alert(res.message || 'Failed to delete lesson.');
    }
  };

  // Attachment helpers
  const handleAddAttachment = () => {
    if (!newAttachmentUrl.trim()) return;
    setSubtopicForm({
      ...subtopicForm,
      attachments: [...subtopicForm.attachments, newAttachmentUrl.trim()],
    });
    setNewAttachmentUrl('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setSubtopicForm({
      ...subtopicForm,
      attachments: subtopicForm.attachments.filter((_, i) => i !== idx),
    });
  };

  // Coding Questions helpers
  const handleAddCodingQuestion = () => {
    const newQ: CodingQuestionForm = {
      id: `code_${Date.now()}`,
      title: 'New Practice Challenge',
      difficulty: 'MEDIUM',
      description: 'Write an algorithm to solve...',
      leetcodeUrl: 'https://leetcode.com/problems/...',
      starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}',
      examples: [{ input: 'x = 2.00000, n = 10', output: '1024.00000' }],
    };
    setSubtopicForm({
      ...subtopicForm,
      codingQuestions: [...subtopicForm.codingQuestions, newQ],
    });
  };

  const handleRemoveCodingQuestion = (idx: number) => {
    setSubtopicForm({
      ...subtopicForm,
      codingQuestions: subtopicForm.codingQuestions.filter((_, i) => i !== idx),
    });
  };

  // Quiz helpers
  const handleAddQuizQuestion = () => {
    const newQ: QuizQuestionForm = {
      id: `q_${Date.now()}`,
      questionText: 'What is the output or key rule of this code?',
      type: 'CODE_OUTPUT',
      codeSnippet: '// Code snippet\nint a = 10;\nstd::cout << a;',
      options: ['10', '0', 'Compilation Error', 'Undefined Behavior'],
      correctAnswers: [0],
      explanation: 'The code prints 10 to stdout.',
    };
    setSubtopicForm({
      ...subtopicForm,
      quizData: [...subtopicForm.quizData, newQ],
    });
  };

  const handleRemoveQuizQuestion = (idx: number) => {
    setSubtopicForm({
      ...subtopicForm,
      quizData: subtopicForm.quizData.filter((_, i) => i !== idx),
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gray-400 space-y-3">
        <Layers className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p>Loading Course Curriculum Builder...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-white">Course not found.</p>
        <Link href="/admin/courses" className="text-xs text-amber-400 hover:underline">
          Return to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>Curriculum Builder:</span>
            <span className="text-amber-400">{course.title}</span>
          </h1>
          <p className="text-xs text-gray-400">
            Structure topics, subtopics, Markdown readmes, photo attachments, LeetCode challenges, and mandatory quizzes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/read/${course.slug}`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Reader</span>
          </Link>
          <button
            type="button"
            onClick={openNewTopicModal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Module / Topic</span>
          </button>
        </div>
      </div>

      {/* Modules (Topics) & Lessons (Subtopics) Tree */}
      <div className="space-y-6">
        {course.topics.length === 0 ? (
          <div className="p-12 glass-card rounded-2xl border border-white/10 text-center space-y-4">
            <Layers className="w-10 h-10 text-gray-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No modules yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Add your first topic section (e.g., &quot;Modern C++ Fundamentals&quot;) to start attaching lessons.
            </p>
            <button
              type="button"
              onClick={openNewTopicModal}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Add Module
            </button>
          </div>
        ) : (
          course.topics.map((topic, tIdx) => (
            <div
              key={topic.id}
              className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl"
            >
              {/* Topic Header Bar */}
              <div className="p-4 sm:p-5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                    {tIdx + 1}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-white truncate">
                      {topic.title}
                    </h2>
                    {topic.description && (
                      <p className="text-xs text-gray-400 truncate">{topic.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openNewSubtopicModal(topic.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lesson</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditTopicModal(topic)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300"
                    title="Edit Topic Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTopic(topic.id, topic.title)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                    title="Delete Topic"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subtopics List */}
              <div className="divide-y divide-white/5">
                {topic.subtopics.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No lessons in this module. Click &quot;Add Lesson&quot; to write a readme with codeblocks.
                  </div>
                ) : (
                  topic.subtopics.map((sub, sIdx) => (
                    <div
                      key={sub.id}
                      className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-xs font-mono text-gray-500 shrink-0">
                          {tIdx + 1}.{sIdx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                            {sub.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {sub.hasQuiz && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25 flex items-center gap-1">
                                <HelpCircle className="w-3 h-3" />
                                Mandatory Quiz (Pass &ge; {sub.quizPassingScore || 25}%)
                              </span>
                            )}
                            {sub.attachments && sub.attachments.length > 0 && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {sub.attachments.length} Photos
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditSubtopicModal(topic.id, sub)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-200 border border-white/10 flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Lesson</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtopic(sub.id, sub.title)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                          title="Delete Lesson"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Topic Create/Edit */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl border border-white/20 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">
                {editingTopicId ? 'Edit Module Section' : 'Add New Module Section'}
              </h3>
              <button
                type="button"
                onClick={() => setTopicModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Module Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  placeholder="e.g. 1. Modern C++ Fundamentals"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={topicForm.description}
                  onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                  placeholder="Overview of this module's objectives..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-card text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTopic}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {savingTopic ? 'Saving...' : 'Save Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Full Subtopic / Lesson Author Studio */}
      {subtopicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="max-w-4xl w-full max-h-[92vh] glass-card rounded-3xl border border-white/20 p-6 flex flex-col space-y-4 animate-scale-up overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>{editingSubtopicId ? 'Edit Lesson' : 'Add New Lesson Studio'}</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Configure Markdown readme content, screenshot attachments, coding questions, and mandatory quizzes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubtopicModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Basics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Lesson Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subtopicForm.title}
                  onChange={(e) => setSubtopicForm({ ...subtopicForm, title: e.target.value })}
                  placeholder="e.g. C++ Anatomy, Memory Layout & Pointers"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Passing Threshold (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={subtopicForm.quizPassingScore}
                  onChange={(e) =>
                    setSubtopicForm({
                      ...subtopicForm,
                      quizPassingScore: parseInt(e.target.value) || 25,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveSubtopicTab('CONTENT')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  activeSubtopicTab === 'CONTENT'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Readme Markdown</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubtopicTab('ATTACHMENTS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  activeSubtopicTab === 'ATTACHMENTS'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photo Attachments ({subtopicForm.attachments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubtopicTab('PRACTICE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  activeSubtopicTab === 'PRACTICE'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>&quot;Let&apos;s Try&quot; Coding ({subtopicForm.codingQuestions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubtopicTab('QUIZ')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  activeSubtopicTab === 'QUIZ'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Mandatory Quiz ({subtopicForm.quizData.length})</span>
              </button>
            </div>

            {/* Tab Body Arena */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              {/* TAB 1: MARKDOWN README */}
              {activeSubtopicTab === 'CONTENT' && (
                <div className="space-y-2 h-full flex flex-col">
                  <label className="block text-xs font-semibold text-gray-300">
                    Readme Content (Supports GFM Markdown, headers, lists, and code blocks)
                  </label>
                  <textarea
                    rows={16}
                    value={subtopicForm.content}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, content: e.target.value })}
                    className="w-full flex-1 p-4 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-gray-200 focus:outline-none focus:border-amber-500 resize-none"
                    placeholder="Write your comprehensive technical lesson here..."
                  />
                </div>
              )}

              {/* TAB 2: PHOTO ATTACHMENTS */}
              {activeSubtopicTab === 'ATTACHMENTS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <label className="block text-xs font-bold text-gray-300">
                      Attach Screenshot or Diagram URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or screenshot image URL"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddAttachment}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shrink-0"
                      >
                        Add Photo
                      </button>
                    </div>
                  </div>

                  {subtopicForm.attachments.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">
                      No screenshots or diagrams attached. Add image URLs above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {subtopicForm.attachments.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-xl overflow-hidden border border-white/10 group"
                        >
                          <img src={url} alt="Attached Diagram" className="w-full h-40 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CODING CHALLENGES */}
              {activeSubtopicTab === 'PRACTICE' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Embed LeetCode or custom hands-on challenges into this lesson.
                    </span>
                    <button
                      type="button"
                      onClick={handleAddCodingQuestion}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Challenge
                    </button>
                  </div>

                  {subtopicForm.codingQuestions.map((cq, cqIdx) => (
                    <div
                      key={cq.id || cqIdx}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">
                          Challenge #{cqIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCodingQuestion(cqIdx)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={cq.title}
                          onChange={(e) => {
                            const updated = [...subtopicForm.codingQuestions];
                            updated[cqIdx].title = e.target.value;
                            setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                          }}
                          placeholder="Challenge Title (e.g. Reverse Linked List)"
                          className="col-span-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                        />
                        <select
                          value={cq.difficulty}
                          onChange={(e) => {
                            const updated = [...subtopicForm.codingQuestions];
                            updated[cqIdx].difficulty = e.target.value as any;
                            setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                          }}
                          className="px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                        >
                          <option value="EASY">EASY</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HARD">HARD</option>
                        </select>
                      </div>

                      <input
                        type="url"
                        value={cq.leetcodeUrl}
                        onChange={(e) => {
                          const updated = [...subtopicForm.codingQuestions];
                          updated[cqIdx].leetcodeUrl = e.target.value;
                          setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                        }}
                        placeholder="LeetCode Question Link (e.g. https://leetcode.com/problems/...)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white font-mono"
                      />

                      <textarea
                        rows={2}
                        value={cq.description}
                        onChange={(e) => {
                          const updated = [...subtopicForm.codingQuestions];
                          updated[cqIdx].description = e.target.value;
                          setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                        }}
                        placeholder="Problem description and algorithmic requirements..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: MANDATORY QUIZ BUILDER */}
              {activeSubtopicTab === 'QUIZ' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasQuizToggle"
                        checked={subtopicForm.hasQuiz}
                        onChange={(e) => setSubtopicForm({ ...subtopicForm, hasQuiz: e.target.checked })}
                        className="rounded text-amber-500"
                      />
                      <label htmlFor="hasQuizToggle" className="text-xs font-bold text-white">
                        Mandatory Quiz Enabled for this Lesson
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuizQuestion}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>

                  {subtopicForm.quizData.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                            #{qIdx + 1}
                          </span>
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const updated = [...subtopicForm.quizData];
                              updated[qIdx].type = e.target.value as any;
                              setSubtopicForm({ ...subtopicForm, quizData: updated });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-amber-300 font-mono font-bold"
                          >
                            <option value="MCQ">MCQ (Single Choice)</option>
                            <option value="MMQ">MMQ (Multiple Checkboxes)</option>
                            <option value="CODE_OUTPUT">Codeblock Output Prediction</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuizQuestion(qIdx)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>

                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...subtopicForm.quizData];
                          updated[qIdx].questionText = e.target.value;
                          setSubtopicForm({ ...subtopicForm, quizData: updated });
                        }}
                        placeholder="Question text..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                      />

                      {q.type === 'CODE_OUTPUT' && (
                        <textarea
                          rows={3}
                          value={q.codeSnippet}
                          onChange={(e) => {
                            const updated = [...subtopicForm.quizData];
                            updated[qIdx].codeSnippet = e.target.value;
                            setSubtopicForm({ ...subtopicForm, quizData: updated });
                          }}
                          placeholder="// Enter code snippet to predict output..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 font-mono text-xs text-amber-300"
                        />
                      )}

                      {/* Options & Answer Key */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-mono text-gray-400 block">
                          Options &amp; Correct Answer Check:
                        </span>
                        {q.options.map((opt, oIdx) => {
                          const isChecked = q.correctAnswers.includes(oIdx);

                          return (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type={q.type === 'MMQ' ? 'checkbox' : 'radio'}
                                name={`correct_${qIdx}`}
                                checked={isChecked}
                                onChange={() => {
                                  const updated = [...subtopicForm.quizData];
                                  if (q.type === 'MMQ') {
                                    if (isChecked) {
                                      updated[qIdx].correctAnswers = updated[qIdx].correctAnswers.filter(
                                        (i) => i !== oIdx
                                      );
                                    } else {
                                      updated[qIdx].correctAnswers.push(oIdx);
                                    }
                                  } else {
                                    updated[qIdx].correctAnswers = [oIdx];
                                  }
                                  setSubtopicForm({ ...subtopicForm, quizData: updated });
                                }}
                                className="rounded text-amber-500"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...subtopicForm.quizData];
                                  updated[qIdx].options[oIdx] = e.target.value;
                                  setSubtopicForm({ ...subtopicForm, quizData: updated });
                                }}
                                placeholder={`Option ${oIdx + 1}`}
                                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                              />
                            </div>
                          );
                        })}
                      </div>

                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => {
                          const updated = [...subtopicForm.quizData];
                          updated[qIdx].explanation = e.target.value;
                          setSubtopicForm({ ...subtopicForm, quizData: updated });
                        }}
                        placeholder="Explanation shown after quiz evaluation..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-gray-300"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 shrink-0">
              <span className="text-[11px] text-gray-400">
                Minimum score to unlock next topic: <strong>{subtopicForm.quizPassingScore}%</strong>
              </span>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setSubtopicModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-card text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingSubtopic}
                  onClick={handleSaveSubtopic}
                  className="px-6 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {savingSubtopic ? 'Saving Lesson...' : 'Save Lesson'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
