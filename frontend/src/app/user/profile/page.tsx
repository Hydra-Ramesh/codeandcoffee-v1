'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { fetchApi } from '../../../lib/api';
import Link from 'next/link';
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
} from 'lucide-react';

export default function UserProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const res = await fetchApi('/users/profile');
    if (res.success && res.data) {
      setProfileData(res.data);
      setName(res.data.name || '');
      setBio(res.data.bio || '');
      setAvatar(res.data.avatar || '');
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const res = await fetchApi('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, bio, avatar }),
    });

    if (res.success) {
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      await refreshUser();
      await loadProfile();
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.message || 'Failed to update profile.');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-gray-400 text-sm animate-pulse">
        Loading user profile...
      </div>
    );
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

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Profile Header Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <img
              src={
                avatar ||
                user.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
              }
              alt={user.name}
              className="w-24 h-24 rounded-full border-4 border-amber-500/30 bg-slate-900 object-cover"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 pulse-beacon" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  {user.name}
                  {user.role === 'ADMIN' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ADMINISTRATOR
                    </span>
                  )}
                </h1>
                <p className="text-xs text-gray-400 font-mono flex items-center justify-center sm:justify-start gap-1 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-card hover:bg-white/10 text-xs font-semibold text-gray-200 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-300 max-w-xl leading-relaxed pt-1">
              {bio || 'Passionate developer exploring distributed systems, modern web engineering, and high-performance applications.'}
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {message}
          </div>
        )}

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleUpdate} className="mt-6 pt-6 border-t border-white/10 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Update Profile Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Developer Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {updating ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Liked Articles Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-amber-400" />
          My Liked Publications ({likedPosts.length})
        </h2>

        {likedPosts.length === 0 ? (
          <p className="text-xs text-gray-400 py-4">You have not liked any articles yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {likedPosts.map((likeItem: any) => {
              const p = likeItem.post;
              return (
                <Link
                  key={likeItem.id}
                  href={`/blogs/${p.slug}`}
                  className="glass-card p-4 rounded-xl border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group"
                >
                  <div className="pr-3">
                    <span className="text-[10px] text-amber-400 uppercase font-semibold">
                      {p.category}
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {p.title}
                    </h4>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Comments Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          My Discussion Comments ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p className="text-xs text-gray-400 py-4">No comments posted yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comm: any) => (
              <div key={comm.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs space-y-1">
                <Link
                  href={`/blogs/${comm.post?.slug}`}
                  className="font-semibold text-amber-400 hover:underline line-clamp-1"
                >
                  On: {comm.post?.title}
                </Link>
                <p className="text-gray-300">{comm.content}</p>
                <span className="text-[10px] text-gray-500">
                  {new Date(comm.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
