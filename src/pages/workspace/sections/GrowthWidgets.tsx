import { useState, useEffect, useCallback } from 'react';
import { Save, Check, Copy } from 'lucide-react';
import {  MOCK_DATA } from '../api';
import { Toggle } from '../components/Toggle';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { WidgetConfig } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';

export const GrowthWidgets = () => {
  const [config, setConfig]   = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [copied, setCopied]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setConfig(await workspaceApi.getWidgetConfig()); }
    catch { setError('Failed to load widget config.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true); setError(null);
    try {
      await workspaceApi.updateWidgetConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError('Failed to save widget config.'); }
    finally { setSaving(false); }
  };

  if (loading) return <SectionLoader />;
  if (error || !config) return <SectionError message={error ?? 'Unknown error'} onRetry={load} />;

  const embedCode = `<script>
  window.MeeraWidget = {
    workspaceId: "${MOCK_DATA.workspaceInfo.id}",
    color: "${config.color}",
    position: "${config.position}",
    greeting: "${config.greeting}"
  };
</script>
<script src="https://cdn.meera.io/widget.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Widget appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.color} onChange={e => setConfig({ ...config, color: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input value={config.color} onChange={e => setConfig({ ...config, color: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  {['bottom-right', 'bottom-left', 'top-right', 'top-left'].map(pos => (
                    <button key={pos} onClick={() => setConfig({ ...config, position: pos })} className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${config.position === pos ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                      {pos.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Greeting message</label>
                <textarea value={config.greeting} onChange={e => setConfig({ ...config, greeting: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Show on mobile</p>
                    <p className="text-xs text-gray-400">Display widget on mobile devices</p>
                  </div>
                  <Toggle checked={config.showOnMobile} onChange={v => setConfig({ ...config, showOnMobile: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Auto-open</p>
                    <p className="text-xs text-gray-400">Automatically open after delay</p>
                  </div>
                  <Toggle checked={config.autoOpen} onChange={v => setConfig({ ...config, autoOpen: v })} />
                </div>
                {config.autoOpen && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Open delay (seconds)</label>
                    <input type="number" value={config.delay} onChange={e => setConfig({ ...config, delay: e.target.value })} min="0" max="60" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                )}
              </div>
            </div>
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            <div className="flex justify-end mt-4">
              <button onClick={handleSave} disabled={saving} className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60 ${saved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                {saved ? <><Check size={16} /> Saved</> : saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><Save size={16} /> Save</>}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Preview</h2>
            <div className="bg-gray-100 rounded-xl h-64 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Website preview</div>
              <div className={`absolute ${config.position.includes('bottom') ? 'bottom-4' : 'top-4'} ${config.position.includes('right') ? 'right-4' : 'left-4'}`}>
                <div className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white text-xl" style={{ backgroundColor: config.color }}>💬</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Embed code</h2>
              <button onClick={handleCopy} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">{embedCode}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
