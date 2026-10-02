import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, FileText, Database, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { User, AuditLog } from '../types';
import { api } from '../services/api';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // New user form modal
  const [showAddUser, setShowAddUser] = useState<boolean>(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'District Officer',
    state: 'Jharkhand',
    district: 'Ranchi',
    department: 'District Land Acquisition Office'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, a, s] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs(30),
        api.getSystemStats()
      ]);
      setUsers(u);
      setAuditLogs(a);
      setStats(s);
    } catch (e) {
      console.error('Failed to load admin console', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('landguard_token') || ''}`
        },
        body: JSON.stringify(newUserData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create user');
      }
      setShowAddUser(false);
      setNewUserData({
        email: '', password: '', full_name: '',
        role: 'District Officer', state: 'Jharkhand', district: 'Ranchi', department: ''
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center">
          <ShieldCheck className="w-5 h-5 mr-2 text-sky-600" />
          Government System Administration & Governance
        </h2>
        <p className="text-xs text-slate-500">
          User provisioning, Role-Based Access Control (RBAC), and immutable audit trail verification
        </p>
      </div>

      {/* System Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Active User Accounts</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">{stats.total_users}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Demonstration Projects</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">{stats.total_projects}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Audit Trail Events</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">{stats.audit_events}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Active ML Engine</span>
            <span className="text-2xl font-bold text-emerald-600 font-mono">v1.0.0</span>
          </div>
        </div>
      )}

      {/* Users Section */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-slate-500" />
              Role-Based Access Control (RBAC) User Directory
            </h3>
            <p className="text-xs text-slate-500">Manage government officer credentials and jurisdictional scopes</p>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Government User</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold text-left">
                <th className="py-2.5 px-3">Officer Name</th>
                <th className="py-2.5 px-3">Official Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Jurisdiction</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {u.district ? `${u.district}, ${u.state}` : u.state || 'National (All)'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{u.department || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-emerald-700 font-semibold">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center">
            <FileText className="w-4 h-4 mr-1.5 text-slate-500" />
            Statutory Audit Trail Logs (Immutable History)
          </h3>
          <p className="text-xs text-slate-500">Every project modification, prediction recalculation, and alert is recorded</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs font-mono">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold text-left">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Officer</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Entity ID</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-semibold">{log.user_email.split('@')[0]}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{log.entity_type}</td>
                  <td className="py-2.5 px-3 font-bold text-sky-700">{log.entity_id}</td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-sm truncate">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Government Officer</h3>
              <button onClick={() => setShowAddUser(false)} className="text-slate-400 font-bold">&times;</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra, OAS"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@landguard.gov.in"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="State Officer">State Officer</option>
                    <option value="District Officer">District Officer</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newUserData.state}
                    onChange={(e) => setNewUserData({ ...newUserData, state: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
                >
                  Create Officer Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
