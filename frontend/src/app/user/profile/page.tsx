'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { fetchApi } from '../../../lib/api';
import { optimizeImageUrl } from '../../../lib/image';
import Link from 'next/link';
import ProfileSkeleton from '../../../components/skeletons/ProfileSkeleton';
import { useToast } from '../../../context/ToastContext';
import {
  User,
  Mail,
  Shield,
  ThumbsUp,
  MessageSquare,
  Edit2,
  Save,
  CheckCircle2,
  LogOut,
  ArrowRight,
  Camera,
  UploadCloud,
  Loader2,
  Smartphone,
  Laptop,
  Tablet,
  KeyRound,
  AlertTriangle,
  Trash2,
  ShieldAlert,
  RefreshCw,
  Clock,
  Check,
  X,
  ExternalLink,
  Code2,
  Trophy,
  Flame,
  Globe,
  Link2,
  Compass,
} from 'lucide-react';
import { startProductTour } from '../../../components/ProductTour';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

interface DeviceSession {
  id: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
  isCurrentDevice: boolean;
}

export default function UserProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Coding Profile Links State
  const [githubUrl, setGithubUrl] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [codeforcesUrl, setCodeforcesUrl] = useState('');
  const [codechefUrl, setCodechefUrl] = useState('');

  // Direct Reset Password State
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Device Sessions State
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  // Account Deletion & Recovery State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);

  useEffect(() => {
    loadProfile();
    loadSessions();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const res = await fetchApi('/users/profile');
    if (res.success && res.data) {
      setProfileData(res.data);
      setName(res.data.name || '');
      setBio(res.data.bio || '');
      setAvatar(res.data.avatar || '');
      setGithubUrl(res.data.githubUrl || '');
      setLeetcodeUrl(res.data.leetcodeUrl || '');
      setCodeforcesUrl(res.data.codeforcesUrl || '');
      setCodechefUrl(res.data.codechefUrl || '');
    }
    setLoading(false);
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    const res = await fetchApi('/users/sessions');
    if (res.success && Array.isArray(res.data)) {
      setSessions(res.data);
    }
    setLoadingSessions(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('Image file size must be less than 10MB.');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetchApi('/upload/image', {
      method: 'POST',
      body: formData,
    });

    if (res.success && res.data?.url) {
      setAvatar(res.data.url);
      toast.success('Profile photo uploaded! Click "Save Profile" to finalize.');
      setIsEditing(true);
    } else {
      toast.error(res.message || 'Image upload failed. Please try again.');
    }
    setUploadingImage(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const res = await fetchApi('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name,
        bio,
        avatar,
        githubUrl,
        leetcodeUrl,
        codeforcesUrl,
        codechefUrl,
      }),
    });

    if (res.success) {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      await refreshUser();
      await loadProfile();
    } else {
      toast.error(res.message || 'Failed to update profile.');
    }
    setUpdating(false);
  };

  const handleDirectPasswordReset = async () => {
    setSendingResetEmail(true);
    const res = await fetchApi('/users/request-password-reset-email', {
      method: 'POST',
    });

    if (res.success) {
      setResetEmailSent(true);
      toast.success(`Verification email sent to ${user?.email || 'your email'}! Check your inbox.`);
    } else {
      toast.error(res.message || 'Failed to send password reset email.');
    }
    setSendingResetEmail(false);
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    const res = await fetchApi(`/users/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      toast.success('Device session successfully signed out.');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } else {
      toast.error(res.message || 'Failed to revoke device session.');
    }
    setRevokingSessionId(null);
  };

  const handleRevokeOtherSessions = async () => {
    if (!confirm('Are you sure you want to sign out all other devices?')) return;
    setRevokingOthers(true);
    const res = await fetchApi('/users/sessions/other', {
      method: 'DELETE',
    });

    if (res.success) {
      toast.success(res.message || 'All other devices logged out.');
      await loadSessions();
    } else {
      toast.error(res.message || 'Failed to revoke other devices.');
    }
    setRevokingOthers(false);
  };

  const handleScheduleDeletion = async () => {
    setDeletingAccount(true);
    const res = await fetchApi('/users/request-deletion', {
      method: 'POST',
    });

    if (res.success) {
      toast.warning('Account deletion scheduled. A 15-day recovery grace period is now active.');
      setShowDeleteModal(false);
      await loadProfile();
      await refreshUser();
    } else {
      toast.error(res.message || 'Failed to schedule account deletion.');
    }
    setDeletingAccount(false);
  };

  const handleCancelDeletion = async () => {
    setCancellingDeletion(true);
    const res = await fetchApi('/users/cancel-deletion', {
      method: 'POST',
    });

    if (res.success) {
      toast.success('Account deletion request cancelled! Your account is fully restored.');
      await loadProfile();
      await refreshUser();
    } else {
      toast.error(res.message || 'Failed to cancel deletion.');
    }
    setCancellingDeletion(false);
  };

  const getDeviceIcon = (deviceType: string) => {
    const dt = (deviceType || '').toLowerCase();
    if (dt.includes('mobile') || dt.includes('phone')) {
      return <Smartphone className="w-5 h-5 text-amber-400" />;
    }
    if (dt.includes('tablet') || dt.includes('pad')) {
      return <Tablet className="w-5 h-5 text-cyan-400" />;
    }
    return <Laptop className="w-5 h-5 text-indigo-400" />;
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-card rounded-3xl text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-sm text-gray-400">Please log in to access your personal developer profile.</p>
        <Link
          href="/auth/login"
          className="inline-flex px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const likedPosts = profileData?.likes || [];
  const comments = profileData?.comments || [];
  const isPendingDeletion = Boolean(profileData?.isPendingDeletion);
  const daysRemaining = profileData?.daysRemaining ?? 15;
  const deletionDate = profileData?.deletionScheduledAt
    ? new Date(profileData.deletionScheduledAt).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-fade-in">
      {/* Hidden file input for photo uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* 15-DAY COOL-OFF / ACCOUNT DELETION RECOVERY BANNER */}
      {isPendingDeletion && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-300 dark:border-rose-500/40 bg-gradient-to-r from-rose-50 via-amber-50/50 to-orange-50 dark:from-rose-950/80 dark:via-slate-900/90 dark:to-amber-950/80 p-5 shadow-sm dark:shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-rose-950 dark:text-white tracking-tight">
                    Account Scheduled for Permanent Deletion
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 uppercase tracking-wider">
                    {daysRemaining} Days Left
                  </span>
                </div>
                <p className="text-xs text-rose-900/80 dark:text-rose-200/80 leading-relaxed">
                  A 15-day recovery cool-off period is currently active. Your account and data will be permanently purged on{' '}
                  <strong className="text-rose-950 dark:text-white">{deletionDate}</strong>. You can cancel this request and restore full access at any time.
                </p>
              </div>
            </div>

            <button
              onClick={handleCancelDeletion}
              disabled={cancellingDeletion}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {cancellingDeletion ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Restoring...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Restore My Account</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-sm dark:shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with click-to-upload overlay */}
          <div className="relative group/avatar">
            <img
              src={
                optimizeImageUrl(avatar || user.avatar, { width: 200, height: 200, crop: 'fill' }) ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
              }
              alt={user.name}
              className="w-24 h-24 rounded-full border-4 border-amber-500/30 bg-slate-100 dark:bg-slate-900 object-cover shadow-xl"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 pulse-beacon" />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute inset-0 rounded-full bg-slate-950/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-semibold backdrop-blur-xs cursor-pointer"
              title="Upload new profile picture"
            >
              {uploadingImage ? (
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              ) : (
                <>
                  <Camera className="w-5 h-5 text-amber-400 mb-0.5" />
                  <span>Change</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  {user.name}
                  {user.role === 'ADMIN' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      ADMINISTRATOR
                    </span>
                  )}
                  {isPendingDeletion && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                      DELETION PENDING
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-mono flex items-center justify-center sm:justify-start gap-1 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                {user.role !== 'ADMIN' && user.role !== 'CONTRIBUTOR' && (
                  <button
                    type="button"
                    onClick={startProductTour}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-102"
                    title="Replay Interactive Feature Tour"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-spin-slow" />
                    <span>Platform Tour</span>
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-gray-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-gray-300 max-w-xl leading-relaxed pt-1">
              {bio || 'Passionate developer exploring distributed systems, modern web engineering, and high-performance applications.'}
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {message}
          </div>
        )}

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleUpdate} className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Update Profile Details
            </h3>

            {/* Avatar Upload Dropzone & URL Input */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200">
                  Profile Picture (Avatar)
                </label>
                {uploadingImage && (
                  <span className="text-[11px] text-amber-500 dark:text-amber-400 flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading image...
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Choose Photo from Device</span>
                </button>

                <span className="text-xs text-slate-500 dark:text-gray-400">or image URL:</span>

                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://... or /uploads/..."
                  className="flex-1 w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-400 mb-1">Developer Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={1}
                  placeholder="Tell the community about your technical stack and focus..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Developer & Competitive Programming Profiles Inputs */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-white/10 sm:col-span-2">
                <div className="flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Coding &amp; Platform Handles
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">
                  Required for verified submissions and solving questions on SDE &amp; CP practice sheets.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                      <GithubIcon className="w-3.5 h-3.5 text-slate-600 dark:text-gray-400" />
                      GitHub Profile URL / Username
                    </label>
                    <input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="e.g. https://github.com/username or username"
                      className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      LeetCode Profile URL / Username (SDE Sheet)
                    </label>
                    <input
                      type="text"
                      value={leetcodeUrl}
                      onChange={(e) => setLeetcodeUrl(e.target.value)}
                      placeholder="e.g. https://leetcode.com/u/username or username"
                      className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Codeforces Handle / URL (CP Sheet)
                    </label>
                    <input
                      type="text"
                      value={codeforcesUrl}
                      onChange={(e) => setCodeforcesUrl(e.target.value)}
                      placeholder="e.g. tourist or https://codeforces.com/profile/tourist"
                      className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-orange-800 dark:text-orange-300 mb-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      CodeChef Handle / URL (CP Sheet)
                    </label>
                    <input
                      type="text"
                      value={codechefUrl}
                      onChange={(e) => setCodechefUrl(e.target.value)}
                      placeholder="e.g. chef_pro or https://www.codechef.com/users/chef_pro"
                      className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={updating || uploadingImage}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {updating ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CODING & DEVELOPER PROFILES SHOWCASE CARD */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm dark:shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Coding &amp; Developer Profiles
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Verified competitive programming &amp; GitHub accounts for sheet progress and leaderboards
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-gray-200 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Links</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* GitHub */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-gray-200">
                <GithubIcon className="w-4 h-4 text-slate-900 dark:text-white" />
                <span>GitHub</span>
              </div>
              {githubUrl ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Linked
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/70 dark:bg-white/5 text-slate-600 dark:text-gray-400">
                  Not linked
                </span>
              )}
            </div>
            {githubUrl ? (
              <a
                href={githubUrl.startsWith('http') ? githubUrl : `https://github.com/${githubUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-mono truncate flex items-center gap-1 group font-semibold"
              >
                <span className="truncate">{githubUrl.replace(/^https?:\/\/(www\.)?github\.com\/?/, '@')}</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>
            ) : (
              <p className="text-xs text-slate-500 dark:text-gray-500 italic">Add your GitHub profile URL to showcase open-source projects.</p>
            )}
          </div>

          {/* LeetCode */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <Code2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>LeetCode</span>
              </div>
              {leetcodeUrl ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Linked
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  Required for SDE Sheet
                </span>
              )}
            </div>
            {leetcodeUrl ? (
              <a
                href={leetcodeUrl.startsWith('http') ? leetcodeUrl : `https://leetcode.com/u/${leetcodeUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-mono truncate flex items-center gap-1 group font-semibold"
              >
                <span className="truncate">{leetcodeUrl.replace(/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/, '@')}</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>
            ) : (
              <p className="text-xs text-slate-500 dark:text-gray-500 italic">Required to solve and track questions on the SDE Sheet.</p>
            )}
          </div>

          {/* Codeforces */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-300">
                <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Codeforces</span>
              </div>
              {codeforcesUrl ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Linked
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30">
                  Required for CP Sheet
                </span>
              )}
            </div>
            {codeforcesUrl ? (
              <a
                href={codeforcesUrl.startsWith('http') ? codeforcesUrl : `https://codeforces.com/profile/${codeforcesUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-mono truncate flex items-center gap-1 group font-semibold"
              >
                <span className="truncate">{codeforcesUrl.replace(/^https?:\/\/(www\.)?codeforces\.com\/profile\/?/, '@')}</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>
            ) : (
              <p className="text-xs text-slate-500 dark:text-gray-500 italic">Required to practice on the Competitive Programming Sheet.</p>
            )}
          </div>

          {/* CodeChef */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-800 dark:text-orange-300">
                <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>CodeChef</span>
              </div>
              {codechefUrl ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Linked
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-800 dark:text-orange-300 border border-orange-500/30">
                  Required for CP Sheet
                </span>
              )}
            </div>
            {codechefUrl ? (
              <a
                href={codechefUrl.startsWith('http') ? codechefUrl : `https://www.codechef.com/users/${codechefUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-mono truncate flex items-center gap-1 group font-semibold"
              >
                <span className="truncate">{codechefUrl.replace(/^https?:\/\/(www\.)?codechef\.com\/users\/?/, '@')}</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>
            ) : (
              <p className="text-xs text-slate-500 dark:text-gray-500 italic">Required to practice on the Competitive Programming Sheet.</p>
            )}
          </div>
        </div>
      </div>

      {/* SECURITY & PASSWORD RESET SECTION */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Password &amp; Security</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">Manage your credentials and direct email recovery options</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Direct Email Password Reset</h4>
            <p className="text-xs text-slate-600 dark:text-gray-400 max-w-lg">
              Send a 6-digit one-time verification code and direct reset link directly to your verified email address{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-bold">({user.email})</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {resetEmailSent ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" /> Code Dispatched!
                </span>
                <Link
                  href={`/auth/forgot-password?email=${encodeURIComponent(user.email)}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-sm"
                >
                  <span>Enter Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <button
                onClick={handleDirectPasswordReset}
                disabled={sendingResetEmail}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs transition-colors cursor-pointer"
              >
                {sendingResetEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Send Reset Email</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE DEVICES & MULTI-DEVICE LOGIN TRACKING */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm dark:shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Active Devices &amp; Sessions
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  {sessions.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Track all browsers and devices currently logged into your account. New device logins automatically trigger a security alert email.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSessions}
              disabled={loadingSessions}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 transition-colors text-xs"
              title="Refresh device list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? 'animate-spin text-amber-500' : ''}`} />
            </button>
            {sessions.length > 1 && (
              <button
                onClick={handleRevokeOtherSessions}
                disabled={revokingOthers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {revokingOthers ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>Log Out Other Devices</span>
              </button>
            )}
          </div>
        </div>

        {loadingSessions && sessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>Scanning active device sessions...</span>
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-gray-400 py-4">No active device sessions detected.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  sess.isCurrentDevice
                    ? 'bg-emerald-50/70 dark:bg-slate-900/80 border-emerald-500/40 dark:border-emerald-500/30 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-gray-300 shrink-0">
                    {getDeviceIcon(sess.deviceType)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {sess.browser} on {sess.os}
                      </h4>
                      {sess.isCurrentDevice && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          This Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center gap-3">
                      <span>IP: <strong className="text-slate-700 dark:text-gray-300 font-mono">{sess.ipAddress}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-gray-500" />
                        Last active {new Date(sess.lastActive).toLocaleDateString()} {new Date(sess.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>
                </div>

                {!sess.isCurrentDevice && (
                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    disabled={revokingSessionId === sess.id}
                    className="self-end sm:self-center flex items-center gap-1 px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
                    title="Sign out this device"
                  >
                    {revokingSessionId === sess.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liked Articles Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm dark:shadow-xl">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          My Liked Publications ({likedPosts.length})
        </h2>

        {likedPosts.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-gray-400 py-4">You have not liked any articles yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {likedPosts.map((likeItem: any) => {
              const p = likeItem.post;
              return (
                <Link
                  key={likeItem.id}
                  href={`/blogs/${p.slug}`}
                  className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div className="pr-3">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold">
                      {p.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                      {p.title}
                    </h4>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 dark:text-gray-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Comments Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm dark:shadow-xl">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          My Discussion Comments ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-gray-400 py-4">No comments posted yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comm: any) => (
              <div key={comm.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-xs space-y-1">
                <Link
                  href={`/blogs/${comm.post?.slug}`}
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline line-clamp-1"
                >
                  On: {comm.post?.title}
                </Link>
                <p className="text-slate-700 dark:text-gray-300">{comm.content}</p>
                <span className="text-[10px] text-slate-500 dark:text-gray-500">
                  {new Date(comm.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DANGER ZONE / 15-DAY ACCOUNT DELETION */}
      <div className="glass-card p-6 rounded-3xl border border-rose-300 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/10 space-y-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Danger Zone</h2>
            <p className="text-xs text-slate-500 dark:text-gray-400">Irreversible account actions and recovery policies</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-rose-200 dark:border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300">
              {isPendingDeletion ? 'Account Scheduled for Permanent Deletion' : 'Delete Account (15-Day Cool-off Period)'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-gray-400 max-w-lg leading-relaxed">
              {isPendingDeletion ? (
                <>
                  Your account is in its 15-day grace period until <strong className="text-slate-900 dark:text-white">{deletionDate}</strong>. You can cancel this request at any time to recover all account data.
                </>
              ) : (
                <>
                  Request account deletion with our production security policy: a <strong className="text-slate-900 dark:text-white">15-day grace period</strong> protects your data from accidental erasure, allowing you to recover your account anytime within 15 days simply by signing in.
                </>
              )}
            </p>
          </div>

          <div className="shrink-0">
            {isPendingDeletion ? (
              <button
                onClick={handleCancelDeletion}
                disabled={cancellingDeletion}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-colors cursor-pointer"
              >
                {cancellingDeletion ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cancel Deletion</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-400 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR 15-DAY ACCOUNT DELETION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-300 dark:border-rose-500/30 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Account Deletion</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              <p>
                Are you sure you want to delete your Code &amp; Coffee account? We follow a strict production recovery model:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/5 space-y-2">
                <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span><strong>15-Day Cool-off Grace Period:</strong> Your account will not be erased immediately. It will be scheduled for permanent deletion 15 days from today.</span>
                </div>
                <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span><strong>Full Recovery Rights:</strong> If you change your mind, simply log back into Code &amp; Coffee anytime during these 15 days and click <em>"Restore My Account"</em>.</span>
                </div>
                <div className="flex items-start gap-2 text-cyan-700 dark:text-cyan-300">
                  <Mail className="w-4 h-4 shrink-0 mt-0.5 text-cyan-600 dark:text-cyan-400" />
                  <span><strong>Email Confirmation:</strong> We will dispatch an email with the scheduled deletion date and a 1-click restoration link.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 font-semibold text-xs border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleDeletion}
                disabled={deletingAccount}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Schedule 15-Day Deletion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
