'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  LayoutDashboard,
  FilePlus,
  BookOpen,
  Users,
  MessageSquare,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="py-20 text-center text-gray-400 text-sm animate-pulse">
        Verifying administrator credentials...
      </div>
    );
  }

  // Security Guard: Only ADMIN can access
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-3xl text-center border border-red-500/30 space-y-4">
        <div className="p-3 w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          The Administrator Control Panel is restricted to authorized personnel only. Please sign in with an administrator account.
        </p>
        <div className="pt-2">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20"
          >
            Sign in as Administrator
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Write New Article', href: '/admin/blogs/new', icon: FilePlus },
    { name: 'Manage Articles', href: '/admin/blogs', icon: BookOpen },
    { name: 'User Governance', href: '/admin/users', icon: Users },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4">
      {/* Admin Sidebar */}
      <aside className="lg:col-span-3 space-y-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Admin Console</h2>
              <p className="text-[11px] text-gray-400 font-mono">ROLE: {user.role}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Back to Site Link */}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card hover:bg-white/10 text-xs font-medium text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Reader Journal
        </Link>
      </aside>

      {/* Main Admin Content Area */}
      <section className="lg:col-span-9 space-y-6">
        <React.Suspense fallback={<div className="py-12 text-center text-gray-400 text-xs">Loading panel...</div>}>
          {children}
        </React.Suspense>
      </section>
    </div>
  );
}
