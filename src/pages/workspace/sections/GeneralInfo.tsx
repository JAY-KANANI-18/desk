import { useState, useEffect, useCallback } from 'react';
import { Upload, Copy, Save, Check } from 'lucide-react';
import { workspaceApi } from '../api';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { WorkspaceInfo } from '../types';

export const GeneralInfo = () => {
  const [form, setForm]       = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setForm(await workspaceApi.getWorkspaceInfo()); }
    catch { setError('Failed to load workspace info.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await workspaceApi.updateWorkspaceInfo(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  if (loading) return <SectionLoader />;
  if (error || !form) return <SectionError message={error ?? 'Unknown error'} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Workspace identity</h2>
        <div className="flex items-start gap-6 mb-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold">
              {form.workspaceName[0]?.toUpperCase() ?? 'W'}
            </div>
            <button className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              <Upload size={12} /> Upload logo
            </button>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace name</label>
              <input
                value={form.workspaceName}
                onChange={e => setForm({ ...form, workspaceName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace ID</label>
              <div className="flex items-center gap-2">
                <input readOnly value={form.workspaceId} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
                <button onClick={() => navigator.clipboard.writeText(form.workspaceId)} className="p-2 hover:bg-gray-100 rounded-lg" title="Copy">
                  <Copy size={16} className="text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Used for API integrations. Cannot be changed.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Localization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['UTC-12', 'UTC-8 (PST)', 'UTC-5 (EST)', 'UTC+0 (GMT)', 'UTC+1 (CET)', 'UTC+5:30 (IST)', 'UTC+8 (SGT)', 'UTC+9 (JST)'].map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Chinese', 'Japanese'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date format</label>
            <select value={form.dateFormat} onChange={e => setForm({ ...form, dateFormat: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60 ${saved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          {saved ? <><Check size={16} /> Saved</> : saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><Save size={16} /> Save changes</>}
        </button>
      </div>
    </div>
  );
};
