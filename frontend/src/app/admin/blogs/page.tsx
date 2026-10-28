'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import AdminTableSkeleton from '../../../components/skeletons/AdminTableSkeleton';
import { useToast } from '../../../context/ToastContext';
import WarningCardModal, { WarningDetail } from '../../../components/WarningCardModal';

export default function AdminBlogManagementPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    const res = await fetchApi('/blogs?includeDrafts=true&limit=50');
    if (res.success && res.data?.blogs) {
      setBlogs(res.data.blogs);
    }
    setLoading(false);
  };

  const { success, error: toastError } = useToast();

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionVerb: string;
    badgeText?: string;
    variant: 'danger' | 'warning' | 'success';
    details: WarningDetail[];
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionVerb: '',
    variant: 'danger',
    details: [],
    onConfirm: async () => {},
  });
  const [modalLoading, setModalLoading] = useState(false);

  const promptDeleteBlog = (id: string, title: string, category: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Permanently Delete Article',
      badgeText: 'IRREVERSIBLE ACTION',
      variant: 'danger',
      actionVerb: 'Delete Article',
      description: `Are you sure you want to permanently delete "${title}"? This publication will be removed from all discovery feeds, search indexes, and readers' bookmark lists.`,
      details: [
        { label: 'Article Title', value: title },
        { label: 'Category', value: category },
        { label: 'Impact', value: 'Purged from PostgreSQL & Redis buffer' },
      ],
      onConfirm: async () => {
        setModalLoading(true);
        const res = await fetchApi(`/blogs/${id}`, { method: 'DELETE' });
        if (res.success) {
          setBlogs((prev) => prev.filter((b) => b.id !== id));
          success(`Article "${title}" deleted successfully.`);
        } else {
          toastError(res.message || 'Failed to delete article.');
        }
        setModalLoading(false);
        setModalConfig((m) => ({ ...m, isOpen: false }));
      },
    });
  };

  const handleTogglePublish = async (blog: any) => {
    const nextState = !blog.isPublished;
    const res = await fetchApi(`/blogs/${blog.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isPublished: nextState }),
    });

    if (res.success) {
      setBlogs(blogs.map((b) => (b.id === blog.id ? { ...b, isPublished: nextState } : b)));
      success(nextState ? `Published "${blog.title}" to public feed.` : `Saved "${blog.title}" as draft.`);
    } else {
      toastError(res.message || 'Failed to update publication status.');
    }
  };

  const filtered = blogs.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Articles &amp; Publications Management</h1>
          <p className="text-xs text-gray-400 mt-1">
            Create, edit, toggle visibility, and monitor engagement for all engineering posts.
          </p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          Write New Article
        </Link>
      </div>

      {/* Filter bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, category..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-gray-500"
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <AdminTableSkeleton columns={6} rows={6} />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">No articles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-white/10 text-gray-400 font-semibold uppercase">
                <tr>
                  <th className="p-4">Article</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Engagement</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((blog) => (
                  <tr key={blog.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-white truncate">{blog.title}</div>
                      <div className="text-[11px] text-gray-400 truncate">{blog.excerpt}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {blog.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePublish(blog)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          blog.isPublished
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}
                      >
                        {blog.isPublished ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Published
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-gray-400" /> {blog.views}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-amber-400" /> {blog.likesCount || 0}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-cyan-400" /> {blog.commentsCount || 0}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(blog)}
                        className={`p-1.5 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[11px] font-semibold border transition-all cursor-pointer ${
                          blog.isPublished
                            ? 'text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
                            : 'text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30'
                        }`}
                        title={blog.isPublished ? 'Unpublish Article (Move to Drafts)' : 'Publish Article to Live Feed'}
                      >
                        {blog.isPublished ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Unpublish</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Publish</span>
                          </>
                        )}
                      </button>
                      <Link
                        href={`/blogs/${blog.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 inline-block align-middle"
                        title="View Live Article"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/blogs/${blog.id}/edit`}
                        className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-white/10 inline-block align-middle"
                        title="Edit Article"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => promptDeleteBlog(blog.id, blog.title, blog.category)}
                        className="p-2 min-h-[36px] min-w-[36px] rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 inline-flex items-center justify-center transition-all border border-transparent hover:border-red-500/20 active:scale-95 cursor-pointer align-middle"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warning Card Modal for Article Deletion */}
      <WarningCardModal
        isOpen={modalConfig.isOpen}
        onClose={() => !modalLoading && setModalConfig((m) => ({ ...m, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        actionVerb={modalConfig.actionVerb}
        badgeText={modalConfig.badgeText}
        variant={modalConfig.variant}
        details={modalConfig.details}
        confirmLoading={modalLoading}
      />
    </div>
  );
}
