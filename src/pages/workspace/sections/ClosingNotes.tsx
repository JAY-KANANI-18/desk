import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, Info } from 'lucide-react';
import { Toggle } from '../components/Toggle';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { ClosingNoteSettings } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';

export const ClosingNotes = () => {
  const [settings, setSettings] = useState<ClosingNoteSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [newNote, setNewNote]   = useState({ title: '', text: '' });
  const [adding, setAdding]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSettings(await workspaceApi.getClosingNoteSettings()); }
    catch { setError('Failed to load closing note settings.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleRequired = async (required: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, required });
    try { await workspaceApi.updateClosingNoteRequired(required); }
    catch { load(); }
  };

  const handleAdd = async () => {
    if (!newNote.title || !newNote.text || !settings) return;
    setAdding(true);
    try {
      const created = await workspaceApi.addClosingNoteTemplate(newNote);
      setSettings({ ...settings, templates: [...settings.templates, created] });
      setNewNote({ title: '', text: '' });
      setShowAdd(false);
    } catch { setError('Failed to add template.'); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id: number) => {
    if (!settings) return;
    setSettings({ ...settings, templates: settings.templates.filter(t => t.id !== id) });
    try { await workspaceApi.deleteClosingNoteTemplate(id); }
    catch { load(); }
  };

  if (loading) return <SectionLoader />;
  if (error || !settings) return <SectionError message={error ?? 'Unknown error'} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Require closing notes</h2>
            <p className="text-sm text-gray-500 mt-1">Agents must add a note before closing a conversation</p>
          </div>
          <Toggle checked={settings.required} onChange={handleToggleRequired} />
        </div>
        {settings.required && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-xs text-indigo-700 flex items-center gap-1.5"><Info size={13} /> Agents will see a prompt to add a closing note when resolving conversations.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Note templates</h2>
            <p className="text-xs text-gray-500 mt-0.5">Quick-select templates for agents</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus size={16} /> Add template
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {settings.templates.map(t => (
            <div key={t.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.text}</p>
              </div>
              <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Add note template</h3>
              <button onClick={() => setShowAdd(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} placeholder="e.g. Issue resolved" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note text</label>
                <textarea value={newNote.text} onChange={e => setNewNote({ ...newNote, text: e.target.value })} rows={3} placeholder="Template text agents will see..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={adding} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {adding ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</> : 'Add template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
