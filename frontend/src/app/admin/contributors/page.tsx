'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { optimizeImageUrl } from '../../../lib/image';
import { useDebounce } from '../../../hooks/useDebounce';
import ContributorAppSkeleton from '../../../components/skeletons/ContributorAppSkeleton';
import { useToast } from '../../../context/ToastContext';
import WarningCardModal, { WarningDetail } from '../../../components/WarningCardModal';

interface ContributorApplication {
  id: string;
  userId: string;
  email: string;
  reason: string;
  resumeUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    createdAt: string;
  };
}

export default function AdminContributorApplicationsPage() {
  const [applications, setApplications] = useState<ContributorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadApplications();

    const socket = getSocket();
    const handleRealtimeRefresh = () => {
      loadApplications();
    };

    if (socket && socket.on) {
      socket.on('admin:new_application', handleRealtimeRefresh);
      socket.on('admin:contributor_count', handleRealtimeRefresh);
    }

    return () => {
      if (socket && socket.off) {
        socket.off('admin:new_application', handleRealtimeRefresh);
        socket.off('admin:contributor_count', handleRealtimeRefresh);
      }
    };
  }, [filter]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const query = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await fetchApi(`/contributors/applications${query}`);
      if (res.success && res.data) {
        setApplications(res.data);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
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
    variant: 'warning',
    details: [],
    onConfirm: async () => {},
  });
  const [modalLoading, setModalLoading] = useState(false);

  const promptUpdateStatus = (app: ContributorApplication, newStatus: 'APPROVED' | 'REJECTED') => {
    const isApproving = newStatus === 'APPROVED';

    setModalConfig({
      isOpen: true,
      title: isApproving ? 'Grant Technical Contributor Access' : 'Decline Contributor Query',
      badgeText: isApproving ? 'EDITORIAL PRIVILEGE GRANT' : 'EDITORIAL REVIEW',
      variant: isApproving ? 'success' : 'danger',
      actionVerb: isApproving ? 'Approve as Contributor' : 'Decline Application',
      description: isApproving
        ? `Approving ${app.user.name} will immediately upgrade their account to Contributor, unlock the Author Studio, and dispatch an automated onboarding notification to ${app.email}.`
        : `Declining this application will mark the query as rejected. A notification email will be dispatched to ${app.email}.`,
      details: [
        { label: 'Applicant', value: app.user.name },
        { label: 'Email', value: app.email },
        { label: 'Current Role', value: app.user.role },
        { label: 'New Role', value: isApproving ? 'CONTRIBUTOR' : 'USER' },
      ],
      onConfirm: async () => {
        setModalLoading(true);
        setProcessingId(app.id);

        try {
          const res = await fetchApi(`/contributors/applications/${app.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
          });

          if (res.success) {
            success(
              isApproving
                ? `Promoted ${app.user.name} to Contributor! Notification email queued for ${app.email}.`
                : `Application from ${app.user.name} marked as declined.`
            );
            loadApplications();
          } else {
            toastError(res.message || 'Failed to update application status.');
          }
        } catch (err: any) {
          toastError(err.message || 'An error occurred while updating status.');
        } finally {
          setProcessingId(null);
          setModalLoading(false);
          setModalConfig((m) => ({ ...m, isOpen: false }));
        }
      },
    });
  };

  const filtered = applications.filter((app) => {
    const term = debouncedSearch.toLowerCase();
    return (
      app.user.name.toLowerCase().includes(term) ||
      app.email.toLowerCase().includes(term) ||
      app.reason.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-amber-400" />
            Contributor Queries &amp; Applications
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review applicant motivation, inspect resumes, and elevate verified readers into official Contributors.
          </p>
        </div>

        <button
          onClick={loadApplications}
          className="px-3.5 py-2 rounded-xl glass-card hover:bg-white/10 text-xs font-semibold text-gray-300 flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicants by name, email, topic..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-gray-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'glass-card text-gray-300 hover:text-white'
              }`}
            >
              {tab === 'PENDING' ? 'Pending Review' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <ContributorAppSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl p-8 space-y-2">
          <UserCheck className="w-10 h-10 text-gray-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">No applications found</h3>
          <p className="text-xs text-gray-400">
            {filter === 'PENDING'
              ? 'All pending contributor queries have been reviewed.'
              : 'No applications match the current filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const isProcessing = processingId === app.id;

            return (
              <div
                key={app.id}
                className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 hover:border-white/20 transition-all shadow-lg"
              >
                {/* Top Row: User Meta + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        optimizeImageUrl(app.user.avatar, { width: 100, height: 100, crop: 'fill' }) ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(app.user.name)}`
                      }
                      alt={app.user.name}
                      className="w-10 h-10 rounded-full border border-white/10 bg-slate-800"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{app.user.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.user.role === 'ADMIN'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : app.user.role === 'CONTRIBUTOR'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-gray-400'
                          }`}
                        >
                          CURRENT ROLE: {app.user.role}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-amber-400" />
                        {app.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : app.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {app.status}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Submitted {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Reason / Pitch Box */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                  <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Applicant Statement &amp; Motivation Query:
                  </span>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-line">{app.reason}</p>
                </div>

                {/* Footer: Resume link + Action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
                  <div>
                    {app.resumeUrl ? (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-colors border border-white/10"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inspect Resume / CV</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500 italic">No resume attached</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {app.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => promptUpdateStatus(app, 'APPROVED')}
                          className="px-4 py-2 min-h-[40px] rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve as Contributor</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => promptUpdateStatus(app, 'REJECTED')}
                          className="px-3.5 py-2 min-h-[40px] rounded-xl glass-card hover:bg-red-500/10 text-red-400 font-semibold text-xs border border-white/10 transition-colors flex items-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {app.status === 'APPROVED' && app.user.role !== 'ADMIN' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => promptUpdateStatus(app, 'REJECTED')}
                        className="px-3 py-2 min-h-[36px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors active:scale-95 cursor-pointer"
                      >
                        Revoke Contributor Access
                      </button>
                    )}

                    {app.status === 'REJECTED' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => promptUpdateStatus(app, 'APPROVED')}
                        className="px-3.5 py-2 min-h-[36px] rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Re-Approve as Contributor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warning Card Modal for Contributor Reviews */}
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
