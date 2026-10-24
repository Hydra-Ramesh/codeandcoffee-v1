'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Users,
  Flame,
  ThumbsUp,
  MessageSquare,
  ArrowUpRight,
  PlusCircle,
  Shield,
  Eye,
  UserCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import AdminDashboardSkeleton from '../../components/skeletons/AdminDashboardSkeleton';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [pendingApps, setPendingApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadContributorApps();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const res = await fetchApi('/analytics/dashboard');
    if (res.success && res.data) {
      setStats(res.data);
    }
    setLoading(false);
  };

  const loadContributorApps = async () => {
    try {
      const res = await fetchApi('/contributors/applications?status=PENDING');
      if (res.success && res.data) {
        setPendingApps(res.data);
      }
    } catch {
      // non-fatal
    }
  };

  const handleQuickApprove = async (appId: string) => {
    try {
      const res = await fetchApi(`/contributors/applications/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.success) {
        loadContributorApps();
        loadStats();
      }
    } catch {
      // non-fatal
    }
  };

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  const blogs = stats?.blogs || {};
  const users = stats?.users || {};
  const engagement = stats?.engagement || {};
  const topBlogs = stats?.topBlogs || [];
  const recentUsers = stats?.recentUsers || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Administrator Command Center</h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time telemetry, publication status, and platform user security controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/contributors"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card hover:bg-white/10 text-white font-semibold text-xs border border-white/10"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Contributor Queries</span>
            {pendingApps.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                {pendingApps.length}
              </span>
            )}
          </Link>
          <Link
            href="/admin/blogs/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Write Article
          </Link>
        </div>
      </div>

      {/* Contributor Applications Notification Card */}
      {pendingApps.length > 0 && (
        <div className="p-6 rounded-2xl glass-card border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Pending Contributor Queries &amp; Applications</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    {pendingApps.length} NEW
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Registered users waiting for editorial review to become technical contributors.
                </p>
              </div>
            </div>
            <Link
              href="/admin/contributors"
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingApps.slice(0, 2).map((app) => (
              <div key={app.id} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{app.user?.name || app.email}</span>
                    <span className="text-gray-400 font-normal font-mono text-[11px]">({app.email})</span>
                  </div>
                  {app.resumeUrl && (
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline font-mono text-[11px]"
                    >
                      Resume &rarr;
                    </a>
                  )}
                </div>
                <p className="text-gray-300 italic line-clamp-2">&ldquo;{app.reason}&rdquo;</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleQuickApprove(app.id)}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Approve as Contributor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Blogs */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase">Total Articles</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{blogs.total || 0}</div>
          <div className="text-[11px] text-gray-400">
            <strong className="text-emerald-400">{blogs.published || 0}</strong> published • {blogs.drafts || 0} drafts
          </div>
        </div>

        {/* Live Active Readers */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase">Live Active Readers</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {engagement.activeReadersNow || 0}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-beacon" />
            Telemetry updated live via Redis
          </div>
        </div>

        {/* Registered Users */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase">Registered Users</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{users.total || 0}</div>
          <div className="text-[11px] text-gray-400">
            <strong className="text-purple-400">{users.admins || 0}</strong> admins • {users.banned || 0} suspended
          </div>
        </div>

        {/* Total Likes */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase">Reader Reactions</span>
            <ThumbsUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{engagement.totalLikes || 0}</div>
          <div className="text-[11px] text-gray-400">
            {engagement.totalComments || 0} discussion comments
          </div>
        </div>
      </div>

      {/* Top Performing Blogs Table */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Most Viewed Publications
          </h2>
          <Link href="/admin/blogs" className="text-xs text-amber-400 hover:underline">
            Manage all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase font-semibold">
                <th className="pb-3">Title</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Views</th>
                <th className="pb-3">Reactions</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topBlogs.map((b: any) => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-medium text-white max-w-xs truncate pr-4">
                    {b.title}
                  </td>
                  <td className="py-3 text-gray-300">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">
                      {b.category}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-gray-200">{b.views}</td>
                  <td className="py-3 text-gray-300">
                    👍 {b._count?.likes || 0} • 💬 {b._count?.comments || 0}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/blogs/${b.slug}`}
                      target="_blank"
                      className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-semibold"
                    >
                      View <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Users Overview */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Recent Registered Users
          </h2>
          <Link href="/admin/users" className="text-xs text-amber-400 hover:underline">
            User Governance Center &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase font-semibold">
                <th className="pb-3">Developer Name</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-medium text-white">{u.name}</td>
                  <td className="py-3 text-gray-400 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-gray-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isBanned
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {u.isBanned ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
