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
} from 'lucide-react';

function GithubIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
import { fetchApi } from '../../../lib/api';
import { optimizeImageUrl } from '../../../lib/image';
import { useDebounce } from '../../../hooks/useDebounce';
import AdminTableSkeleton from '../../../components/skeletons/AdminTableSkeleton';
import { useToast } from '../../../context/ToastContext';
import WarningCardModal, { WarningDetail } from '../../../components/WarningCardModal';

export default function AdminUserGovernancePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [statusFilter, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    let query = '?limit=50';
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

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

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
            Maintain platform trust and security: suspend malicious accounts, audit permissions, and promote admins.
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
            placeholder="Search by name, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-gray-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="banned">Suspended Only</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900"
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-white/10 text-gray-400 font-semibold uppercase">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Coding Profiles</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Activity</th>
                  <th className="p-4 text-right">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 flex items-center gap-2.5">
                      <img
                        src={
                          optimizeImageUrl(u.avatar, { width: 80, height: 80, crop: 'fill' }) ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.name)}`
                        }
                        alt={u.name}
                        className="w-8 h-8 rounded-full border border-white/15"
                      />
                      <span className="font-bold text-white">{u.name}</span>
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-[11px]">{u.email}</td>
                    <td className="p-4">
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
                    {/* Coding Profiles (GitHub, LeetCode, Codeforces, CodeChef) */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        {u.githubUrl && (
                          <a
                            href={u.githubUrl.startsWith('http') ? u.githubUrl : `https://github.com/${u.githubUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`GitHub: ${u.githubUrl}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-slate-200 hover:text-white border border-white/10 hover:border-white/30 transition-all cursor-pointer"
                          >
                            <GithubIcon className="w-2.5 h-2.5 text-gray-300" />
                            <span>GH</span>
                            <ExternalLink className="w-2 h-2 text-gray-400" />
                          </a>
                        )}

                        {u.leetcodeUrl && (
                          <a
                            href={u.leetcodeUrl.startsWith('http') ? u.leetcodeUrl : `https://leetcode.com/u/${u.leetcodeUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`LeetCode: ${u.leetcodeUrl}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer"
                          >
                            <Code2 className="w-2.5 h-2.5 text-amber-400" />
                            <span>LC</span>
                            <ExternalLink className="w-2 h-2 text-amber-400" />
                          </a>
                        )}

                        {u.codeforcesUrl && (
                          <a
                            href={u.codeforcesUrl.startsWith('http') ? u.codeforcesUrl : `https://codeforces.com/profile/${u.codeforcesUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Codeforces: ${u.codeforcesUrl}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 transition-all cursor-pointer"
                          >
                            <Trophy className="w-2.5 h-2.5 text-blue-400" />
                            <span>CF</span>
                            <ExternalLink className="w-2 h-2 text-blue-400" />
                          </a>
                        )}

                        {u.codechefUrl && (
                          <a
                            href={u.codechefUrl.startsWith('http') ? u.codechefUrl : `https://www.codechef.com/users/${u.codechefUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`CodeChef: ${u.codechefUrl}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-orange-500/15 text-orange-300 hover:text-orange-200 border border-orange-500/30 hover:border-orange-500/50 transition-all cursor-pointer"
                          >
                            <Flame className="w-2.5 h-2.5 text-orange-400" />
                            <span>CC</span>
                            <ExternalLink className="w-2 h-2 text-orange-400" />
                          </a>
                        )}

                        {!u.githubUrl && !u.leetcodeUrl && !u.codeforcesUrl && !u.codechefUrl && (
                          <span className="text-[10px] font-mono text-gray-500 italic">None linked</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          u.isBanned
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {u.isBanned ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {u._count?.likes || 0} likes • {u._count?.comments || 0} comments
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {/* Toggle Role Button */}
                      <button
                        onClick={() => promptToggleRole(u)}
                        title={u.role === 'ADMIN' ? 'Demote to Standard User' : 'Elevate to Administrator'}
                        className="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white transition-all border border-white/10 active:scale-95 cursor-pointer"
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
    </div>
  );
}
