import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Smile, X } from 'lucide-react';

import { SectionError } from '../components/SectionError';
import type { ConversationTag } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';
import { DataLoader } from '../../Loader';
import { getTagSurfaceStyle, resolveTagBaseColor, TAG_COLOR_OPTIONS } from '../../../lib/tagAppearance';
import { EmojiPicker } from '../../inbox/EmojiPicker';

export const Tags = () => {
  const [tags, setTags]       = useState<ConversationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTag, setNewTag]   = useState({ name: '', color: 'tag-indigo', emoji: '😀', description: '' });
  const [adding, setAdding]   = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    // setLoading(true); 
    setError(null);
   setTags(await workspaceApi.getTags()); 
   setLoading(false);
    
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!emojiOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (!emojiRef.current?.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [emojiOpen]);

  const handleAdd = async () => {
    if (!newTag.name) return;
    // setAdding(true);

      const created = await workspaceApi.addTag(newTag);
      setTags(prev => [...prev, created]);
      setNewTag({ name: '', color: 'tag-indigo', emoji: '😀', description: '' });
      setShowAdd(false);
   
  };

  const handleDelete = async (id: number | string) => {
    setTags(prev => prev.filter(t => t.id !== id));
 await workspaceApi.deleteTag(id); 
   
  };

  if (loading) return <DataLoader type={"tags"} />;
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Tag</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Description</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Color</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Contacts</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tags?.map(tag => {
                const surfaceStyle = getTagSurfaceStyle(tag.bundle?.color || tag.color);
                const baseColor = resolveTagBaseColor(tag.bundle?.color || tag.color);
                return (
                  <tr key={tag.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium"
                        style={surfaceStyle}
                      >
                        <span>{tag.bundle?.emoji || tag.emoji || '🏷️'}</span>
                        <span>{tag.name}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tag.bundle?.description || tag.description || <span className="italic text-gray-400">No description</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: baseColor }} />
                        <span className="text-sm text-gray-600">{tag.bundle?.color || tag.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{tag.count}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(tag.id)} className="text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Create Tag</h3>
              <button onClick={() => setShowAdd(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
                <span>{newTag.emoji || '🏷️'}</span>
                <span className="text-sm text-gray-600">{newTag.name || 'New tag'}</span>
              </div>
              <div className="grid grid-cols-[76px_1fr] gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                  <div className="relative" ref={emojiRef}>
                    <button
                      type="button"
                      onClick={() => setEmojiOpen((prev) => !prev)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-2xl flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <span>{newTag.emoji}</span>
                      <Smile size={16} className="text-indigo-600" />
                    </button>
                    {emojiOpen ? (
                      <EmojiPicker
                        mode="tag"
                        accent="indigo"
                        onSelect={(emoji) => {
                          setNewTag({ ...newTag, emoji });
                          setEmojiOpen(false);
                        }}
                      />
                    ) : null}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input value={newTag.name} onChange={e => setNewTag({ ...newTag, name: e.target.value })} placeholder="e.g. Priority" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {TAG_COLOR_OPTIONS.map((option) => (
                      <button key={option.value} type="button" onClick={() => setNewTag({ ...newTag, color: option.value })} className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${newTag.color === option.value ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: option.hex }} />
                    ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTag.description}
                  onChange={e => setNewTag({ ...newTag, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
