'use client';

import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  UploadCloud,
  Eye,
  Edit3,
  SplitSquareVertical,
  Trash2,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import MarkdownViewer from './MarkdownViewer';
import { fetchApi } from '../lib/api';
import { useToast } from '../context/ToastContext';

interface MarkdownEditorProps {
  title: string;
  setTitle: (val: string) => void;
  excerpt: string;
  setExcerpt: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  bannerImage: string;
  setBannerImage: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  tags: string;
  setTags: (val: string) => void;
  isPublished: boolean;
  setIsPublished: (val: boolean) => void;
  onSave: () => void;
  saving?: boolean;
}

export default function MarkdownEditor({
  title,
  setTitle,
  excerpt,
  setExcerpt,
  content,
  setContent,
  bannerImage,
  setBannerImage,
  category,
  setCategory,
  tags,
  setTags,
  isPublished,
  setIsPublished,
  onSave,
  saving = false,
}: MarkdownEditorProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const safeContent = typeof content === 'string' ? content : '';
  const safeTitle = typeof title === 'string' ? title : '';

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = typeof content === 'string' ? content : '';
    const selection = current.substring(start, end) || 'text';
    const replacement = `${before}${selection}${after}`;

    const newContent = current.substring(0, start) + replacement + current.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selection.length);
    }, 0);
  };

  const uploadBannerFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file (JPG, PNG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('Image exceeds the 10MB maximum limit.');
      return;
    }

    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetchApi('/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data?.url) {
        setBannerImage(res.data.url);
        toast.success('Hero banner uploaded to Cloudinary successfully!');
      } else {
        toast.error(res.message || 'Image upload failed. Please verify Cloudinary credentials.');
      }
    } catch {
      toast.error('Network error during image upload.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadBannerFile(file);
    }
    e.target.value = '';
  };

  const handleBannerDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBanner(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadBannerFile(file);
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInline(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetchApi('/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data?.url) {
        insertText(`\n![${file.name.replace(/\.[^/.]+$/, '')}](${res.data.url})\n`);
        toast.success('Inline figure uploaded to Cloudinary and inserted!');
      } else {
        toast.error(res.message || 'Inline image upload failed.');
      }
    } catch {
      toast.error('Network error during inline image upload.');
    } finally {
      e.target.value = '';
      setUploadingInline(false);
    }
  };

  const words = safeContent.trim() ? safeContent.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="space-y-6">
      {/* Article Metadata Configuration */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Blog Post Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Scaling Distributed Event-Driven Pipelines to 10M Events"
            required
            className="w-full px-4 py-3 text-lg font-bold rounded-xl glass-input text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Short Catchy Excerpt (Shown on Home Page Card)
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="A compelling 1-2 sentence preview for the home page blog cards..."
            rows={2}
            required
            className="w-full px-4 py-2.5 text-sm rounded-xl glass-input text-gray-200 placeholder-gray-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Primary Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl glass-input text-white bg-slate-900"
            >
              <option value="System Design">System Design</option>
              <option value="Web Engineering">Web Engineering</option>
              <option value="Security & DevOps">Security &amp; DevOps</option>
              <option value="Backend Architecture">Backend Architecture</option>
              <option value="AI & Engineering">AI &amp; Engineering</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Postgres, Redis, Next.js, Scale"
              className="w-full px-4 py-2.5 text-sm rounded-xl glass-input text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Publication Status
            </label>
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-white/20"
                />
                <span>Publish to Public Landing Page</span>
              </label>
            </div>
          </div>
        </div>

        {/* Banner Image Uploader & Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Cover Banner Photo
            </label>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              {showUrlInput ? '← Switch to Photo Upload' : 'Or paste direct URL'}
            </button>
          </div>

          {showUrlInput ? (
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="text"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="https://res.cloudinary.com/... or https://images.unsplash.com/..."
                className="flex-1 w-full px-4 py-2.5 text-sm rounded-xl glass-input text-white placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => bannerFileInputRef.current?.click()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-card hover:bg-white/10 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Photo Instead
              </button>
            </div>
          ) : !bannerImage ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingBanner(true);
              }}
              onDragLeave={() => setIsDraggingBanner(false)}
              onDrop={handleBannerDrop}
              onClick={() => bannerFileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDraggingBanner
                  ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                  : 'border-white/15 hover:border-amber-500/50 hover:bg-white/5 bg-slate-950/40'
              }`}
            >
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={uploadingBanner}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <UploadCloud className={`w-6 h-6 ${uploadingBanner ? 'animate-bounce' : ''}`} />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {uploadingBanner ? 'Uploading directly to Cloudinary...' : 'Click to Upload Banner Image or Drag & Drop'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, WEBP, GIF up to 10MB • Fast delivery via Cloudinary CDN
                  </p>
                </div>

                <button
                  type="button"
                  disabled={uploadingBanner}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploadingBanner ? 'Uploading...' : 'Choose Image File'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={uploadingBanner}
                className="hidden"
              />

              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 group">
                <div className="relative h-48 w-full">
                  <img
                    src={bannerImage}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cover Active
                  </span>
                  <button
                    type="button"
                    onClick={() => setBannerImage('')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-rose-300 hover:bg-rose-500/20 bg-rose-500/10 border border-rose-500/30 backdrop-blur-md transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-[11px] font-mono text-gray-300 truncate max-w-full sm:max-w-[70%] bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    {bannerImage}
                  </p>

                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/30 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{uploadingBanner ? 'Uploading...' : 'Replace Photo'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor & Toolbar Section */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        {/* Editor Toolbar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          {/* Format Buttons */}
          <div className="flex items-center flex-wrap gap-1">
            <button
              type="button"
              onClick={() => insertText('**', '**')}
              title="Bold"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('*', '*')}
              title="Italic"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-300 dark:bg-white/10 mx-1" />
            <button
              type="button"
              onClick={() => insertText('# ')}
              title="Heading 1"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('## ')}
              title="Heading 2"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('### ')}
              title="Heading 3"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <Heading3 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-300 dark:bg-white/10 mx-1" />
            <button
              type="button"
              onClick={() => insertText('> ')}
              title="Quote"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('```typescript\n', '\n```')}
              title="Code Block"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('- ')}
              title="Bullet List"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('1. ')}
              title="Numbered List"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('[Link Title](', ')')}
              title="Insert Link"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
            </button>

            {/* Inline Photo Attachment */}
            <label
              title="Attach inline photo into markdown"
              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-slate-200/70 dark:hover:bg-white/10 cursor-pointer flex items-center gap-1 text-xs font-medium"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleInlineImageUpload}
                disabled={uploadingInline}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() =>
                insertText('\n| Column 1 | Column 2 |\n| -------- | -------- |\n| Item 1   | Item 2   |\n')
              }
              title="Insert Table"
              className="p-1.5 rounded-lg text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-950 p-1 rounded-xl border border-slate-300/70 dark:border-white/10 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'edit'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden md:inline px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'split'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5 inline mr-1" />
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'preview'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              Preview
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/10 min-h-[500px]">
          {/* Write Pane */}
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div className={`p-4 bg-white dark:bg-transparent ${viewMode === 'edit' ? 'col-span-2' : ''}`}>
              <textarea
                ref={textareaRef}
                value={content || ''}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article in rich Markdown format... Use headers, code blocks, lists, blockquotes, and tables."
                rows={22}
                required
                className="w-full h-full p-2 bg-transparent text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 font-mono text-sm focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Live Split Preview Pane */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className={`p-6 overflow-y-auto max-h-[600px] bg-slate-50/70 dark:bg-slate-950/40 ${viewMode === 'preview' ? 'col-span-2' : ''}`}>
              <div className="text-xs uppercase font-mono font-bold tracking-wider text-amber-600 dark:text-amber-400 mb-4 pb-2 border-b border-slate-200 dark:border-white/10">
                Live Markdown Preview
              </div>
              {safeContent.trim() ? (
                <MarkdownViewer content={safeContent} />
              ) : (
                <div className="text-slate-500 dark:text-gray-500 text-sm italic">
                  Live formatted preview will appear here as you type in Markdown...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Word count & Reading Time Bar */}
        <div className="p-3 bg-slate-100/90 dark:bg-slate-900/60 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span><strong>{words}</strong> words</span>
            <span>•</span>
            <span><strong>{safeContent.length}</strong> characters</span>
            <span>•</span>
            <span>~<strong>{readingTime}</strong> min reading time</span>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={saving || !safeTitle.trim() || !safeContent.trim()}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
          >
            {saving ? 'Saving Article...' : isPublished ? 'Publish Article' : 'Save as Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
