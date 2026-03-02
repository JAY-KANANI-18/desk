import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, MailCheck, Pencil } from 'lucide-react';
import { workspaceApi } from '../api';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { TeamMember } from '../types';

export const TeamSettings = () => {
  const [members, setMembers]         = useState<TeamMember[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showInvite, setShowInvite]   = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('Agent');
  const [inviting, setInviting]       = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resentId, setResentId]       = useState<number | null>(null);

  // Edit modal state
  const [editMember, setEditMember]   = useState<TeamMember | null>(null);
  const [editRole, setEditRole]       = useState('Agent');
  const [editSaving, setEditSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setMembers(await workspaceApi.getTeamMembers()); }
    catch { setError('Failed to load users.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const newMember = await workspaceApi.inviteMember(inviteEmail, inviteRole);
      setMembers(prev => [...prev, newMember]);
      setInviteEmail(''); setShowInvite(false);
    } catch { setError('Failed to send invite.'); }
    finally { setInviting(false); }
  };

  const handleResendInvite = async (id: number) => {
    setResendingId(id);
    try {
      await workspaceApi.resendInvite(id);
      setResentId(id);
      setTimeout(() => setResentId(null), 2500);
    } catch { setError('Failed to resend invite.'); }
    finally { setResendingId(null); }
  };

  const openEdit = (m: TeamMember) => {
    setEditMember(m);
    setEditRole(m.role);
  };

  const handleEditSave = async () => {
    if (!editMember) return;
    setEditSaving(true);
    const prev = members;
    setMembers(ms => ms.map(m => m.id === editMember.id ? { ...m, role: editRole } : m));
    try {
      await workspaceApi.updateMemberRole(editMember.id, editRole);
      setEditMember(null);
    } catch {
      setMembers(prev);
      setError('Failed to update role.');
    } finally { setEditSaving(false); }
  };

  const handleRemove = async (id: number) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    try { await workspaceApi.removeMember(id); }
    catch { load(); }
  };

  if (loading) return <SectionLoader />;
  if (error && members.length === 0) return <SectionError message={error} onRetry={load} />;

  const activeMembers  = members.filter(m => m.status === 'Active');
  const invitedMembers = members.filter(m => m.status === 'Invited');

  return (
    <div className="space-y-6">
      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All users</h2>
            <p className="text-xs text-gray-500 mt-0.5">{members.length} users · {activeMembers.length} active · {invitedMembers.length} pending</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            <Plus size={16} /> Invite user
          </button>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                {/* User */}
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-600 shrink-0">
                      {m.avatar}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                  </div>
                </td>

                {/* Email */}
                <td className="px-6 py-3 text-sm text-gray-500">{m.email}</td>

                {/* Role */}
                <td className="px-6 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    m.role === 'Admin'   ? 'bg-purple-100 text-purple-700' :
                    m.role === 'Manager' ? 'bg-blue-100 text-blue-700'     :
                                          'bg-gray-100 text-gray-600'
                  }`}>{m.role}</span>
                </td>

                {/* Status */}
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    m.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>{m.status}</span>
                </td>

                {/* Actions */}
                <td className="px-6 py-3">
                  <div className="flex items-center gap-1">
                    {/* Edit / assign role */}
                    <button
                      onClick={() => openEdit(m)}
                      title="Edit role"
                      className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Resend invite — only for Invited */}
                    {m.status === 'Invited' && (
                      <button
                        onClick={() => handleResendInvite(m.id)}
                        disabled={resendingId === m.id}
                        title="Resend invite"
                        className={`p-1.5 rounded-lg transition-colors ${
                          resentId === m.id
                            ? 'bg-green-50 text-green-600'
                            : 'hover:bg-amber-50 text-gray-400 hover:text-amber-600'
                        }`}
                      >
                        {resendingId === m.id
                          ? <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          : <MailCheck size={14} />
                        }
                      </button>
                    )}

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(m.id)}
                      title="Remove user"
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Roles & permissions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Roles & permissions</h2>
        <div className="space-y-3">
          {[
            { role: 'Admin',   desc: 'Full access to all settings, billing, and team management', color: 'text-purple-600 bg-purple-50' },
            { role: 'Manager', desc: 'Manage team, view reports, assign conversations',           color: 'text-blue-600 bg-blue-50'     },
            { role: 'Agent',   desc: 'Handle conversations, use inbox features',                  color: 'text-gray-600 bg-gray-50'     },
          ].map(r => (
            <div key={r.role} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${r.color}`}>{r.role}</span>
              <p className="text-sm text-gray-600 mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Invite user</h3>
              <button onClick={() => setShowInvite(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['Admin', 'Manager', 'Agent'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowInvite(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
              >
                {inviting
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                  : 'Send invite'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit role modal */}
      {editMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Edit user</h3>
              <button onClick={() => setEditMember(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600">
                {editMember.avatar}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{editMember.name}</p>
                <p className="text-xs text-gray-500">{editMember.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign role</label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['Admin', 'Manager', 'Agent'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditMember(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
              >
                {editSaving
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                  : 'Save changes'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
