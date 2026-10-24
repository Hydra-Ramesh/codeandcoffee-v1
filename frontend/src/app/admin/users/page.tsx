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
} from 'lucide-react';
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
