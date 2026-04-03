import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';
import { Toggle } from '../components/Toggle';
import { SectionError } from '../components/SectionError';
import type { ContactField } from '../types';
import { DataLoader } from '../../Loader';

const typeColors: Record<string, string> = {
  Text: 'bg-blue-50 text-blue-600', Email: 'bg-purple-50 text-purple-600',
  Phone: 'bg-green-50 text-green-600', Dropdown: 'bg-amber-50 text-amber-600',
  Date: 'bg-pink-50 text-pink-600', Number: 'bg-indigo-50 text-indigo-600',
  Checkbox: 'bg-teal-50 text-teal-600',
};

export const ContactFields = () => {
  const [fields, setFields]     = useState<ContactField[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [newField, setNewField] = useState({ name: '', type: 'Text', required: false });
  const [adding, setAdding]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setFields(await workspaceApi.getContactFields()); }
    catch { setError('Failed to load contact fields.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newField.name) return;
    setAdding(true);
    try {
      const created = await workspaceApi.addContactField({ ...newField, system: false });
      setFields(prev => [...prev, created]);
      setNewField({ name: '', type: 'Text', required: false });
      setShowAdd(false);
    } catch { setError('Failed to add field.'); }
    finally { setAdding(false); }
  };

  const handleToggleRequired = async (id: number, required: boolean) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, required } : f));
    try { await workspaceApi.updateContactField(id, { required }); }
    catch { load(); }
  };

  const handleDelete = async (id: number) => {
    setFields(prev => prev.filter(f => f.id !== id));
    try { await workspaceApi.deleteContactField(id); }
    catch { load(); }
  };

  if (loading) return <DataLoader type={"fields"} />;
  if (error && fields.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Contact fields</h2>
            <p className="text-xs text-gray-500 mt-0.5">Customize the data you collect for each contact</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus size={16} /> Add field
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Field name', 'Type', 'Required', ''].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fields.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    {!f.system && <GripVertical size={14} className="text-gray-300 cursor-grab" />}
                    <span className="text-sm font-medium text-gray-800">{f.name}</span>
                    {f.system && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">System</span>}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeColors[f.type] ?? 'bg-gray-100 text-gray-600'}`}>{f.type}</span>
                </td>
                <td className="px-6 py-3">
                  <Toggle checked={f.required} onChange={v => handleToggleRequired(f.id, v)} />
                </td>
                <td className="px-6 py-3">
                  {!f.system && (
                    <button onClick={() => handleDelete(f.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Add contact field</h3>
              <button onClick={() => setShowAdd(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field name</label>
                <input value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} placeholder="e.g. Customer tier" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field type</label>
                <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {['Text', 'Number', 'Email', 'Phone', 'Date', 'Dropdown', 'Checkbox'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Required field</label>
                <Toggle checked={newField.required} onChange={v => setNewField({ ...newField, required: v })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={adding} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {adding ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</> : 'Add field'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
