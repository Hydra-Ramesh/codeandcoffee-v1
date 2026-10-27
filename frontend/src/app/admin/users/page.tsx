'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Trash2,
  UserX,
  UserCheck,
  ExternalLink,
  Code2,
  Trophy,
  Flame,
  Edit3,
  Plus,
  X,
  Save,
  Loader2,
  Filter,
} from 'lucide-react';

function GithubIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function extractHandle(url: string | null | undefined, type: 'gh' | 'lc' | 'cf' | 'cc'): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed.startsWith('http')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (type === 'lc' && parts[0] === 'u') return parts[1] || parts[0];
    if (type === 'cf' && parts[0] === 'profile') return parts[1] || parts[0];
    if (type === 'cc' && parts[0] === 'users') return parts[1] || parts[0];
    return parts[parts.length - 1] || trimmed;
  } catch {
    return trimmed;
  }
}

function normalizeUrl(handleOrUrl: string, type: 'gh' | 'lc' | 'cf' | 'cc'): string {
  const trimmed = handleOrUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (type === 'gh') return `https://github.com/${trimmed}`;
  if (type === 'lc') return `https://leetcode.com/u/${trimmed}`;
  if (type === 'cf') return `https://codeforces.com/profile/${trimmed}`;
  if (type === 'cc') return `https://www.codechef.com/users/${trimmed}`;
  return trimmed;
}
import { fetchApi } from '../../../lib/api';
import { optimizeImageUrl } from '../../../lib/image';
import { useDebounce } from '../../../hooks/useDebounce';
import AdminTableSkeleton from '../../../components/skeletons/AdminTableSkeleton';
import { useToast } from '../../../context/ToastContext';
import WarningCardModal, { WarningDetail } from '../../../components/WarningCardModal';
import Pagination from '../../../components/Pagination';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

