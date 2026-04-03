import { useState, useEffect, useCallback } from 'react';
import { Phone, Save, Check } from 'lucide-react';
import { Toggle } from '../components/Toggle';

import { SectionError } from '../components/SectionError';
import type { CallSettings } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';

export const Calls = () => {
  const [settings, setSettings] = useState<CallSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSettings(await workspaceApi.getCallSettings()); }
    catch { setError('Failed to load call settings.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true); setError(null);
    try {
      await workspaceApi.updateCallSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError('Failed to save call settings.'); }
    finally { setSaving(false); }
  };

  if (loading) return <DataLoader type={"call settings"} />;
  if (error || !settings) return <SectionError message={error ?? 'Unknown error'} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Phone size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Voice calls</h2>
              <p className="text-xs text-gray-500">VoIP calling via your connected number</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">New</span>
            <Toggle checked={settings.enabled} onChange={v => setSettings({ ...settings, enabled: v })} />
          </div>
        </div>

        {settings.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caller ID number</label>
              <input value={settings.callerId} onChange={e => setSettings({ ...settings, callerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max call duration (minutes)</label>
              <input type="number" value={settings.maxDuration} onChange={e => setSettings({ ...settings, maxDuration: e.target.value })} min="5" max="240" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        )}
      </div>

      {settings.enabled && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Call features</h2>
            <div className="space-y-4">
              {([
                { key: 'recording',     label: 'Call recording',    desc: 'Record all calls for quality assurance. Customers will be notified.' },
                { key: 'transcription', label: 'Auto-transcription', desc: 'Automatically transcribe call recordings to text'                    },
                { key: 'voicemail',     label: 'Voicemail',         desc: 'Allow callers to leave a voicemail when no agent is available'        },
                { key: 'holdMusic',     label: 'Hold music',        desc: 'Play music when customers are placed on hold'                         },
              ] as { key: keyof CallSettings; label: string; desc: string }[]).map(item => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Toggle checked={settings[item.key] as boolean} onChange={v => setSettings({ ...settings, [item.key]: v })} />
                </div>
              ))}
            </div>
          </div>

          {settings.voicemail && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Voicemail greeting</h2>
              <textarea
                value={settings.voicemailGreeting}
                onChange={e => setSettings({ ...settings, voicemailGreeting: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">This text will be converted to speech using text-to-speech.</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Call stats this month</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total calls',  value: '342'    },
                { label: 'Avg duration', value: '4m 12s' },
                { label: 'Missed calls', value: '28'     },
                { label: 'Voicemails',   value: '15'     },
              ].map(stat => (
                <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
