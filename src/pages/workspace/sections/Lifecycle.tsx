import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, GripVertical, Edit2, X } from 'lucide-react';
import { workspaceApi } from '../api';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { LifecycleStage } from '../types';

export const Lifecycle = () => {
  const [stages, setStages]     = useState<LifecycleStage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [newStage, setNewStage] = useState({ name: '', color: '#6366f1' });
  const [editId, setEditId]     = useState<number | null>(null);
  const [adding, setAdding]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setStages(await workspaceApi.getLifecycleStages()); }
    catch { setError('Failed to load lifecycle stages.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newStage.name) return;
    setAdding(true);
    try {
      const created = await workspaceApi.addLifecycleStage(newStage);
      setStages(prev => [...prev, created]);
      setNewStage({ name: '', color: '#6366f1' });
      setShowAdd(false);
    } catch { setError('Failed to add stage.'); }
    finally { setAdding(false); }
  };

  const handleNameBlur = async (id: number, name: string) => {
    setEditId(null);
    try { await workspaceApi.updateLifecycleStage(id, { name }); }
    catch { load(); }
  };

  const handleDelete = async (id: number) => {
    setStages(prev => prev.filter(s => s.id !== id));
    try { await workspaceApi.deleteLifecycleStage(id); }
    catch { load(); }
  };

  if (loading) return <SectionLoader />;
  if (error && stages.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Lifecycle stages</h2>
            <p className="text-xs text-gray-500 mt-0.5">Define the stages contacts move through</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus size={16} /> Add stage
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {stages.map((stage, idx) => (
            <div key={stage.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
              <GripVertical size={16} className="text-gray-300 cursor-grab flex-shrink-0" />
              <span className="text-sm text-gray-400 w-5">{idx + 1}</span>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
              {editId === stage.id ? (
                <input
                  autoFocus
                  value={stage.name}
                  onChange={e => setStages(stages.map(s => s.id === stage.id ? { ...s, name: e.target.value } : s))}
                  onBlur={() => handleNameBlur(stage.id, stage.name)}
                  onKeyDown={e => e.key === 'Enter' && handleNameBlur(stage.id, stage.name)}
                  className="flex-1 px-2 py-1 border border-indigo-400 rounded text-sm focus:outline-none"
                />
              ) : (
                <span className="flex-1 text-sm font-medium text-gray-800">{stage.name}</span>
              )}
              <span className="text-xs text-gray-400 mr-2">{stage.count} contacts</span>
              <button onClick={() => setEditId(stage.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(stage.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Add lifecycle stage</h3>
              <button onClick={() => setShowAdd(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage name</label>
                <input value={newStage.name} onChange={e => setNewStage({ ...newStage, name: e.target.value })} placeholder="e.g. Demo scheduled" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={newStage.color} onChange={e => setNewStage({ ...newStage, color: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <div className="flex gap-2">
                    {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'].map(c => (
                      <button key={c} onClick={() => setNewStage({ ...newStage, color: c })} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${newStage.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={adding} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {adding ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</> : 'Add stage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
