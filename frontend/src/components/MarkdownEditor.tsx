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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = content.substring(start, end) || 'text';
    const replacement = `${before}${selection}${after}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selection.length);
    }, 0);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetchApi('/upload/image', {
      method: 'POST',
      body: formData,
    });

    if (res.success && res.data?.url) {
      setBannerImage(res.data.url);
      toast.success('Hero banner uploaded successfully!');
    } else {
      toast.error(res.message || 'Image upload failed.');
    }
    setUploadingBanner(false);
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInline(true);
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetchApi('/upload/image', {
      method: 'POST',
      body: formData,
    });

    if (res.success && res.data?.url) {
      insertText(`\n![${file.name.replace(/\.[^/.]+$/, '')}](${res.data.url})\n`);
      toast.success('Inline figure uploaded and inserted into article!');
    } else {
      toast.error(res.message || 'Inline image upload failed.');
    }
    setUploadingInline(false);
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
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
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Banner Photo (Cover Image)
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="text"
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              placeholder="https://images.unsplash.com/... or upload image"
              className="flex-1 w-full px-4 py-2.5 text-sm rounded-xl glass-input text-white placeholder-gray-500"
            />
            <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-card hover:bg-white/10 text-amber-400 cursor-pointer border border-amber-500/30 text-sm font-semibold transition-all">
              <UploadCloud className="w-4 h-4" />
              <span>{uploadingBanner ? 'Uploading...' : 'Upload Cover'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={uploadingBanner}
                className="hidden"
              />
            </label>
          </div>

          {bannerImage && (
            <div className="mt-3 relative h-40 w-full max-w-lg rounded-xl overflow-hidden border border-white/10 bg-slate-900">
              <img src={bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-gray-300">
                Cover Photo Preview
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor & Toolbar Section */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        {/* Editor Toolbar */}
        <div className="p-3 bg-slate-900/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          {/* Format Buttons */}
          <div className="flex items-center flex-wrap gap-1">
            <button
              type="button"
              onClick={() => insertText('**', '**')}
              title="Bold"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('*', '*')}
              title="Italic"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              type="button"
              onClick={() => insertText('# ')}
              title="Heading 1"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('## ')}
              title="Heading 2"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('### ')}
              title="Heading 3"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Heading3 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              type="button"
              onClick={() => insertText('> ')}
              title="Quote"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('```typescript\n', '\n```')}
              title="Code Block"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('- ')}
              title="Bullet List"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('1. ')}
              title="Numbered List"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('[Link Title](', ')')}
              title="Insert Link"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <LinkIcon className="w-4 h-4" />
            </button>

            {/* Inline Photo Attachment */}
            <label
              title="Attach inline photo into markdown"
              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-white/10 cursor-pointer flex items-center gap-1 text-xs"
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
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'edit' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden md:inline px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'split' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5 inline mr-1" />
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'preview' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              Preview
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 min-h-[500px]">
          {/* Write Pane */}
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div className={`p-4 ${viewMode === 'edit' ? 'col-span-2' : ''}`}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article in rich Markdown format... Use headers, code blocks, lists, blockquotes, and tables."
                rows={22}
                required
                className="w-full h-full p-2 bg-transparent text-gray-100 placeholder-gray-500 font-mono text-sm focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Live Split Preview Pane */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className={`p-6 overflow-y-auto max-h-[600px] bg-slate-950/40 ${viewMode === 'preview' ? 'col-span-2' : ''}`}>
              <div className="text-xs uppercase font-mono tracking-wider text-amber-400 mb-4 pb-2 border-b border-white/10">
                Live Markdown Preview
              </div>
              {content.trim() ? (
                <MarkdownViewer content={content} />
              ) : (
                <div className="text-gray-500 text-sm italic">
                  Live formatted preview will appear here as you type in Markdown...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Word count & Reading Time Bar */}
        <div className="p-3 bg-slate-900/60 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span><strong>{words}</strong> words</span>
            <span>•</span>
            <span><strong>{content.length}</strong> characters</span>
            <span>•</span>
            <span>~<strong>{readingTime}</strong> min reading time</span>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
          >
            {saving ? 'Saving Article...' : isPublished ? 'Publish Article' : 'Save as Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
