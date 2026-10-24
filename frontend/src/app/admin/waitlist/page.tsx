'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Mail,
  Copy,
  Trash2,
  Download,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
  Layers,
  BrainCircuit,
  Cpu,
  Cloud,
  Code2,
  Trophy,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { useToast } from '../../../context/ToastContext';

interface WaitlistEntry {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  track: string;
  notes?: string | null;
  status: 'WAITLISTED' | 'INVITED' | 'ONBOARDED';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    createdAt?: string;
  } | null;
}

export default function AdminWaitlistPage() {
  const { toast } = useToast();

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<any>({
    totalAll: 0,
    waitlisted: 0,
    invited: 0,
    onboarded: 0,
    tracks: [],
  });

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  useEffect(() => {
    loadWaitlistData();

    // Real-time socket listener for live waitlist registrations
    const socket = getSocket();
    const handleNewWaitlist = (data: { entry: WaitlistEntry }) => {
      if (data?.entry) {
        toast.success(`🚀 New VIP Waitlist: ${data.entry.name} (${data.entry.email}) requested ${data.entry.track}`);
        loadWaitlistData();
      }
    };

    if (socket && socket.on) {
      socket.on('admin:new_waitlist', handleNewWaitlist);
    }

    return () => {
      if (socket && socket.off) {
        socket.off('admin:new_waitlist', handleNewWaitlist);
      }
    };
  }, [page, selectedTrack, selectedStatus]);

  const loadWaitlistData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('limit', '25');

      if (selectedStatus !== 'ALL') {
        queryParams.set('status', selectedStatus);
      }
      if (selectedTrack !== 'ALL') {
        queryParams.set('track', selectedTrack);
      }
      if (search.trim()) {
        queryParams.set('search', search.trim());
      }

      const res = await fetchApi(`/waitlist/admin?${queryParams.toString()}`);
      if (res.success && res.data) {
        setWaitlist(res.data.waitlist || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || 0);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not fetch waitlist records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadWaitlistData();
  };

  const handleStatusUpdate = async (id: string, newStatus: 'WAITLISTED' | 'INVITED' | 'ONBOARDED') => {
    try {
      setUpdatingId(id);
      const res = await fetchApi(`/waitlist/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.success) {
        toast.success(`Status updated to ${newStatus}.`);
        setWaitlist((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        // Refresh counts
        loadWaitlistData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the early access waitlist?`)) {
      return;
    }

    try {
      const res = await fetchApi(`/waitlist/${id}`, {
        method: 'DELETE',
      });

      if (res.success) {
        toast.info(`${name} has been removed from the waitlist.`);
        loadWaitlistData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not remove entry.');
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.info(`${email} copied to clipboard.`);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleExportCSV = () => {
    if (waitlist.length === 0) {
      toast.warning('No waitlist records found in current view to export.');
      return;
    }

    const headers = ['Name', 'Email', 'Track', 'Status', 'Notes', 'RegisteredAt'];
    const rows = waitlist.map((w) => [
      `"${w.name.replace(/"/g, '""')}"`,
      `"${w.email.replace(/"/g, '""')}"`,
      `"${w.track.replace(/"/g, '""')}"`,
      `"${w.status}"`,
      `"${(w.notes || '').replace(/"/g, '""')}"`,
      `"${new Date(w.createdAt).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `codeandcoffee_waitlist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Downloaded waitlist CSV for bulk communication.');
  };

  const trackPills = [
    { label: 'All Tracks', value: 'ALL' },
    { label: 'AI & LLMs', value: 'AI' },
    { label: 'DSA Mastery', value: 'DSA' },
    { label: 'System Design', value: 'System Design' },
    { label: 'DevOps & SRE', value: 'DevOps' },
    { label: 'Coding / Fullstack', value: 'Coding' },
    { label: 'Competitive Programming', value: 'Competitive' },
  ];

  const getTrackBadgeClass = (track: string) => {
    if (track.includes('AI')) return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    if (track.includes('DSA')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (track.includes('System')) return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    if (track.includes('DevOps')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (track.includes('Competitive')) return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Rocket className="w-6 h-6 text-amber-400" />
              <span>Early Access Waiting List</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {stats.totalAll || 0} TOTAL
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Engineers and students who requested early notification for the upcoming &ldquo;What&apos;s Coming&rdquo; Job-Ready platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl glass-card hover:bg-white/10 text-white font-semibold text-xs border border-white/10 flex items-center gap-2 shadow-sm transition-all"
            title="Download CSV for newsletter or beta invite imports"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={loadWaitlistData}
            disabled={loading}
            className="p-2 rounded-xl glass-card hover:bg-white/10 text-gray-300 hover:text-white border border-white/10"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
            Total Signups
          </div>
          <div className="text-2xl font-extrabold text-white">
            {stats.totalAll || 0}
          </div>
          <div className="text-[10px] text-gray-400">All registered builders</div>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-amber-500/20 bg-amber-500/5 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
            Pending Waitlist
          </div>
          <div className="text-2xl font-extrabold text-amber-300">
            {stats.waitlisted || 0}
          </div>
          <div className="text-[10px] text-amber-400/80">Awaiting beta invite</div>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-cyan-500/20 bg-cyan-500/5 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
            Invited Cohort
          </div>
          <div className="text-2xl font-extrabold text-cyan-300">
            {stats.invited || 0}
          </div>
          <div className="text-[10px] text-cyan-400/80">Credentials dispatched</div>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-emerald-500/20 bg-emerald-500/5 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
            Onboarded
          </div>
          <div className="text-2xl font-extrabold text-emerald-300">
            {stats.onboarded || 0}
          </div>
          <div className="text-[10px] text-emerald-400/80">Active beta testers</div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Real-time search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or user notes..."
              className="w-full pl-9 pr-24 py-2 rounded-xl glass-input text-xs text-white placeholder-gray-500 border border-white/10"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px]"
            >
              Search
            </button>
          </form>

          {/* Status filter dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl glass-input text-xs text-white bg-slate-900 border border-white/10"
          >
            <option value="ALL">All Statuses</option>
            <option value="WAITLISTED">Waitlisted (Pending)</option>
            <option value="INVITED">Invited</option>
            <option value="ONBOARDED">Onboarded</option>
          </select>
        </div>

        {/* Track filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" /> Filter Track:
          </span>
          {trackPills.map((pill) => (
            <button
              key={pill.value}
              onClick={() => {
                setSelectedTrack(pill.value);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedTrack === pill.value
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'glass-card hover:bg-white/10 text-gray-300 border border-white/5'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* WAITLIST TABLE / CARDS */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
            <p className="text-xs text-gray-400">Loading waitlist entries...</p>
          </div>
        ) : waitlist.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-gray-400 mx-auto flex items-center justify-center">
              <Rocket className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No waitlist entries found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {search || selectedTrack !== 'ALL' || selectedStatus !== 'ALL'
                ? 'No developers match your current search and filter criteria.'
                : 'Nobody has requested early access yet. Submissions from /whats-coming will appear here automatically.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase text-[10px] font-mono">
                  <th className="py-3 px-4">Developer</th>
                  <th className="py-3 px-4">Requested Track</th>
                  <th className="py-3 px-4">Notes / Background</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {waitlist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                    {/* Developer Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                          {entry.name?.charAt(0).toUpperCase() || 'D'}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{entry.name}</span>
                            {entry.user?.role === 'ADMIN' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 font-mono text-[11px]">
                            <span>{entry.email}</span>
                            <button
                              onClick={() => handleCopyEmail(entry.email)}
                              className="text-gray-500 hover:text-amber-400 transition-colors"
                              title="Copy email address"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Track */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getTrackBadgeClass(entry.track)}`}>
                        {entry.track}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {entry.notes ? (
                        <p className="text-gray-300 italic text-[11px] line-clamp-2" title={entry.notes}>
                          &ldquo;{entry.notes}&rdquo;
                        </p>
                      ) : (
                        <span className="text-gray-500 italic text-[11px]">None provided</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={entry.status}
                        disabled={updatingId === entry.id}
                        onChange={(e) => handleStatusUpdate(entry.id, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border bg-slate-900 cursor-pointer ${
                          entry.status === 'WAITLISTED'
                            ? 'text-amber-300 border-amber-500/40 bg-amber-950/20'
                            : entry.status === 'INVITED'
                            ? 'text-cyan-300 border-cyan-500/40 bg-cyan-950/20'
                            : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/20'
                        }`}
                      >
                        <option value="WAITLISTED">Waitlisted</option>
                        <option value="INVITED">Invited</option>
                        <option value="ONBOARDED">Onboarded</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`mailto:${entry.email}?subject=☕ You're Invited: Code %26 Coffee Early Access Beta (${encodeURIComponent(entry.track)})&body=Hi ${encodeURIComponent(entry.name)},%0D%0A%0D%0AWe are thrilled to let you know that early access cohort slots for "${encodeURIComponent(entry.track)}" are opening up!`}
                          className="p-1.5 rounded-lg glass-card hover:bg-amber-500 hover:text-slate-950 text-gray-300 transition-colors"
                          title="Compose Invite Email"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDelete(entry.id, entry.name)}
                          className="p-1.5 rounded-lg glass-card hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors"
                          title="Remove entry"
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
        )}

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <div>
              Showing page <strong className="text-white">{page}</strong> of{' '}
              <strong className="text-white">{totalPages}</strong> ({totalCount} total)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg glass-card hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg glass-card hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