export default function AdminUserGovernancePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [profileFilter, setProfileFilter] = useState<'ALL' | 'LINKED' | 'UNLINKED'>('ALL');
  const [message, setMessage] = useState<string | null>(null);

  // Pagination State for Users Table
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  // Coding Profiles Inspector & Editor Modal State
  const [profileModal, setProfileModal] = useState<{
    isOpen: boolean;
    user: any | null;
    githubUrl: string;
    leetcodeUrl: string;
    codeforcesUrl: string;
    codechefUrl: string;
    saving: boolean;
  }>({
    isOpen: false,
    user: null,
    githubUrl: '',
    leetcodeUrl: '',
    codeforcesUrl: '',
    codechefUrl: '',
    saving: false,
  });

  const openProfileModal = (user: any) => {
    setProfileModal({
      isOpen: true,
      user,
      githubUrl: user.githubUrl || '',
      leetcodeUrl: user.leetcodeUrl || '',
      codeforcesUrl: user.codeforcesUrl || '',
      codechefUrl: user.codechefUrl || '',
      saving: false,
    });
  };

  const profileTrapRef = useFocusTrap<HTMLDivElement>({
    isOpen: profileModal.isOpen,
    onClose: () => setProfileModal((m) => ({ ...m, isOpen: false })),
  });

  useEffect(() => {
    loadUsers();
  }, [statusFilter, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    let query = '?limit=100';
    if (statusFilter) query += `&status=${statusFilter}`;
    if (roleFilter) query += `&role=${roleFilter}`;

    const res = await fetchApi(`/users${query}`);
    if (res.success && res.data?.users) {
      setUsers(res.data.users);
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
    variant: 'warning',
    details: [],
    onConfirm: async () => {},
  });
  const [modalLoading, setModalLoading] = useState(false);

  const promptToggleBan = (targetUser: any) => {
    const isSuspending = !targetUser.isBanned;

    setModalConfig({
      isOpen: true,
      title: isSuspending ? 'Suspend Developer Account' : 'Reactivate Developer Account',
      badgeText: isSuspending ? 'ACCOUNT SUSPENSION' : 'ACCESS RESTORATION',
      variant: isSuspending ? 'danger' : 'success',
      actionVerb: isSuspending ? 'Suspend Account' : 'Reactivate Account',
      description: isSuspending
        ? `Suspending ${targetUser.name} (${targetUser.email}) will immediately terminate their active session, block further authentication, and prevent commenting.`
        : `Reactivating ${targetUser.name} will restore their login credentials and re-enable active participation in discussions and reading.`,
      details: [
        { label: 'Developer', value: targetUser.name },
        { label: 'Email', value: targetUser.email },
        { label: 'Current Status', value: targetUser.isBanned ? 'Suspended' : 'Active' },
        { label: 'New Status', value: isSuspending ? 'Suspended' : 'Active' },
      ],
      onConfirm: async () => {
        setModalLoading(true);
        const res = await fetchApi(`/users/${targetUser.id}/ban`, { method: 'PATCH' });
        if (res.success && res.data) {
          setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, isBanned: res.data.isBanned } : u)));
          success(res.message || `Account status updated for ${targetUser.name}.`);
        } else {
          toastError(res.message || 'Operation failed.');
        }
        setModalLoading(false);
        setModalConfig((m) => ({ ...m, isOpen: false }));
      },
    });
  };

  const promptToggleRole = (targetUser: any, specificRole?: string) => {
    const newRole = specificRole || (targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN');
    if (newRole === targetUser.role) return;

    const isElevating = newRole === 'ADMIN';
    const isContributor = newRole === 'CONTRIBUTOR';

    setModalConfig({
      isOpen: true,
      title: isElevating ? 'Elevate to Platform Administrator' : `Change Role to ${newRole}`,
      badgeText: isElevating ? 'PRIVILEGE ESCALATION' : 'ROLE MODIFICATION',
      variant: 'warning',
      actionVerb: `Grant ${newRole} Role`,
      description: isElevating
        ? `Granting ${targetUser.name} Administrator privileges provides full access to database governance, user suspensions, and publication deletion.`
        : isContributor
        ? `Granting Contributor access will allow ${targetUser.name} to write, edit, and publish technical articles directly to the publication.`
        : `Demoting ${targetUser.name} to Standard User will revoke their technical authoring and platform administration rights.`,
      details: [
        { label: 'Developer', value: targetUser.name },
        { label: 'Email', value: targetUser.email },
        { label: 'Current Permission', value: targetUser.role },
        { label: 'Target Permission', value: newRole },
      ],
      onConfirm: async () => {
        setModalLoading(true);
        const res = await fetchApi(`/users/${targetUser.id}/role`, {
          method: 'PATCH',
          body: JSON.stringify({ role: newRole }),
        });
        if (res.success && res.data) {
          setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
          success(`Role for ${targetUser.name} updated to ${newRole}.`);
        } else {
          toastError(res.message || 'Failed to update user role.');
        }
        setModalLoading(false);
        setModalConfig((m) => ({ ...m, isOpen: false }));
      },
    });
  };

  const promptDeleteUser = (targetUser: any) => {
    setModalConfig({
      isOpen: true,
      title: 'Permanently Delete User Account',
      badgeText: 'IRREVERSIBLE ACTION',
      variant: 'danger',
      actionVerb: 'Delete Permanently',
      description: `Are you sure you want to completely erase ${targetUser.name} (${targetUser.email})? This will purge their profile, delete all their comments, and remove all database records. This cannot be undone.`,
      details: [
        { label: 'Developer', value: targetUser.name },
        { label: 'Email', value: targetUser.email },
        { label: 'Registered Role', value: targetUser.role },
      ],
      onConfirm: async () => {
        setModalLoading(true);
        const res = await fetchApi(`/users/${targetUser.id}`, { method: 'DELETE' });
        if (res.success) {
          setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
          success(`User ${targetUser.email} was permanently deleted.`);
        } else {
          toastError(res.message || 'Failed to delete user.');
        }
        setModalLoading(false);
        setModalConfig((m) => ({ ...m, isOpen: false }));
      },
    });
  };

  const handleSaveProfiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileModal.user) return;
    setProfileModal((prev) => ({ ...prev, saving: true }));
    try {
      const res = await fetchApi(`/users/${profileModal.user.id}/profiles`, {
        method: 'PATCH',
        body: JSON.stringify({
          githubUrl: profileModal.githubUrl,
          leetcodeUrl: profileModal.leetcodeUrl,
          codeforcesUrl: profileModal.codeforcesUrl,
          codechefUrl: profileModal.codechefUrl,
        }),
      });
      if (res.success && res.data) {
        success(res.message || 'Coding profiles updated successfully.');
        setUsers((prev) =>
          prev.map((u) =>
            u.id === profileModal.user.id
              ? {
                  ...u,
                  githubUrl: profileModal.githubUrl.trim() || null,
                  leetcodeUrl: profileModal.leetcodeUrl.trim() || null,
                  codeforcesUrl: profileModal.codeforcesUrl.trim() || null,
                  codechefUrl: profileModal.codechefUrl.trim() || null,
                }
              : u
          )
        );
        setProfileModal((prev) => ({ ...prev, isOpen: false }));
      } else {
        toastError(res.message || 'Failed to update profiles.');
      }
    } catch (err: any) {
      toastError(err?.message || 'Error updating profiles.');
    } finally {
      setProfileModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = debouncedSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.leetcodeUrl && u.leetcodeUrl.toLowerCase().includes(query)) ||
      (u.githubUrl && u.githubUrl.toLowerCase().includes(query)) ||
      (u.codeforcesUrl && u.codeforcesUrl.toLowerCase().includes(query)) ||
      (u.codechefUrl && u.codechefUrl.toLowerCase().includes(query));

    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && !u.isBanned) ||
      (statusFilter === 'banned' && u.isBanned);
    const matchesRole = !roleFilter || u.role === roleFilter;

    const hasProfiles = Boolean(u.leetcodeUrl || u.codeforcesUrl || u.codechefUrl || u.githubUrl);
    const matchesProfile =
      profileFilter === 'ALL' ||
      (profileFilter === 'LINKED' && hasProfiles) ||
      (profileFilter === 'UNLINKED' && !hasProfiles);

    return matchesSearch && matchesStatus && matchesRole && matchesProfile;
  });

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setUserPage(1);
  }, [debouncedSearch, statusFilter, roleFilter, profileFilter]);

  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize);
  const paginatedUsers = React.useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            User Governance &amp; Security Controls
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Maintain platform trust and security: inspect coding profiles, manage roles, and review authentication telemetry.
          </p>
        </div>

        {message && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {message}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or handle (@leetcode, @github)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-gray-500"
          />
        </div>

        <select
          value={profileFilter}
          onChange={(e) => setProfileFilter(e.target.value as any)}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900 border border-white/10"
        >
          <option value="ALL">All Profiles</option>
          <option value="LINKED">Profiles Linked Only</option>
          <option value="UNLINKED">No Profiles Linked</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900 border border-white/10"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="banned">Suspended Only</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900 border border-white/10"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Administrators</option>
          <option value="CONTRIBUTOR">Contributors</option>
          <option value="USER">Standard Users</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <AdminTableSkeleton columns={6} rows={6} hasAvatar={true} />
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">No users matched your search filters.</div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1050px] text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-white/10 text-gray-400 font-semibold uppercase">
                <tr>
                  <th className="p-4 whitespace-nowrap">User</th>
                  <th className="p-4 whitespace-nowrap">Email</th>
                  <th className="p-4 whitespace-nowrap">Role</th>
                  <th className="p-4 whitespace-nowrap">Coding Profiles</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 whitespace-nowrap">Activity</th>
                  <th className="p-4 whitespace-nowrap text-right">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 flex items-center gap-2.5 whitespace-nowrap">
                      <img
                        src={
                          optimizeImageUrl(u.avatar, { width: 80, height: 80, crop: 'fill' }) ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.name)}`
                        }
                        alt={u.name}
                        className="w-8 h-8 rounded-full border border-white/15 shrink-0"
                      />
                      <span className="font-bold text-white whitespace-nowrap">{u.name}</span>
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-[11px] whitespace-nowrap">{u.email}</td>
                    <td className="p-4 whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => promptToggleRole(u, e.target.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer outline-none transition-all ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : u.role === 'CONTRIBUTOR'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-gray-300 border-white/10'
                        }`}
                      >
                        <option value="USER" className="bg-slate-900 text-white">USER</option>
                        <option value="CONTRIBUTOR" className="bg-slate-900 text-amber-300">CONTRIBUTOR</option>
                        <option value="ADMIN" className="bg-slate-900 text-purple-300">ADMIN</option>
                      </select>
                    </td>
                    {/* Coding Profiles Button -> Card Modal */}
                    <td className="p-4 whitespace-nowrap">
                      {(() => {
                        const linkedCount = [u.leetcodeUrl, u.codeforcesUrl, u.codechefUrl, u.githubUrl].filter((x) => x?.trim()).length;
                        return (
                          <button
                            type="button"
                            onClick={() => openProfileModal(u)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                              linkedCount > 0
                                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
                            }`}
                            title={`Inspect & manage coding profiles for ${u.name}`}
                          >
                            <Code2 className={`w-3.5 h-3.5 shrink-0 ${linkedCount > 0 ? 'text-amber-400' : 'text-gray-400'}`} />
                            <span className="whitespace-nowrap">View Coding Profiles</span>
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                                linkedCount > 0
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-white/10 text-gray-400'
                              }`}
                            >
                              {linkedCount}/4
                            </span>
                          </button>
                        );
                      })()}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${
                          u.isBanned
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {u.isBanned ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs whitespace-nowrap">
                      {u._count?.likes || 0} likes • {u._count?.comments || 0} comments
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      {/* Toggle Role Button */}
                      <button
                        onClick={() => promptToggleRole(u)}
                        title={u.role === 'ADMIN' ? 'Demote to Standard User' : 'Elevate to Administrator'}
                        className="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white transition-all border border-white/10 active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        {u.role === 'ADMIN' ? 'Demote User' : 'Promote Admin'}
                      </button>

                      {/* Ban/Unban Toggle */}
                      <button
                        onClick={() => promptToggleBan(u)}
                        title={u.isBanned ? 'Reactivate Account' : 'Suspend Account'}
                        className={`p-2 min-h-[36px] min-w-[36px] rounded-xl transition-all inline-flex items-center justify-center active:scale-95 cursor-pointer ${
                          u.isBanned
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                        }`}
                      >
                        {u.isBanned ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>

                      {/* Delete User */}
                      <button
                        onClick={() => promptDeleteUser(u)}
                        title="Delete User Permanently"
                        className="p-2 min-h-[36px] min-w-[36px] rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 inline-flex items-center justify-center transition-all border border-transparent hover:border-red-500/20 active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Governance Pagination */}
          {filteredUsers.length > 0 && (
            <Pagination
              currentPage={userPage}
              totalPages={totalUserPages}
              totalItems={filteredUsers.length}
              pageSize={userPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setUserPage}
              onPageSizeChange={setUserPageSize}
              itemLabel="registered users"
              className="border-t border-white/10 rounded-t-none"
            />
          )}
        </>
      )}
      </div>

      {/* Warning Card Modal for Privileged / Destructive Actions */}
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

      {/* ============================================================ */}
      {/* USER CODING PROFILES INSPECTOR & EDITOR MODAL                */}
      {/* ============================================================ */}
      {profileModal.isOpen && profileModal.user && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            ref={profileTrapRef}
            className="relative w-full max-w-2xl glass-card rounded-3xl border border-white/20 flex flex-col overflow-hidden shadow-2xl bg-slate-950/95 max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <img
                  src={
                    optimizeImageUrl(profileModal.user.avatar, { width: 80, height: 80, crop: 'fill' }) ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profileModal.user.name)}`
                  }
                  alt={profileModal.user.name}
                  className="w-10 h-10 rounded-full border border-amber-500/30 shadow-md shadow-amber-500/10"
                />
                <div>
                  <h3 id="profile-modal-title" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>{profileModal.user.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      profileModal.user.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : profileModal.user.role === 'CONTRIBUTOR'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/10 text-gray-300'
                    }`}>
                      {profileModal.user.role}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">{profileModal.user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProfileModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfiles} className="p-6 space-y-5 overflow-y-auto">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-medium">
                  <Code2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Coding Profiles Governance</span>
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  {[profileModal.leetcodeUrl, profileModal.codeforcesUrl, profileModal.codechefUrl, profileModal.githubUrl].filter((x) => x?.trim()).length} of 4 profiles linked
                </span>
              </div>

              {/* 4 Platform Cards Grid (2x2 on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. LeetCode Card */}
                <div className="p-4 rounded-2xl glass-card border border-amber-500/20 bg-amber-500/[0.03] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white flex items-center gap-1.5">
                          LeetCode Profile
                        </label>
                        <span className="text-[10px] text-amber-400 font-normal">SDE Practice Sheets</span>
                      </div>
                    </div>
                    {profileModal.leetcodeUrl?.trim() && (
                      <a
                        href={normalizeUrl(profileModal.leetcodeUrl, 'lc')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                      >
                        <span>Visit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={profileModal.leetcodeUrl}
                    onChange={(e) => setProfileModal((prev) => ({ ...prev, leetcodeUrl: e.target.value }))}
                    placeholder="e.g. Hydra_Ramesh or https://leetcode.com/u/Hydra_Ramesh"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-gray-500 font-mono"
                  />
                </div>

                {/* 2. Codeforces Card */}
                <div className="p-4 rounded-2xl glass-card border border-blue-500/20 bg-blue-500/[0.03] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white flex items-center gap-1.5">
                          Codeforces Profile
                        </label>
                        <span className="text-[10px] text-blue-400 font-normal">CP &amp; Contests</span>
                      </div>
                    </div>
                    {profileModal.codeforcesUrl?.trim() && (
                      <a
                        href={normalizeUrl(profileModal.codeforcesUrl, 'cf')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition-all cursor-pointer"
                      >
                        <span>Visit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={profileModal.codeforcesUrl}
                    onChange={(e) => setProfileModal((prev) => ({ ...prev, codeforcesUrl: e.target.value }))}
                    placeholder="e.g. tourist or https://codeforces.com/profile/tourist"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-gray-500 font-mono"
                  />
                </div>

                {/* 3. CodeChef Card */}
                <div className="p-4 rounded-2xl glass-card border border-orange-500/20 bg-orange-500/[0.03] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white flex items-center gap-1.5">
                          CodeChef Profile
                        </label>
                        <span className="text-[10px] text-orange-400 font-normal">CP &amp; Star Rating</span>
                      </div>
                    </div>
                    {profileModal.codechefUrl?.trim() && (
                      <a
                        href={normalizeUrl(profileModal.codechefUrl, 'cc')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 transition-all cursor-pointer"
                      >
                        <span>Visit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={profileModal.codechefUrl}
                    onChange={(e) => setProfileModal((prev) => ({ ...prev, codechefUrl: e.target.value }))}
                    placeholder="e.g. chef_user or https://www.codechef.com/users/chef_user"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-gray-500 font-mono"
                  />
                </div>

                {/* 4. GitHub Card */}
                <div className="p-4 rounded-2xl glass-card border border-purple-500/20 bg-purple-500/[0.03] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                        <GithubIcon className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white flex items-center gap-1.5">
                          GitHub Profile
                        </label>
                        <span className="text-[10px] text-purple-400 font-normal">Developer Portfolio</span>
                      </div>
                    </div>
                    {profileModal.githubUrl?.trim() && (
                      <a
                        href={normalizeUrl(profileModal.githubUrl, 'gh')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all cursor-pointer"
                      >
                        <span>Visit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={profileModal.githubUrl}
                    onChange={(e) => setProfileModal((prev) => ({ ...prev, githubUrl: e.target.value }))}
                    placeholder="e.g. Hydra-Ramesh or https://github.com/Hydra-Ramesh"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-gray-500 font-mono"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProfileModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileModal.saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {profileModal.saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Profiles...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profiles</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
