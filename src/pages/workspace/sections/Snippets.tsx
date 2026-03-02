import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, X, Search } from 'lucide-react';
import { workspaceApi } from '../api';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { Snippet } from '../types';

export const Snippets = () => {
  const [snippets, setSnippets]           = useState<Snippet[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [showAdd, setShowAdd]             = useState(false);
  const [editSnippet, setEditSnippet]     = useState<Snippet | null>(null);
  const [form, setForm]                   = useState({ shortcut: '', title: '', content: '' });
  const [saving, setSaving]               = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSnippets(await workspaceApi.getSnippets()); }
    catch { setError('Failed to load snippets.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = snippets.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.shortcut.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.shortcut || !form.content) return;
    setSaving(true);
    try {
      if (editSnippet) {
        await workspaceApi.updateSnippet(editSnippet.id, form);
        setSnippets(prev => prev.map(s => s.id === editSnippet.id ? { ...s, ...form } : s));
      } else {
        const created = await workspaceApi.addSnippet(form);
        setSnippets(prev => [...prev, created]);
      }
      setForm({ shortcut: '', title: '', content: '' });
      setShowAdd(false); setEditSnippet(null);
    } catch { setError('Failed to save snippet.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
    try { await workspaceApi.deleteSnippet(id); }
    catch { load(); }
  };

  const openEdit = (s: Snippet) => {
    setEditSnippet(s);
    setForm({ shortcut: s.shortcut, title: s.title, content: s.content });
    setShowAdd(true);
  };

  if (loading) return <SectionLoader />;
  if (error && snippets.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Canned responses</h2>
            <p className="text-xs text-gray-500 mt-0.5">Type a shortcut in the reply box to insert</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search snippets…" className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44" />
            </div>
            <button onClick={() => { setEditSnippet(null); setForm({ shortcut: '', title: '', content: '' }); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              <Plus size={16} /> Add snippet
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.map(s => (
            <div key={s.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50">
              <code className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono flex-shrink-0 mt-0.5">{s.shortcut}</code>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{s.content}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="px-6 py-8 text-center text-sm text-gray-400">No snippets found</div>}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{editSnippet ? 'Edit snippet' : 'Add snippet'}</h3>
              <button onClick={() => { setShowAdd(false); setEditSnippet(null); }}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shortcut</label>
                  <input value={form.shortcut} onChange={e => setForm({ ...form, shortcut: e.target.value })} placeholder="/shortcut" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Snippet title" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Message content. Use {{contact.firstName}} for variables." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowAdd(false); setEditSnippet(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : editSnippet ? 'Save changes' : 'Add snippet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
