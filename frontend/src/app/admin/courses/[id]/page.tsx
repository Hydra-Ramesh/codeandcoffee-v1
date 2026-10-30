'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  UploadCloud,
  Loader2,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react';
import { fetchApi } from '../../../../lib/api';
import { getSocket } from '../../../../lib/socket';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import AdminCurriculumBuilderSkeleton from '../../../../components/skeletons/AdminCurriculumBuilderSkeleton';
import WarningCardModal, { WarningDetail } from '../../../../components/WarningCardModal';

interface QuizQuestionForm {
  id: string;
  questionText: string;
  type: 'MCQ' | 'MMQ' | 'CODE_OUTPUT';
  codeSnippet: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
}

export type CodingPlatform =
  | 'Self-created'
  | 'LeetCode'
  | 'Codeforces'
  | 'CodeChef'
  | 'InterviewBit'
  | 'Hello Interview'
  | 'Other';

interface CodingQuestionForm {
  id: string;
  title: string;
  platform?: CodingPlatform | string;
  customPlatformName?: string;
  problemUrl?: string;
  leetcodeUrl?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  description: string;
  starterCode?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
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
  isPublished?: boolean;
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
  const [topicForm, setTopicForm] = useState({ title: '', description: '', isPublished: true });
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

  // Toast & Cloudinary Attachment Upload
  const { success, error: toastError } = useToast();
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [copiedAttachmentIdx, setCopiedAttachmentIdx] = useState<number | null>(null);

  // Active Tab in Subtopic Modal: 'CONTENT' | 'ATTACHMENTS' | 'PRACTICE' | 'QUIZ'
  const [activeSubtopicTab, setActiveSubtopicTab] = useState<'CONTENT' | 'ATTACHMENTS' | 'PRACTICE' | 'QUIZ'>('CONTENT');

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

  useEffect(() => {
    if (courseId) {
      loadCourse();

      const socket = getSocket();
      const handleContentUpdate = (data: { courseId: string }) => {
        if (data.courseId === courseId) {
          loadCourse();
        }
      };

      if (socket && socket.on) {
        socket.on('course:content_updated', handleContentUpdate);
      }

      return () => {
        if (socket && socket.off) {
          socket.off('course:content_updated', handleContentUpdate);
        }
      };
    }
  }, [courseId]);

  const loadCourse = async () => {
    setLoading(true);
    // Find course by ID or load all courses
    const allCoursesRes = await fetchApi('/courses?includeDrafts=true');
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

  // Course Publish Toggle
  const handleTogglePublishCourse = async () => {
    if (!course) return;
    const nextState = !course.isPublished;
    setWarningModal({
      isOpen: true,
      title: nextState ? 'Publish Course to Catalog' : 'Unpublish Course',
      description: nextState
        ? `Are you sure you want to publish "${course.title}"? Students will immediately be able to view and enroll in this course syllabus.`
        : `Are you sure you want to unpublish "${course.title}"? It will be hidden from students and saved as a draft.`,
      actionVerb: nextState ? 'Confirm & Publish' : 'Confirm & Unpublish',
      variant: nextState ? 'success' : 'warning',
      badgeText: nextState ? 'Publish Action' : 'Visibility Change',
      details: [{ label: 'Course Title', value: course.title }],
      onConfirm: async () => {
        setWarningModalLoading(true);
        const res = await fetchApi(`/courses/${course.id}`, {
          method: 'PUT',
          body: JSON.stringify({ isPublished: nextState }),
        });
        if (res.success) {
          setCourse((prev) => (prev ? { ...prev, isPublished: nextState } : null));
          success(
            nextState
              ? `Published course "${course.title}" to student catalog!`
              : `Unpublished course "${course.title}" (saved as draft).`
          );
          setWarningModal((m) => ({ ...m, isOpen: false }));
        } else {
          toastError(res.message || 'Failed to update course publication status.');
        }
        setWarningModalLoading(false);
      },
    });
  };

  // Topic (Module) Handlers
  const handleTogglePublishTopic = async (topic: TopicView) => {
    const nextState = topic.isPublished === false;
    setWarningModal({
      isOpen: true,
      title: nextState ? 'Publish Module Topic' : 'Unpublish Module Topic',
      description: `Are you sure you want to ${nextState ? 'publish' : 'unpublish'} topic "${topic.title}"?`,
      actionVerb: nextState ? 'Publish Topic' : 'Unpublish Topic',
      variant: nextState ? 'success' : 'warning',
      details: [{ label: 'Topic Title', value: topic.title }],
      onConfirm: async () => {
        setWarningModalLoading(true);
        const res = await fetchApi(`/courses/topics/${topic.id}`, {
          method: 'PUT',
          body: JSON.stringify({ isPublished: nextState }),
        });
        if (res.success) {
          setCourse((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              topics: prev.topics.map((t) =>
                t.id === topic.id ? { ...t, isPublished: nextState } : t
              ),
            };
          });
          success(
            nextState
              ? `Published module "${topic.title}"`
              : `Unpublished module "${topic.title}" (saved as draft)`
          );
          setWarningModal((m) => ({ ...m, isOpen: false }));
        } else {
          toastError(res.message || 'Failed to update module publication status.');
        }
        setWarningModalLoading(false);
      },
    });
  };

