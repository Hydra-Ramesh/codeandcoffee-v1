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

export default function AdminUserGovernancePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const handleToggleBan = async (user: any) => {
    const actionName = user.isBanned ? 'reactivate' : 'suspend';
    if (!confirm(`Are you sure you want to ${actionName} access for ${user.email}?`)) return;

    const res = await fetchApi(`/users/${user.id}/ban`, { method: 'PATCH' });
    if (res.success && res.data) {
      setUsers(users.map((u) => (u.id === user.id ? { ...u, isBanned: res.data.isBanned } : u)));
      setMessage(res.message || 'User status updated successfully.');
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.message || 'Operation failed.');
    }
  };

  const handleToggleRole = async (targetUser: any, specificRole?: string) => {
    const newRole = specificRole || (targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN');
    if (newRole === targetUser.role) return;
    if (!confirm(`Change role of ${targetUser.name} to ${newRole}?`)) return;

    const res = await fetchApi(`/users/${targetUser.id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole }),
    });

    if (res.success && res.data) {
      setUsers(users.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
      setMessage(res.message || `Role updated to ${newRole}`);
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.message || 'Operation failed.');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Permanently delete user ${user.email} and all related data?`)) return;

    const res = await fetchApi(`/users/${user.id}`, { method: 'DELETE' });
    if (res.success) {
      setUsers(users.filter((u) => u.id !== user.id));
      setMessage('User deleted permanently.');
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.message || 'Failed to delete user.');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
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
          <div className="py-12 text-center text-gray-400 text-xs">Loading user database...</div>
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
                        src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.name)}`}
                        alt={u.name}
                        className="w-8 h-8 rounded-full border border-white/15"
                      />
                      <span className="font-bold text-white">{u.name}</span>
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-[11px]">{u.email}</td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleToggleRole(u, e.target.value)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer outline-none ${
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
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.isBanned
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {u.isBanned ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {u._count?.likes || 0} likes • {u._count?.comments || 0} comments
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {/* Toggle Role Button */}
                      <button
                        onClick={() => handleToggleRole(u)}
                        title={u.role === 'ADMIN' ? 'Demote to Standard User' : 'Elevate to Administrator'}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
                      >
                        {u.role === 'ADMIN' ? 'Demote User' : 'Promote Admin'}
                      </button>

                      {/* Ban/Unban Toggle */}
                      <button
                        onClick={() => handleToggleBan(u)}
                        title={u.isBanned ? 'Reactivate Account' : 'Suspend Account'}
                        className={`p-1.5 rounded-lg transition-colors inline-block ${
                          u.isBanned
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {u.isBanned ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>

                      {/* Delete User */}
                      <button
                        onClick={() => handleDeleteUser(u)}
                        title="Delete User Permanently"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 inline-block transition-colors"
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
    </div>
  );
}
