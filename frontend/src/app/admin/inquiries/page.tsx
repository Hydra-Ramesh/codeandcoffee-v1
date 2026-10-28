'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  Clock,
  Search,
  Trash2,
  RefreshCw,
  Send,
  User,
  Calendar,
  X,
  MessageSquare,
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { useDebounce } from '../../../hooks/useDebounce';
import { useToast } from '../../../context/ToastContext';
import WarningCardModal from '../../../components/WarningCardModal';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'RESOLVED';
  adminReply: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('PENDING');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [pendingCount, setPendingCount] = useState(0);

  // Selected inquiry for review & resolve modal
  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Delete modal state
  const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error: toastError } = useToast();

  useEffect(() => {
    loadInquiries();

    const socket = getSocket();
    const handleNewInquiry = () => {
      loadInquiries();
    };
    const handleInquiryCount = (data: { pendingCount: number }) => {
      if (typeof data?.pendingCount === 'number') {
        setPendingCount(data.pendingCount);
      }
    };

    if (socket && socket.on) {
      socket.on('admin:new_inquiry', handleNewInquiry);
      socket.on('admin:inquiry_count', handleInquiryCount);
    }

    return () => {
      if (socket && socket.off) {
        socket.off('admin:new_inquiry', handleNewInquiry);
        socket.off('admin:inquiry_count', handleInquiryCount);
      }
    };
  }, [filter, debouncedSearch]);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.append('status', filter);
      }
      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await fetchApi(`/inquiries${query}`);
      if (res.success && res.data) {
        setInquiries(res.data.inquiries || []);
        if (typeof res.data.pendingCount === 'number') {
          setPendingCount(res.data.pendingCount);
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch inquiries.');
    } finally {
      setLoading(false);
    }
  };

  const openInquiryModal = (inquiry: Inquiry) => {
    setActiveInquiry(inquiry);
    setAdminReplyText(inquiry.adminReply || '');
    setReplyError(null);
  };

  const closeInquiryModal = () => {
    if (isResolving) return;
    setActiveInquiry(null);
    setAdminReplyText('');
    setReplyError(null);
  };

  const handleResolve = async () => {
    if (!activeInquiry) return;
    const trimmedReply = adminReplyText.trim();
    if (trimmedReply.length < 5) {
      setReplyError('Please write a resolution message (at least 5 characters).');
      return;
    }

    setIsResolving(true);
    setReplyError(null);
    try {
      const res = await fetchApi(`/inquiries/${activeInquiry.id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ adminReply: trimmedReply }),
      });

      if (res.success) {
        success(
          `Inquiry from ${activeInquiry.name} resolved! Branded response email was transmitted to ${activeInquiry.email}.`
        );
        closeInquiryModal();
        loadInquiries();
      } else {
        setReplyError(res.message || 'Failed to resolve inquiry.');
      }
    } catch (err: any) {
      setReplyError(err.message || 'An error occurred while resolving this inquiry.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleDelete = async () => {
    if (!inquiryToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetchApi(`/inquiries/${inquiryToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        success(`Inquiry "${inquiryToDelete.subject}" deleted.`);
        setInquiryToDelete(null);
        if (activeInquiry?.id === inquiryToDelete.id) {
          closeInquiryModal();
        }
        loadInquiries();
      } else {
        toastError(res.message || 'Failed to delete inquiry.');
      }
    } catch (err: any) {
      toastError(err.message || 'An error occurred while deleting inquiry.');
    } finally {
      setIsDeleting(false);
    }
  };

  const applyTemplate = (type: 'resolved' | 'clarified' | 'general') => {
    if (!activeInquiry) return;
    const name = activeInquiry.name;
    const subject = activeInquiry.subject;

    if (type === 'resolved') {
      setAdminReplyText(
        `Hi ${name},\n\nThank you for contacting Code & Coffee. We investigated your inquiry regarding "${subject}" and the matter has been addressed and resolved.\n\nPlease let us know if you need anything else.\n\nWarm regards,\nCode & Coffee Support Team`
      );
    } else if (type === 'clarified') {
      setAdminReplyText(
        `Hi ${name},\n\nThank you for reaching out regarding "${subject}". We reviewed the details provided and have updated everything accordingly.\n\nBest regards,\nCode & Coffee Editorial Team`
      );
    } else {
      setAdminReplyText(
        `Hi ${name},\n\nThank you for connecting with Code & Coffee. Regarding your message about "${subject}":\n\n[Please enter your custom response notes here]\n\nBest regards,\nCode & Coffee Support Team`
      );
    }
    setReplyError(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Contact Inquiries &amp; Support</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 animate-pulse">
                {pendingCount} PENDING
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Review public inquiries submitted through the contact portal. When you resolve an inquiry, your response body is automatically emailed to the user.
          </p>
        </div>

        <button
          onClick={loadInquiries}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass-card hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-50"
          title="Refresh Inquiries"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 self-start">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              filter === 'PENDING'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
            {pendingCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  filter === 'PENDING' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'RESOLVED'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-white/20 text-white font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>All Queries</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, subject..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Inquiries Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
              <div className="h-3 w-72 bg-slate-200/70 dark:bg-slate-800/60 rounded" />
              <div className="h-12 w-full bg-slate-200/50 dark:bg-slate-800/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-3 max-w-lg mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
            {filter === 'PENDING' ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Mail className="w-6 h-6" />}
          </div>
          <h3 className="text-base font-bold text-white">
            {filter === 'PENDING'
              ? 'All Caught Up!'
              : filter === 'RESOLVED'
              ? 'No Resolved Inquiries Yet'
              : 'No Inquiries Found'}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {filter === 'PENDING'
              ? 'There are no pending inquiries requiring administrator resolution right now.'
              : debouncedSearch
              ? `No inquiries matched your search term "${debouncedSearch}".`
              : 'When visitors submit the Send an Inquiry form on the contact page, their messages will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => {
            const isPending = inquiry.status === 'PENDING';
            return (
              <div
                key={inquiry.id}
                className={`glass-card p-5 rounded-2xl border transition-all hover:border-white/20 space-y-3 ${
                  isPending
                    ? 'border-amber-500/30 bg-amber-500/[0.02]'
                    : 'border-white/10 bg-black/20'
                }`}
              >
                {/* Header row: Sender + Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {inquiry.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{inquiry.name}</span>
                        <a
                          href={`mailto:${inquiry.email}`}
                          className="text-xs text-gray-400 hover:text-amber-400 font-mono transition-colors"
                        >
                          &lt;{inquiry.email}&gt;
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(inquiry.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3" /> Pending Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject Line */}
                <div className="pt-1">
                  <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-1.5">
                    <span className="text-amber-400 font-mono text-xs">RE:</span>
                    <span>{inquiry.subject}</span>
                  </h4>
                </div>

                {/* Message Excerpt */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-300 whitespace-pre-line leading-relaxed font-sans">
                  &ldquo;{inquiry.message}&rdquo;
                </div>

                {/* If resolved: preview admin response */}
                {!isPending && inquiry.adminReply && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin Response Emailed to User</span>
                      {inquiry.resolvedAt && (
                        <span className="text-gray-500 font-normal">
                          • {new Date(inquiry.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 italic whitespace-pre-line line-clamp-2">
                      {inquiry.adminReply}
                    </p>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[11px] text-gray-500 font-mono">ID: {inquiry.id.slice(0, 8)}...</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInquiryToDelete(inquiry)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Inquiry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => openInquiryModal(inquiry)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow ${
                        isPending
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                          : 'glass-card hover:bg-white/10 text-white border border-white/10'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Resolve &amp; Reply</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>View Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve / Details Modal */}
      {activeInquiry && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/15 max-w-2xl w-full space-y-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      activeInquiry.status === 'PENDING'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {activeInquiry.status === 'PENDING' ? 'Pending Resolution' : 'Resolved & Sent'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(activeInquiry.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{activeInquiry.subject}</h3>
                <div className="text-xs text-gray-300">
                  From: <strong className="text-white">{activeInquiry.name}</strong> &lt;
                  <a href={`mailto:${activeInquiry.email}`} className="text-amber-400 hover:underline">
                    {activeInquiry.email}
                  </a>
                  &gt;
                </div>
              </div>

              <button
                onClick={closeInquiryModal}
                disabled={isResolving}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="space-y-5 overflow-y-auto pr-1">
              {/* Original User Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>User Technical Inquiry / Message</span>
                </label>
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-xs text-gray-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                  {activeInquiry.message}
                </div>
              </div>

              {/* Admin Reply Section */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {activeInquiry.status === 'PENDING'
                        ? 'Write Administrator Response Body'
                        : 'Delivered Response Body'}
                    </span>
                  </label>
                  {activeInquiry.status === 'PENDING' && (
                    <span className="text-[11px] text-gray-400">
                      Dispatched automatically upon clicking Resolve
                    </span>
                  )}
                </div>

                {activeInquiry.status === 'PENDING' ? (
                  <>
                    {/* Quick Template Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Templates:
                      </span>
                      <button
                        type="button"
                        onClick={() => applyTemplate('resolved')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-300 hover:text-white transition-colors"
                      >
                        Issue Resolved
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('clarified')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-300 hover:text-white transition-colors"
                      >
                        Editorial Update
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('general')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-300 hover:text-white transition-colors"
                      >
                        Custom Note
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      value={adminReplyText}
                      onChange={(e) => {
                        setAdminReplyText(e.target.value);
                        setReplyError(null);
                      }}
                      placeholder={`Dear ${activeInquiry.name},\n\nThank you for reaching out to Code & Coffee. Regarding your inquiry...`}
                      className="w-full p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors resize-y leading-relaxed"
                    />

                    {replyError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{replyError}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-gray-200 whitespace-pre-line leading-relaxed">
                    {activeInquiry.adminReply || 'No reply recorded.'}
                    {activeInquiry.resolvedAt && (
                      <div className="mt-3 pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Delivered to {activeInquiry.email} on {new Date(activeInquiry.resolvedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={closeInquiryModal}
                disabled={isResolving}
                className="px-4 py-2 rounded-xl glass-card hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              >
                Close
              </button>

              {activeInquiry.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={isResolving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isResolving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting Email &amp; Resolving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resolve &amp; Send Email</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {inquiryToDelete && (
        <WarningCardModal
          isOpen={true}
          onClose={() => setInquiryToDelete(null)}
          onConfirm={handleDelete}
          confirmLoading={isDeleting}
          title="Delete Contact Inquiry?"
          badgeText="PERMANENT ACTION"
          variant="danger"
          actionVerb="Delete Inquiry"
          description={`Are you sure you want to delete the inquiry from ${inquiryToDelete.name} (${inquiryToDelete.email})? This action cannot be undone.`}
          details={[
            { label: 'Sender', value: inquiryToDelete.name },
            { label: 'Email', value: inquiryToDelete.email },
            { label: 'Subject', value: inquiryToDelete.subject },
            { label: 'Status', value: inquiryToDelete.status },
          ]}
        />
      )}
    </div>
  );
}