  const handleTogglePublishSubtopic = async (topicId: string, sub: SubtopicView) => {
    const nextState = sub.isPublished === false;
    setWarningModal({
      isOpen: true,
      title: nextState ? 'Publish Lesson' : 'Unpublish Lesson',
      description: `Are you sure you want to ${nextState ? 'publish' : 'unpublish'} lesson "${sub.title}"?`,
      actionVerb: nextState ? 'Publish Lesson' : 'Unpublish Lesson',
      variant: nextState ? 'success' : 'warning',
      details: [{ label: 'Lesson Title', value: sub.title }],
      onConfirm: async () => {
        setWarningModalLoading(true);
        const res = await fetchApi(`/courses/subtopics/${sub.id}`, {
          method: 'PUT',
          body: JSON.stringify({ isPublished: nextState }),
        });
        if (res.success) {
          setCourse((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              topics: prev.topics.map((t) => {
                if (t.id !== topicId) return t;
                return {
                  ...t,
                  subtopics: t.subtopics.map((s) =>
                    s.id === sub.id ? { ...s, isPublished: nextState } : s
                  ),
                };
              }),
            };
          });
          success(
            nextState
              ? `Published lesson "${sub.title}"`
              : `Unpublished lesson "${sub.title}" (saved as draft)`
          );
          setWarningModal((m) => ({ ...m, isOpen: false }));
        } else {
          toastError(res.message || 'Failed to update lesson publication status.');
        }
        setWarningModalLoading(false);
      },
    });
  };

  const openNewTopicModal = () => {
    setEditingTopicId(null);
    setTopicForm({ title: '', description: '', isPublished: true });
    setTopicModalOpen(true);
  };

  const openEditTopicModal = (topic: TopicView) => {
    setEditingTopicId(topic.id);
    setTopicForm({
      title: topic.title,
      description: topic.description || '',
      isPublished: topic.isPublished !== false,
    });
    setTopicModalOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.title.trim()) {
      toastError('Topic title is required.');
      return;
    }

    if (editingTopicId) {
      setWarningModal({
        isOpen: true,
        title: 'Update Topic Curriculum',
        description: `Are you sure you want to update topic "${topicForm.title}"? Changes will be immediately reflected in the course syllabus.`,
        actionVerb: 'Confirm & Update',
        variant: 'warning',
        details: [
          { label: 'Topic Title', value: topicForm.title },
          { label: 'Visibility', value: topicForm.isPublished ? 'Published' : 'Draft' },
        ],
        onConfirm: async () => {
          setWarningModalLoading(true);
          const res = await fetchApi(`/courses/topics/${editingTopicId}`, {
            method: 'PUT',
            body: JSON.stringify(topicForm),
          });
          if (res.success) {
            setTopicModalOpen(false);
            loadCourse();
            success(`Topic "${topicForm.title}" updated successfully!`);
            setWarningModal((m) => ({ ...m, isOpen: false }));
          } else {
            toastError(res.message || 'Failed to update topic.');
          }
          setWarningModalLoading(false);
        },
      });
      return;
    }

    setSavingTopic(true);
    const res = await fetchApi(`/courses/${courseId}/topics`, {
      method: 'POST',
      body: JSON.stringify(topicForm),
    });
    if (res.success) {
      setTopicModalOpen(false);
      loadCourse();
      success(`Topic "${topicForm.title}" created successfully!`);
    } else {
      toastError(res.message || 'Failed to create topic.');
    }
    setSavingTopic(false);
  };

  const handleDeleteTopic = async (topicId: string, title: string) => {
    setWarningModal({
      isOpen: true,
      title: 'Delete Topic & Lessons',
      description: `Are you sure you want to permanently delete topic "${title}"? All lessons, quizzes, and coding challenges inside this topic will be permanently deleted.`,
      actionVerb: 'Delete Topic',
      badgeText: 'Destructive Action',
      variant: 'danger',
      details: [{ label: 'Topic Title', value: title }],
      onConfirm: async () => {
        setWarningModalLoading(true);
        const res = await fetchApi(`/courses/topics/${topicId}`, {
          method: 'DELETE',
        });
        if (res.success) {
          loadCourse();
          success(`Topic "${title}" and all its lessons deleted.`);
          setWarningModal((m) => ({ ...m, isOpen: false }));
        } else {
          toastError(res.message || 'Failed to delete topic.');
        }
        setWarningModalLoading(false);
      },
    });
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
            codingQuestions: Array.isArray(s.codingQuestions)
              ? s.codingQuestions.map((q: any, i: number) => ({
                  id: q.id || `code_${i}`,
                  title: q.title || 'Practice Challenge',
                  platform: q.platform || (q.leetcodeUrl ? 'LeetCode' : 'Self-created'),
                  customPlatformName: q.customPlatformName || '',
                  problemUrl: q.problemUrl || q.leetcodeUrl || '',
                  leetcodeUrl: q.leetcodeUrl || q.problemUrl || '',
                  difficulty: q.difficulty || 'MEDIUM',
                  description: q.description || '',
                  starterCode: q.starterCode || '',
                  examples: Array.isArray(q.examples) ? q.examples : [],
                }))
              : [],
            isPublished: s.isPublished !== undefined ? s.isPublished : (sub.isPublished !== undefined ? sub.isPublished : true),
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
      toastError('Lesson title is required.');
      return;
    }

    if (editingSubtopicId) {
      setWarningModal({
        isOpen: true,
        title: 'Update Lesson & Syllabus',
        description: `Are you sure you want to update lesson "${subtopicForm.title}"? All markdown explanations, quizzes, and practice coding challenges will be saved and visible to students.`,
        actionVerb: 'Confirm & Update',
        variant: 'warning',
        details: [
          { label: 'Lesson Title', value: subtopicForm.title },
          {
            label: 'Quiz Questions',
            value: `${subtopicForm.quizData.length} Question${subtopicForm.quizData.length === 1 ? '' : 's'}`,
          },
          {
            label: 'Coding Challenges',
            value: `${subtopicForm.codingQuestions.length} Challenge${subtopicForm.codingQuestions.length === 1 ? '' : 's'}`,
          },
          { label: 'Visibility', value: subtopicForm.isPublished ? 'Published' : 'Draft' },
        ],
        onConfirm: async () => {
          setWarningModalLoading(true);
          const res = await fetchApi(`/courses/subtopics/${editingSubtopicId}`, {
            method: 'PUT',
            body: JSON.stringify(subtopicForm),
          });
          if (res.success) {
            setSubtopicModalOpen(false);
            loadCourse();
            success(`Lesson "${subtopicForm.title}" updated successfully!`);
            setWarningModal((m) => ({ ...m, isOpen: false }));
          } else {
            toastError(res.message || 'Failed to update lesson.');
          }
          setWarningModalLoading(false);
        },
      });
      return;
    }

    if (activeTopicId) {
      setSavingSubtopic(true);
      const res = await fetchApi(`/courses/${activeTopicId}/subtopics`, {
        method: 'POST',
        body: JSON.stringify(subtopicForm),
      });
      if (res.success) {
        setSubtopicModalOpen(false);
        loadCourse();
        success(`Lesson "${subtopicForm.title}" created successfully!`);
      } else {
        toastError(res.message || 'Failed to create lesson.');
      }
      setSavingSubtopic(false);
    }
  };

  const handleDeleteSubtopic = async (subtopicId: string, title: string) => {
    setWarningModal({
      isOpen: true,
      title: 'Delete Lesson',
      description: `Are you sure you want to delete lesson "${title}"? All curriculum content, markdown codeblocks, quizzes, and practice challenges will be permanently lost.`,
      actionVerb: 'Delete Lesson',
      badgeText: 'Destructive Action',
      variant: 'danger',
      details: [{ label: 'Lesson Title', value: title }],
      onConfirm: async () => {
        setWarningModalLoading(true);
        const res = await fetchApi(`/courses/subtopics/${subtopicId}`, {
          method: 'DELETE',
        });
        if (res.success) {
          loadCourse();
          success(`Lesson "${title}" deleted successfully.`);
          setWarningModal((m) => ({ ...m, isOpen: false }));
        } else {
          toastError(res.message || 'Failed to delete lesson.');
        }
        setWarningModalLoading(false);
      },
    });
  };

  // Cloudinary Attachment Upload & Insertion
  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Please choose an image file (PNG, JPG, WebP, SVG, GIF).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toastError('Image size must be under 15MB.');
      return;
    }

    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetchApi('/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data?.url) {
        setSubtopicForm((prev) => ({
          ...prev,
          attachments: [...prev.attachments, res.data.url],
        }));
        success('Diagram / Photo uploaded to Cloudinary successfully!');
      } else {
        toastError(res.message || 'Failed to upload photo to Cloudinary.');
      }
    } catch (err: any) {
      toastError(err?.message || 'Error uploading photo to Cloudinary.');
    } finally {
      setUploadingAttachment(false);
      if (attachmentFileInputRef.current) {
        attachmentFileInputRef.current.value = '';
      }
    }
  };

  const handleInsertAttachmentIntoContent = (url: string) => {
    const markdownImage = `\n\n![Diagram / Screenshot](${url})\n`;
    setSubtopicForm((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content.trimEnd()}${markdownImage}` : markdownImage,
    }));
    success('Inserted photo markdown into lesson editor!');
  };

  const handleCopyAttachmentUrl = (url: string, idx: number) => {
    navigator.clipboard.writeText(url);
    setCopiedAttachmentIdx(idx);
    success('Copied Cloudinary URL to clipboard!');
    setTimeout(() => setCopiedAttachmentIdx(null), 2500);
  };

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
      title: 'New Coding Challenge',
      platform: 'Self-created',
      customPlatformName: '',
      problemUrl: '',
      leetcodeUrl: '',
      difficulty: 'MEDIUM',
      description: '### Problem Statement\n\nExplain the task, input format, constraints, and requirements here like a Practice Sheet.\n\n### Constraints\n- `1 <= N <= 10^5`\n',
      starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
      examples: [{ input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }],
    };
    setSubtopicForm({
      ...subtopicForm,
      codingQuestions: [...subtopicForm.codingQuestions, newQ],
    });
    success('Added new coding challenge.');
  };

  const handleRemoveCodingQuestion = (idx: number) => {
    const cq = subtopicForm.codingQuestions[idx];
    setWarningModal({
      isOpen: true,
      title: 'Remove Coding Challenge',
      description: `Are you sure you want to remove practice challenge "${cq?.title || 'Practice Challenge'}" from this lesson?`,
      actionVerb: 'Remove Challenge',
      variant: 'danger',
      badgeText: 'Challenge Removal',
      details: [
        { label: 'Title', value: cq?.title || 'Practice Challenge' },
        { label: 'Platform', value: cq?.platform || 'Self-created' },
      ],
      onConfirm: async () => {
        setSubtopicForm((prev) => ({
          ...prev,
          codingQuestions: prev.codingQuestions.filter((_, i) => i !== idx),
        }));
        success('Practice coding challenge removed.');
        setWarningModal((m) => ({ ...m, isOpen: false }));
      },
    });
  };

  const handleAddExampleToChallenge = (cqIdx: number) => {
    const updated = [...subtopicForm.codingQuestions];
    const existingExamples = updated[cqIdx].examples || [];
    updated[cqIdx].examples = [
      ...existingExamples,
      { input: '', output: '', explanation: '' },
    ];
    setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
  };

  const handleRemoveExampleFromChallenge = (cqIdx: number, exIdx: number) => {
    const updated = [...subtopicForm.codingQuestions];
    updated[cqIdx].examples = (updated[cqIdx].examples || []).filter((_, i) => i !== exIdx);
    setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
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
    success('Added new quiz question.');
  };

  const handleRemoveQuizQuestion = (idx: number) => {
    const q = subtopicForm.quizData[idx];
    setWarningModal({
      isOpen: true,
      title: 'Remove Quiz Question',
      description: `Are you sure you want to remove quiz question #${idx + 1}?`,
      actionVerb: 'Remove Question',
      variant: 'danger',
      badgeText: 'Quiz Removal',
      details: [
        { label: 'Question Number', value: `#${idx + 1}` },
        { label: 'Question Text', value: q?.questionText || 'Quiz Question' },
      ],
      onConfirm: async () => {
        setSubtopicForm((prev) => ({
          ...prev,
          quizData: prev.quizData.filter((_, i) => i !== idx),
        }));
        success(`Removed quiz question #${idx + 1}.`);
        setWarningModal((m) => ({ ...m, isOpen: false }));
      },
    });
  };

  if (loading) {
    return <AdminCurriculumBuilderSkeleton />;
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
        <div className="space-y-1.5">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>Curriculum Builder:</span>
              <span className="text-amber-400">{course.title}</span>
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
                course.isPublished
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
              }`}
            >
              {course.isPublished ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              <span>{course.isPublished ? 'Course Published' : 'Course in Draft'}</span>
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Structure topics, subtopics, Markdown readmes, photo attachments, LeetCode challenges, and mandatory quizzes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Publish / Unpublish Course Button */}
          <button
            type="button"
            onClick={handleTogglePublishCourse}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
              course.isPublished
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
            title={
              course.isPublished
                ? 'Unpublish Course (Hide from learners)'
                : 'Publish Course (Make public to students)'
            }
          >
            {course.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
            <span>{course.isPublished ? 'Unpublish Course' : 'Publish Course'}</span>
          </button>

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
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
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
              <div className="p-4 sm:p-5 bg-white/[0.02] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                    {tIdx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-white truncate">
                        {topic.title}
                      </h2>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${
                          topic.isPublished !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        }`}
                      >
                        {topic.isPublished !== false ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {topic.description && (
                      <p className="text-xs text-gray-400 truncate">{topic.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Publish / Unpublish Module Button */}
                  <button
                    type="button"
                    onClick={() => handleTogglePublishTopic(topic)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                      topic.isPublished !== false
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                    title={
                      topic.isPublished !== false
                        ? 'Unpublish Module (Hide from public syllabus)'
                        : 'Publish Module (Make visible in syllabus)'
                    }
                  >
                    {topic.isPublished !== false ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{topic.isPublished !== false ? 'Unpublish' : 'Publish'}</span>
                  </button>

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
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 cursor-pointer"
                    title="Edit Module Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTopic(topic.id, topic.title)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 cursor-pointer"
                    title="Delete Module"
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
                      className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-xs font-mono text-gray-500 shrink-0">
                          {tIdx + 1}.{sIdx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                              {sub.title}
                            </h4>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${
                                sub.isPublished !== false
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              }`}
                            >
                              {sub.isPublished !== false ? 'Published' : 'Draft'}
                            </span>
                          </div>
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
                        {/* Publish / Unpublish Lesson Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublishSubtopic(topic.id, sub)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                            sub.isPublished !== false
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                          title={
                            sub.isPublished !== false
                              ? 'Unpublish Lesson (Hide from learners)'
                              : 'Publish Lesson (Make available to learners)'
                          }
                        >
                          {sub.isPublished !== false ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{sub.isPublished !== false ? 'Unpublish' : 'Publish'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditSubtopicModal(topic.id, sub)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-200 border border-white/10 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Lesson</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtopic(sub.id, sub.title)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 cursor-pointer"
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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="topicPublished"
                  checked={topicForm.isPublished}
                  onChange={(e) => setTopicForm({ ...topicForm, isPublished: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-white/20"
                />
                <label htmlFor="topicPublished" className="text-xs text-gray-300 cursor-pointer select-none">
                  Publish module (visible in course syllabus)
                </label>
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

              {/* TAB 2: PHOTO ATTACHMENTS (CLOUDINARY) */}
              {activeSubtopicTab === 'ATTACHMENTS' && (
                <div className="space-y-5">
                  {/* Hidden file input */}
                  <input
                    ref={attachmentFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadAttachment}
                  />

                  {/* Primary Upload Dropzone / Button */}
                  <div
                    onClick={() => !uploadingAttachment && attachmentFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      uploadingAttachment
                        ? 'border-amber-500/50 bg-amber-500/5 cursor-wait'
                        : 'border-white/15 hover:border-amber-500/60 bg-white/[0.02] hover:bg-amber-500/[0.03]'
                    }`}
                  >
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-600/30 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
                        {uploadingAttachment ? (
                          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                        ) : (
                          <UploadCloud className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {uploadingAttachment ? 'Uploading Photo to Cloudinary CDN...' : 'Upload Screenshot or Diagram'}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          Click to browse image or diagram from your device. Auto-optimized &amp; stored on Cloudinary CDN.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={uploadingAttachment}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {uploadingAttachment ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Choose Image from Device</span>
                            </>
                          )}
                        </button>
                      </div>
                      <span className="inline-block text-[10px] text-gray-500 font-mono">
                        PNG, JPG, WEBP, SVG, GIF up to 15MB
                      </span>
                    </div>
                  </div>

                  {/* Secondary Manual External URL input */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <label className="block text-xs font-bold text-gray-300">
                      Or Attach via External Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or CDN image URL"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddAttachment}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shrink-0 transition-colors"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Photos Grid */}
                  {subtopicForm.attachments.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500 border border-white/5 rounded-2xl">
                      No screenshots or diagrams attached yet. Upload images above to include diagrams in this lesson.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                        <span>Attached Photos ({subtopicForm.attachments.length})</span>
                        <span className="text-[11px] text-amber-400">Click &ldquo;Insert&rdquo; to add into lesson content</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {subtopicForm.attachments.map((url, idx) => {
                          const isCloudinary = url.includes('cloudinary.com');
                          return (
                            <div
                              key={idx}
                              className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 group shadow-md"
                            >
                              <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                                <img
                                  src={url}
                                  alt={`Attached Diagram ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {/* Badge */}
                                <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  isCloudinary
                                    ? 'bg-blue-600/90 text-white shadow-sm'
                                    : 'bg-black/70 text-gray-300 backdrop-blur-sm'
                                }`}>
                                  {isCloudinary ? 'Cloudinary CDN' : 'External Asset'}
                                </span>
                              </div>

                              {/* Card Footer with Actions */}
                              <div className="p-2.5 bg-slate-900/90 border-t border-white/10 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-gray-400 truncate max-w-[130px] font-mono">
                                  {url.split('/').pop() || `Photo #${idx + 1}`}
                                </span>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleInsertAttachmentIntoContent(url)}
                                    title="Insert markdown code into lesson editor"
                                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>Insert</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyAttachmentUrl(url, idx)}
                                    title="Copy URL"
                                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs transition-colors"
                                  >
                                    {copiedAttachmentIdx === idx ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(idx)}
                                    title="Remove attachment"
                                    className="p-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CODING CHALLENGES & PRACTICE ASSIGNMENTS */}
              {activeSubtopicTab === 'PRACTICE' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">Coding Practice Challenges</h4>
                      <p className="text-[11px] text-gray-400">
                        Embed self-created practice sheet problems (with Readme &amp; test cases) or external challenges from LeetCode, Codeforces, CodeChef, InterviewBit, Hello Interview, or any other platform.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCodingQuestion}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Challenge
                    </button>
                  </div>

                  {subtopicForm.codingQuestions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500 border border-white/5 rounded-2xl space-y-2">
                      <Code2 className="w-8 h-8 text-gray-600 mx-auto" />
                      <p>No coding practice assignments added to this lesson yet.</p>
                      <button
                        type="button"
                        onClick={handleAddCodingQuestion}
                        className="text-amber-400 hover:underline text-xs font-medium"
                      >
                        + Add your first practice challenge
                      </button>
                    </div>
                  ) : (
                    subtopicForm.codingQuestions.map((cq, cqIdx) => {
                      const platform = cq.platform || (cq.leetcodeUrl ? 'LeetCode' : 'Self-created');
                      const isSelfCreated = platform === 'Self-created';
                      const isOther = platform === 'Other';

                      return (
                        <div
                          key={cq.id || cqIdx}
                          className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 shadow-lg"
                        >
                          {/* Header: Title & Remove */}
                          <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                                #{cqIdx + 1}
                              </span>
                              <span className="text-xs font-bold text-white">
                                {cq.title || `Challenge #${cqIdx + 1}`}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-gray-300">
                                {isOther ? (cq.customPlatformName || 'Custom Platform') : platform}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCodingQuestion(cqIdx)}
                              className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>

                          {/* Platform & Difficulty Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Platform Selector */}
                            <div>
                              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                                Assignment Platform *
                              </label>
                              <select
                                value={platform}
                                onChange={(e) => {
                                  const newPlatform = e.target.value;
                                  const updated = [...subtopicForm.codingQuestions];
                                  updated[cqIdx].platform = newPlatform;
                                  setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                              >
                                <option value="Self-created">Self-created (Readme like Practice Sheet)</option>
                                <option value="LeetCode">LeetCode</option>
                                <option value="Codeforces">Codeforces</option>
                                <option value="CodeChef">CodeChef</option>
                                <option value="InterviewBit">InterviewBit</option>
                                <option value="Hello Interview">Hello Interview</option>
                                <option value="Other">Other (Custom Website Name)</option>
                              </select>
                            </div>

                            {/* If Other -> Custom Website Name Input */}
                            {isOther && (
                              <div>
                                <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                  Website / Platform Name *
                                </label>
                                <input
                                  type="text"
                                  value={cq.customPlatformName || ''}
                                  onChange={(e) => {
                                    const updated = [...subtopicForm.codingQuestions];
                                    updated[cqIdx].customPlatformName = e.target.value;
                                    setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                                  }}
                                  placeholder="e.g. GeeksforGeeks, HackerRank, AtCoder"
                                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            )}

                            {/* Difficulty */}
                            <div className={isOther ? '' : 'sm:col-span-1'}>
                              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                                Difficulty
                              </label>
                              <select
                                value={cq.difficulty}
                                onChange={(e) => {
                                  const updated = [...subtopicForm.codingQuestions];
                                  updated[cqIdx].difficulty = e.target.value as any;
                                  setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                              >
                                <option value="EASY">EASY</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HARD">HARD</option>
                              </select>
                            </div>

                            {/* Problem Title */}
                            <div className={isOther ? 'sm:col-span-3' : 'sm:col-span-1'}>
                              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                                Problem Title *
                              </label>
                              <input
                                type="text"
                                value={cq.title}
                                onChange={(e) => {
                                  const updated = [...subtopicForm.codingQuestions];
                                  updated[cqIdx].title = e.target.value;
                                  setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                                }}
                                placeholder="e.g. Invert Binary Tree"
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          {/* If Not Self-created -> External Problem URL */}
                          {!isSelfCreated && (
                            <div>
                              <label className="block text-[11px] font-bold text-gray-300 mb-1 flex items-center justify-between">
                                <span>
                                  Problem URL on {isOther ? (cq.customPlatformName || 'Platform') : platform} *
                                </span>
                                <span className="text-[10px] text-amber-400 font-mono">
                                  Direct solve link for students
                                </span>
                              </label>
                              <div className="relative">
                                <ExternalLink className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                  type="url"
                                  value={cq.problemUrl || cq.leetcodeUrl || ''}
                                  onChange={(e) => {
                                    const updated = [...subtopicForm.codingQuestions];
                                    updated[cqIdx].problemUrl = e.target.value;
                                    updated[cqIdx].leetcodeUrl = e.target.value;
                                    setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                                  }}
                                  placeholder={`https://${platform.toLowerCase().replace(/\s+/g, '')}.com/problems/...`}
                                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          )}

                          {/* Description / Readme textarea */}
                          <div>
                            <label className="block text-[11px] font-bold text-gray-300 mb-1 flex items-center justify-between">
                              <span>
                                {isSelfCreated ? 'Readme / Problem Statement (Markdown Supported) *' : 'Problem Notes, Hints & Requirements (Optional)'}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">Supports GFM &amp; Codeblocks</span>
                            </label>
                            <textarea
                              rows={isSelfCreated ? 6 : 3}
                              value={cq.description}
                              onChange={(e) => {
                                const updated = [...subtopicForm.codingQuestions];
                                updated[cqIdx].description = e.target.value;
                                setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                              }}
                              placeholder={
                                isSelfCreated
                                  ? '### Problem Statement\n\nGiven an array of integers...\n\n### Constraints\n- `1 <= nums.length <= 10^5`'
                                  : 'Add brief hints, algorithmic complexity requirements, or key edge cases for this external problem...'
                              }
                              className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Starter Code (Especially prominent for Self-created) */}
                          <div>
                            <label className="block text-[11px] font-bold text-gray-300 mb-1 flex items-center justify-between">
                              <span>Starter Code Template {isSelfCreated && '(Sandbox)'}</span>
                              <span className="text-[10px] text-gray-500 font-mono">C++, Java, Python, or JS template</span>
                            </label>
                            <textarea
                              rows={isSelfCreated ? 5 : 3}
                              value={cq.starterCode || ''}
                              onChange={(e) => {
                                const updated = [...subtopicForm.codingQuestions];
                                updated[cqIdx].starterCode = e.target.value;
                                setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                              }}
                              placeholder="// Starter boilerplate code provided to students&#10;#include <vector>&#10;using namespace std;&#10;&#10;class Solution { ... };"
                              className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-emerald-400 font-mono focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Input / Output Examples */}
                          <div className="space-y-2 pt-1 border-t border-white/5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-300">
                                Input / Output Examples &amp; Test Cases ({cq.examples?.length || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddExampleToChallenge(cqIdx)}
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-3 h-3" /> Add Example
                              </button>
                            </div>

                            {cq.examples && cq.examples.length > 0 && (
                              <div className="space-y-2">
                                {cq.examples.map((ex, exIdx) => (
                                  <div
                                    key={exIdx}
                                    className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono font-bold text-amber-400">
                                        Example #{exIdx + 1}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveExampleFromChallenge(cqIdx, exIdx)}
                                        className="text-red-400 hover:text-red-300 text-[10px]"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={ex.input}
                                        onChange={(e) => {
                                          const updated = [...subtopicForm.codingQuestions];
                                          if (updated[cqIdx].examples) {
                                            updated[cqIdx].examples[exIdx].input = e.target.value;
                                            setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                                          }
                                        }}
                                        placeholder="Input: nums = [2,7,11,15], target = 9"
                                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white font-mono"
                                      />
                                      <input
                                        type="text"
                                        value={ex.output}
                                        onChange={(e) => {
                                          const updated = [...subtopicForm.codingQuestions];
                                          if (updated[cqIdx].examples) {
                                            updated[cqIdx].examples[exIdx].output = e.target.value;
                                            setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                                          }
                                        }}
                                        placeholder="Output: [0, 1]"
                                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white font-mono"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      value={ex.explanation || ''}
                                      onChange={(e) => {
                                        const updated = [...subtopicForm.codingQuestions];
                                        if (updated[cqIdx].examples) {
                                          updated[cqIdx].examples[exIdx].explanation = e.target.value;
                                          setSubtopicForm({ ...subtopicForm, codingQuestions: updated });
                                        }
                                      }}
                                      placeholder="Explanation (Optional): Because nums[0] + nums[1] == 9, we return [0, 1]."
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-gray-300"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
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
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-gray-400">
                  Minimum score to unlock next topic: <strong>{subtopicForm.quizPassingScore}%</strong>
                </span>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 select-none">
                  <input
                    type="checkbox"
                    checked={subtopicForm.isPublished}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, isPublished: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-white/20"
                  />
                  <span>Published Lesson</span>
                </label>
              </div>

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

      {/* Warning Confirmation Modal */}
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
