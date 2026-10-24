'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { fetchApi } from '../../../../lib/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../../../../context/ToastContext';

const MarkdownEditor = dynamic(() => import('../../../../components/MarkdownEditor'), {
  ssr: false,
  loading: () => (
    <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-4 animate-pulse my-4">
      <div className="h-10 bg-slate-800 rounded-xl w-3/4" />
      <div className="h-64 bg-slate-800/60 rounded-2xl w-full" />
    </div>
  ),
});

export default function NewBlogPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState(`## Introduction

In this architectural deep dive, we explore how distributed architectures achieve sub-millisecond latencies...

\`\`\`typescript
// Code snippet demonstration
const cacheKey = "pipeline:stream:events";
await redis.setex(cacheKey, 60, JSON.stringify({ status: "processed" }));
\`\`\`

### Architectural Principles
- **Fault-Tolerance**: Decouple hot state from disk.
- **Observability**: Live active reader heartbeats and metrics.
`);
  const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80');
  const [category, setCategory] = useState('System Design');
  const [tags, setTags] = useState('Architecture, Redis, Performance, Scale');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !excerpt.trim()) {
      toast.warning('Please fill out the title, excerpt, and markdown content.');
      return;
    }

    setSaving(true);
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);

    const res = await fetchApi('/blogs', {
      method: 'POST',
      body: JSON.stringify({
        title,
        excerpt,
        content,
        bannerImage,
        category,
        tags: tagArray,
        isPublished,
      }),
    });

    if (res.success && res.data) {
      toast.success('Article published successfully!');
      setTimeout(() => {
        router.push(`/blogs/${res.data.slug}`);
      }, 700);
    } else {
      toast.error(res.message || 'Failed to save blog post.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blogs"
            className="p-2 rounded-xl glass-card hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create New Publication</h1>
            <p className="text-xs text-slate-600 dark:text-gray-400">Write in rich Markdown with live split preview</p>
          </div>
        </div>

        {notification && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {notification}
          </div>
        )}
      </div>

      <MarkdownEditor
        title={title}
        setTitle={setTitle}
        excerpt={excerpt}
        setExcerpt={setExcerpt}
        content={content}
        setContent={setContent}
        bannerImage={bannerImage}
        setBannerImage={setBannerImage}
        category={category}
        setCategory={setCategory}
        tags={tags}
        setTags={setTags}
        isPublished={isPublished}
        setIsPublished={setIsPublished}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
