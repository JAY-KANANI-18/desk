import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, X, Sparkles } from 'lucide-react';

import { SectionError } from '../components/SectionError';
import type { AIPrompt } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';
import { DataLoader } from '../../Loader';

export const AIPrompts = () => {
  const [prompts, setPrompts]         = useState<AIPrompt[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [editPrompt, setEditPrompt]   = useState<AIPrompt | null>(null);
  const [form, setForm]               = useState({ name: '', prompt: '' });
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setPrompts(await workspaceApi.getAIPrompts()); }
    catch { setError('Failed to load AI prompts.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name || !form.prompt) return;
    setSaving(true);
    try {
      if (editPrompt) {
        await workspaceApi.updateAIPrompt(editPrompt.id, form);
        setPrompts(prev => prev.map(p => p.id === editPrompt.id ? { ...p, ...form } : p));
      } else {
        const created = await workspaceApi.addAIPrompt(form);
        setPrompts(prev => [...prev, created]);
      }
      setForm({ name: '', prompt: '' });
      setShowAdd(false); setEditPrompt(null);
    } catch { setError('Failed to save prompt.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    try { await workspaceApi.deleteAIPrompt(id); }
    catch { load(); }
  };

  const handleSetActive = async (id: number) => {
    setPrompts(prev => prev.map(p => ({ ...p, active: p.id === id })));
    try { await workspaceApi.setActiveAIPrompt(id); }
    catch { load(); }
  };

  if (loading) return <DataLoader type={"prompts"} />;
  if (error && prompts.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <Sparkles size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-indigo-800">Custom AI system prompts</p>
          <p className="text-xs text-indigo-600 mt-0.5">Define how the AI behaves when assisting your agents. Only one prompt can be active at a time.</p>
        </div>
      </div>

      <div className="space-y-3">
        {prompts.map(p => (
          <div key={p.id} className={`bg-white rounded-xl border p-5 transition-colors ${p.active ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                {p.active && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Active</span>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => { setEditPrompt(p); setForm({ name: p.name, prompt: p.prompt }); setShowAdd(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{p.prompt}</p>
            {!p.active && (
              <button onClick={() => handleSetActive(p.id)} className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium">Set as active →</button>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => { setEditPrompt(null); setForm({ name: '', prompt: '' }); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors w-full justify-center">
        <Plus size={16} /> Add prompt
      </button>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{editPrompt ? 'Edit prompt' : 'Add AI prompt'}</h3>
              <button onClick={() => { setShowAdd(false); setEditPrompt(null); }}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Empathetic support" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System prompt</label>
                <textarea value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })} rows={6} placeholder="You are a helpful customer support agent..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                <p className="text-xs text-gray-400 mt-1">{form.prompt.length} / 2000 characters</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowAdd(false); setEditPrompt(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : editPrompt ? 'Save changes' : 'Add prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
