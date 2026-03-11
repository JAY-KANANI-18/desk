import { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { ConversationTag } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';

export const Tags = () => {
  const [tags, setTags]       = useState<ConversationTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTag, setNewTag]   = useState({ name: '', color: '#6366f1' });
  const [adding, setAdding]   = useState(false);

  const load = useCallback(async () => {
    // setLoading(true); 
    setError(null);
   setTags(await workspaceApi.getTags()); 
    
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newTag.name) return;
    // setAdding(true);

      const created = await workspaceApi.addTag(newTag);
      setTags(prev => [...prev, created]);
      setNewTag({ name: '', color: '#6366f1' });
      setShowAdd(false);
   
  };

  const handleDelete = async (id: number) => {
    setTags(prev => prev.filter(t => t.id !== id));
 await workspaceApi.deleteTag(id); 
   
  };

  if (loading) return <SectionLoader />;
  if (error && tags.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Conversation tags</h2>
            <p className="text-xs text-gray-500 mt-0.5">Organize and filter conversations with tags</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus size={16} /> Add tag
          </button>
        </div>
        <div className="p-6 flex flex-wrap gap-3">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white hover:shadow-sm transition-shadow group">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
              <span className="text-sm font-medium text-gray-700">{tag.name}</span>
              <span className="text-xs text-gray-400">{tag.count}</span>
              <button onClick={() => handleDelete(tag.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 ml-1">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Add tag</h3>
              <button onClick={() => setShowAdd(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag name</label>
                <input value={newTag.name} onChange={e => setNewTag({ ...newTag, name: e.target.value })} placeholder="e.g. Priority" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={newTag.color} onChange={e => setNewTag({ ...newTag, color: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <div className="flex gap-2 flex-wrap">
                    {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'].map(c => (
                      <button key={c} onClick={() => setNewTag({ ...newTag, color: c })} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${newTag.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={adding} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {adding ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</> : 'Add tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
