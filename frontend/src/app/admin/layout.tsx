'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import {
  ShieldAlert,
  LayoutDashboard,
  FilePlus,
  BookOpen,
  Users,
  ArrowLeft,
  Lock,
  UserCheck,
  PenTool,
  Mail,
  Rocket,
} from 'lucide-react';
import AdminLayoutSkeleton from '../../components/skeletons/AdminLayoutSkeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isContributor, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [pendingContributors, setPendingContributors] = useState(0);
  const [pendingInquiries, setPendingInquiries] = useState(0);
  const [pendingWaitlist, setPendingWaitlist] = useState(0);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Admin Console | Code & Coffee';
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadPendingCounts();

      const socket = getSocket();
      const handleContributorCount = (data: { pendingCount: number }) => {
        if (typeof data?.pendingCount === 'number') {
          setPendingContributors(data.pendingCount);
        }
      };
      const handleInquiryCount = (data: { pendingCount: number }) => {
        if (typeof data?.pendingCount === 'number') {
          setPendingInquiries(data.pendingCount);
        }
      };
      const handleWaitlistCount = (data: { count?: number; waitlistedCount?: number }) => {
        if (typeof data?.waitlistedCount === 'number') {
          setPendingWaitlist(data.waitlistedCount);
        } else if (typeof data?.count === 'number') {
          setPendingWaitlist(data.count);
        }
      };
      const handleNewWaitlist = () => {
        loadPendingCounts();
      };

      if (socket && socket.on) {
        socket.on('admin:contributor_count', handleContributorCount);
        socket.on('admin:inquiry_count', handleInquiryCount);
        socket.on('admin:waitlist_count', handleWaitlistCount);
        socket.on('admin:new_waitlist', handleNewWaitlist);
      }

      return () => {
        if (socket && socket.off) {
          socket.off('admin:contributor_count', handleContributorCount);
          socket.off('admin:inquiry_count', handleInquiryCount);
          socket.off('admin:waitlist_count', handleWaitlistCount);
          socket.off('admin:new_waitlist', handleNewWaitlist);
        }
      };
    }
  }, [isAdmin]);

  const loadPendingCounts = async () => {
    try {
      const [resContributors, resInquiries, resWaitlist] = await Promise.all([
        fetchApi('/contributors/pending-count'),
        fetchApi('/inquiries/pending-count'),
        fetchApi('/waitlist/stats'),
      ]);
      if (resContributors.success && resContributors.data?.pendingCount !== undefined) {
        setPendingContributors(resContributors.data.pendingCount);
      }
      if (resInquiries.success && resInquiries.data?.pendingCount !== undefined) {
        setPendingInquiries(resInquiries.data.pendingCount);
      }
      if (resWaitlist.success && resWaitlist.data?.waitlistedCount !== undefined) {
        setPendingWaitlist(resWaitlist.data.waitlistedCount);
      }
    } catch {
      // non-fatal
    }
  };

  if (isLoading) {
    return <AdminLayoutSkeleton />;
  }

  // Security Guard: Only ADMIN or CONTRIBUTOR can access
  if (!user || (!isAdmin && user.role !== 'CONTRIBUTOR')) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-3xl text-center border border-red-500/30 space-y-4">
        <div className="p-3 w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          The Publishing &amp; Management Console is restricted to verified administrators and contributors. Please sign in with an authorized account or apply to become a contributor.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20"
          >
            Sign in
          </Link>
          <Link
            href="/become-contributor"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl glass-card hover:bg-white/10 text-white font-semibold text-sm border border-white/10"
          >
            Apply to Contribute
          </Link>
        </div>
      </div>
    );
  }

  // Security Check: Contributors have NO control over users, inquiries, or early access waitlists
  const isContributorRestrictedRoute =
    user.role === 'CONTRIBUTOR' &&
    (pathname === '/admin/users' ||
      pathname === '/admin/contributors' ||
      pathname === '/admin' ||
      pathname.startsWith('/admin/inquiries') ||
      pathname.startsWith('/admin/waitlist'));

  if (isContributorRestrictedRoute) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 glass-card rounded-3xl text-center border border-amber-500/30 space-y-4">
        <div className="p-3 w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Administrator Privileges Required</h2>
        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
          As a verified Contributor, your account has full rights to write, edit, and publish technical articles in the Author Studio. However, user governance and platform telemetry remain restricted to administrators.
        </p>
        <div className="pt-2">
          <Link
            href="/admin/blogs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
          >
            <PenTool className="w-4 h-4" /> Go to Author Studio
          </Link>
        </div>
      </div>
    );
  }

  interface MenuItem {
    name: string;
    href: string;
    icon: any;
    badge?: number | null;
  }

  // Define Navigation based on Role
  const adminMenuItems: MenuItem[] = [
    { name: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard },
    {
      name: 'Early Access Waitlist',
      href: '/admin/waitlist',
      icon: Rocket,
      badge: pendingWaitlist > 0 ? pendingWaitlist : null,
    },
    {
      name: 'Contributor Queries',
      href: '/admin/contributors',
      icon: UserCheck,
      badge: pendingContributors > 0 ? pendingContributors : null,
    },
    {
      name: 'Contact Inquiries',
      href: '/admin/inquiries',
      icon: Mail,
      badge: pendingInquiries > 0 ? pendingInquiries : null,
    },
    { name: 'Write New Article', href: '/admin/blogs/new', icon: FilePlus },
    { name: 'Manage Articles', href: '/admin/blogs', icon: BookOpen },
    { name: 'User Governance', href: '/admin/users', icon: Users },
  ];

  const contributorMenuItems: MenuItem[] = [
    { name: 'Write New Article', href: '/admin/blogs/new', icon: FilePlus },
    { name: 'My Articles & Drafts', href: '/admin/blogs', icon: BookOpen },
  ];

  const menuItems = isAdmin ? adminMenuItems : contributorMenuItems;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4">
      {/* Admin / Author Sidebar */}
      <aside className="lg:col-span-3 space-y-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <div
              className={`p-2 rounded-xl border ${
                isAdmin
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <PenTool className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isAdmin ? 'Admin Console' : 'Author Studio'}
              </h2>
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
                      {item.badge}
                    </span>
                  )}
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

      {/* Main Content Area */}
      <section className="lg:col-span-9 space-y-6">
        <React.Suspense fallback={<div className="py-12 text-center text-gray-400 text-xs">Loading panel...</div>}>
          {children}
        </React.Suspense>
      </section>
    </div>
  );
}
