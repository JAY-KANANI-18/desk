import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, Pencil, Users } from 'lucide-react';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { Team, TeamMember } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';

// ─── Team modal ───────────────────────────────────────────────────────────────
interface TeamModalProps {
  team: Team | null; // null = create mode
  members: TeamMember[];
  onClose: () => void;
  onSave: (name: string, description: string, memberIds: string[]) => Promise<void>;
}

const TeamModal = ({ team, members, onClose, onSave }: TeamModalProps) => {
  const [name, setName] = useState(team?.name ?? '');
  const [description, setDescription] = useState(team?.description ?? '');
  const [selected, setSelected] = useState<Set<number>>(new Set(team?.memberIds ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSave = async () => {
    if (!name.trim()) { setError('Team name is required'); return; }
    // setSaving(true); 
    setError(null);
    await onSave(name.trim(), description.trim(), [...selected]);
    onClose();

  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{team ? 'Edit team' : 'Create team'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team name <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Support, Sales, Technical"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this team handle?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Members <span className="text-gray-400 font-normal">({selected.size} selected)</span>
            </label>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto">
              {members.map(m => {
                const isSelected = selected.has(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(m.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-600 shrink-0">
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${m.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                        m.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                      }`}>{m.role}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
          >
            {saving
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
              : team ? 'Save changes' : 'Create team'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main section ─────────────────────────────────────────────────────────────
export const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalTeam, setModalTeam] = useState<Team | null | undefined>(undefined); // undefined = closed, null = create

  const load = useCallback(async () => {
    // setLoading(true);
    setError(null);
    const [t, m] = await Promise.all([workspaceApi.getTeams(), workspaceApi.getTeamMembers()]);
    setTeams(t); setMembers(m);

  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (name: string, description: string, memberIds: string[]) => {
    if (modalTeam) {
      // Edit
      setTeams(ts => ts.map(t => t.id === modalTeam.id ? { ...t, name, description, memberIds } : t));
      await workspaceApi.updateTeam(modalTeam.id, { name, description, memberIds });

    } else {
      // Create
      const newTeam = await workspaceApi.createTeam({ name, description, memberIds });
      setTeams(prev => [...prev, newTeam]);
    }
  };

  const handleDelete = async (id: string) => {
    setTeams(ts => ts.filter(t => t.id !== id));
    await workspaceApi.deleteTeam(id);
  };

  const getMemberById = (id: string) => members.find(m => m.id === id);

  if (loading) return <SectionLoader />;
  if (error && teams.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Teams</h2>
            <p className="text-xs text-gray-500 mt-0.5">{teams.length} team{teams.length !== 1 ? 's' : ''} · Organise agents into groups for routing and reporting</p>
          </div>
          <button
            onClick={() => setModalTeam(null)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            <Plus size={16} /> Create team
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
              <Users size={22} className="text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">No teams yet</p>
            <p className="text-xs text-gray-500 max-w-xs">Create your first team to organise agents and route conversations more efficiently.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {teams.map(team => {
              const teamMembers = team.memberIds.map(getMemberById).filter(Boolean) as TeamMember[];
              return (
                <div key={team.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 group">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <Users size={18} className="text-indigo-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{team.name}</p>
                    {team.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{team.description}</p>
                    )}
                    {/* Member avatars */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex -space-x-1.5">
                        {teamMembers.slice(0, 5).map(m => (
                          <div
                            key={m.id}
                            title={m.name}
                            className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-[10px] font-semibold text-indigo-700 border-2 border-white"
                          >
                            {m.avatar}
                          </div>
                        ))}
                        {teamMembers.length > 5 && (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-semibold text-gray-600 border-2 border-white">
                            +{teamMembers.length - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModalTeam(team)}
                      title="Edit team"
                      className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
                      title="Delete team"
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Modal */}
      {modalTeam !== undefined && (
        <TeamModal
          team={modalTeam}
          members={members}
          onClose={() => setModalTeam(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
