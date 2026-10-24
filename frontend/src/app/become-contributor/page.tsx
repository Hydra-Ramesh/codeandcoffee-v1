'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../lib/api';
import ContributorFormSkeleton from '../../components/skeletons/ContributorFormSkeleton';
import {
  Sparkles,
  Coffee,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  LogIn,
  UserPlus,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ApplicationData {
  id: string;
  email: string;
  reason: string;
  resumeUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function BecomeContributorPage() {
  const { user, isContributor, isLoading, token, refreshUser } = useAuth();

  const [reason, setReason] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [existingApp, setExistingApp] = useState<ApplicationData | null>(null);
  const [loadingApp, setLoadingApp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      loadApplication();
    }
  }, [user, token]);

  const loadApplication = async () => {
    setLoadingApp(true);
    try {
      const res = await fetchApi('/contributors/my-application');
      if (res.success && res.data) {
        setExistingApp(res.data);
        setReason(res.data.reason || '');
        if (res.data.resumeUrl) {
          setResumeUrl(res.data.resumeUrl);
          setResumeName('Attached Resume / CV');
        }
      }
    } catch {
      // Ignore if no application
    } finally {
      setLoadingApp(false);
    }
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadingResume(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${apiUrl}/upload/resume`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.data?.url) {
        setResumeUrl(data.data.url);
        setResumeName(file.name);
      } else {
        setUploadError(data.message || 'Failed to upload resume document.');
      }
    } catch (err) {
      setUploadError('Failed to upload document. Please ensure your file is under 15MB.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (reason.trim().length < 10) {
      setFormError('Please write at least a few sentences explaining why you want to become a contributor.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/contributors/apply', {
        method: 'POST',
        body: JSON.stringify({
          reason: reason.trim(),
          resumeUrl: resumeUrl || undefined,
        }),
      });

      if (res.success) {
        setSubmitSuccess(true);
        setExistingApp(res.data);
      } else {
        setFormError(res.message || 'Failed to submit application.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loadingApp) {
    return <ContributorFormSkeleton />;
  }

  // State 1: Not logged in (Registration Prompt)
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Become a Contributor at <span className="gradient-text-amber">Code &amp; Coffee</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Publish in-depth system architecture studies, distributed computing notes, and modern web guides to thousands of developers.
          </p>
        </div>

        {/* Register First Warning Card */}
        <div className="glass-card p-8 sm:p-10 rounded-3xl border border-amber-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Authentication Required</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Please Register or Sign In First</h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
              To submit a contributor query, write your motivation pitch, and upload your resume, you must be a registered member of our community.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10 pt-2">
            <Link
              href="/auth/register"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create Account First
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-3 rounded-xl glass-card hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-colors flex items-center gap-2"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              Sign In to Existing Account
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="text-white font-bold text-sm">Dedicated Author Studio</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Access rich Markdown authoring with syntax highlighting, live active reader telemetry, and instant publishing.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="text-white font-bold text-sm">Automated Broadcasts</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              When your article is published, our worker queues automatically broadcast notifications to all registered platform users.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="text-white font-bold text-sm">Author Attribution</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Gain verified author status, your personal bio card on every article, and recognition in the developer ecosystem.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Already a Contributor or Admin
  if (isContributor) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="p-4 w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            You Are an Active Contributor!
          </h1>
          <p className="text-gray-300 text-sm max-w-md mx-auto leading-relaxed">
            Your account ({user.email}) has full publishing and authoring privileges in the Code &amp; Coffee Author Studio.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/admin/blogs/new"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Write New Article
          </Link>
          <Link
            href="/admin/blogs"
            className="px-6 py-3 rounded-xl glass-card hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-colors"
          >
            Manage My Articles
          </Link>
        </div>
      </div>
    );
  }

  // State 3: Logged in, Pending Review
  if (existingApp && existingApp.status === 'PENDING' && !submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        <div className="glass-card p-8 sm:p-10 rounded-3xl border border-amber-500/30 space-y-6 shadow-2xl text-center">
          <div className="p-4 w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
              Status: Under Review
            </span>
            <h1 className="text-2xl font-extrabold text-white">Application Received!</h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
              Thank you, <strong className="text-white">{user.name}</strong>. Your application to become a publisher/contributor has been submitted to the administration team.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-left text-xs space-y-2">
            <div className="text-gray-400">
              <strong className="text-gray-300">Registered Email:</strong> {user.email}
            </div>
            <div className="text-gray-400">
              <strong className="text-gray-300">Your Query / Pitch:</strong>
              <p className="text-gray-300 mt-1 italic">&ldquo;{existingApp.reason}&rdquo;</p>
            </div>
            {existingApp.resumeUrl && (
              <div className="text-gray-400 pt-1">
                <strong className="text-gray-300">Resume Attached:</strong>{' '}
                <a
                  href={existingApp.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline font-mono"
                >
                  View Document &rarr;
                </a>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Once an administrator reviews your application, your role will be upgraded to <strong>Contributor</strong> and an email notification will be dispatched to <strong>{user.email}</strong>.
          </p>

          <button
            type="button"
            onClick={() => setExistingApp(null)}
            className="text-xs text-amber-400 hover:underline pt-2 inline-block"
          >
            Update or re-submit application &rarr;
          </button>
        </div>
      </div>
    );
  }

  // State 4: Form to Apply
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Contributor &amp; Publisher Application
        </h1>
        <p className="text-gray-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          Tell us about your background and technical passion. Our administration team will review your query and grant you publishing access.
        </p>
      </div>

      {submitSuccess ? (
        <div className="glass-card p-8 rounded-3xl border border-emerald-500/30 text-center space-y-4 text-emerald-300">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Application Dispatched!</h2>
          <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
            Your contributor pitch and resume have been queued for administrative review. You will receive an email at <strong className="text-white">{user.email}</strong> once your publishing access is activated.
          </p>
          <div className="pt-2">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              Explore Blogs in the Meantime &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Registered Email (Pre-filled) */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Applicant Email Address
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-gray-400 bg-white/5 cursor-not-allowed font-mono"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Pre-filled from your registered Code &amp; Coffee account.
              </span>
            </div>

            {/* Motivation Comment Box */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>Why do you want to become a contributor? *</span>
                <span className="text-[11px] text-gray-400 font-normal">Min. 10 characters</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                required
                placeholder="Share your engineering background, topics you want to publish (e.g. System Design, Next.js, Cloud Security, Database Internals), previous writing links or open-source projects..."
                className="w-full px-4 py-3 text-xs rounded-xl glass-input text-white resize-none"
              />
            </div>

            {/* Resume / CV Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">
                Upload Resume / CV (PDF, DOC, DOCX)
              </label>

              <div className="p-5 rounded-2xl border-2 border-dashed border-white/15 hover:border-amber-500/40 transition-colors bg-white/5 text-center space-y-3">
                {uploadingResume ? (
                  <div className="py-4 space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-amber-300">Uploading and securing document...</p>
                  </div>
                ) : resumeUrl ? (
                  <div className="py-2 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      <Check className="w-4 h-4" />
                      <span>{resumeName || 'Resume Document Uploaded'}</span>
                    </div>
                    <div>
                      <label className="text-[11px] text-amber-400 hover:underline cursor-pointer">
                        Replace document
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-7 h-7 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-300">
                      Upload your technical resume or CV for the review board
                    </p>
                    <label className="inline-block px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs cursor-pointer border border-white/10 transition-colors">
                      Select PDF or DOCX File
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-gray-500">Max file size: 15MB</p>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {uploadError}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || uploadingResume}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Application to Admin...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Contributor Application</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
