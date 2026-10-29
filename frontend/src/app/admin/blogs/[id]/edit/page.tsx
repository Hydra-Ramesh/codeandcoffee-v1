'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { fetchApi } from '../../../../../lib/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import EditorSkeleton from '../../../../../components/skeletons/EditorSkeleton';
import { useToast } from '../../../../../context/ToastContext';

const MarkdownEditor = dynamic(() => import('../../../../../components/MarkdownEditor'), {
  ssr: false,
  loading: () => (
    <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-4 animate-pulse my-4">
      <div className="h-10 bg-slate-800 rounded-xl w-3/4" />
      <div className="h-64 bg-slate-800/60 rounded-2xl w-full" />
    </div>
  ),
});

export default function EditBlogPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [category, setCategory] = useState('System Design');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadBlog();
    }
  }, [id]);

  const loadBlog = async () => {
    setLoading(true);

    try {
      let blogData: any = null;

      // 1. First attempt direct fetch by ID (returns complete blog content)
      const directRes = await fetchApi(`/blogs/${id}`);
      if (directRes.success && directRes.data?.blog) {
        blogData = directRes.data.blog;
      } else {
        // 2. Fallback: Search in blogs list, then fetch full post by slug if content was stripped
        const listRes = await fetchApi('/blogs?includeDrafts=true&limit=100');
        if (listRes.success && listRes.data?.blogs) {
          const match = listRes.data.blogs.find((b: any) => b.id === id);
          if (match) {
            if (match.content) {
              blogData = match;
            } else if (match.slug) {
              const slugRes = await fetchApi(`/blogs/${match.slug}`);
              if (slugRes.success && slugRes.data?.blog) {
                blogData = slugRes.data.blog;
              } else {
                blogData = match;
              }
            } else {
              blogData = match;
            }
          }
        }
      }

      if (blogData) {
        setTitle(blogData.title || '');
        setExcerpt(blogData.excerpt || '');
        setContent(blogData.content || '');
        setBannerImage(blogData.bannerImage || '');
        setCategory(blogData.category || 'System Design');
        setTags(Array.isArray(blogData.tags) ? blogData.tags.join(', ') : '');
        setIsPublished(Boolean(blogData.isPublished));
      } else {
        toast.error('Blog post could not be loaded.');
      }
    } catch {
      toast.error('An error occurred while loading this article.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const safeTitle = (title || '').trim();
    const safeContent = (content || '').trim();

    if (!safeTitle || !safeContent) {
      toast.warning('Title and content are required to save an article.');
      return;
    }

    setSaving(true);
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);

    const res = await fetchApi(`/blogs/${id}`, {
      method: 'PUT',
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

    if (res.success) {
      toast.success('Article updated successfully!');
      setTimeout(() => {
        router.push('/admin/blogs');
      }, 700);
    } else {
      toast.error(res.message || 'Failed to update article.');
    }
    setSaving(false);
  };

  if (loading) {
    return <EditorSkeleton />;
  }

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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Edit Article</h1>
            <p className="text-xs text-slate-600 dark:text-gray-400">Modify content, banner image, or publication visibility</p>
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
