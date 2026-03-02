import { useState, useEffect, useCallback } from 'react';
import { Wand2 } from 'lucide-react';
import { workspaceApi } from '../api';
import { Toggle } from '../components/Toggle';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { AISettings } from '../types';

export const AIAssist = () => {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSettings(await workspaceApi.getAISettings()); }
    catch { setError('Failed to load AI settings.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = async (patch: Partial<AISettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...patch };
    setSettings(updated);
    try { await workspaceApi.updateAISettings(updated); }
    catch { load(); }
  };

  if (loading) return <SectionLoader />;
  if (error || !settings) return <SectionError message={error ?? 'Unknown error'} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Wand2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">AI Assist</h2>
              <p className="text-xs text-gray-500">Powered by GPT-4</p>
            </div>
          </div>
          <Toggle checked={settings.enabled} onChange={v => handleChange({ enabled: v })} />
        </div>

        {settings.enabled && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response tone</label>
              <div className="grid grid-cols-3 gap-2">
                {['professional', 'friendly', 'formal'].map(tone => (
                  <button key={tone} onClick={() => handleChange({ tone })} className={`px-3 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${settings.tone === tone ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response language</label>
              <select value={settings.language} onChange={e => handleChange({ language: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="auto">Auto-detect (match customer language)</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              {([
                { key: 'autoSuggest', label: 'Auto-suggest replies',  desc: 'Show AI reply suggestions as you type'            },
                { key: 'smartReply',  label: 'Smart reply',           desc: 'One-click AI-generated responses'                 },
                { key: 'summarize',   label: 'Conversation summary',  desc: 'Auto-summarize long conversations'                },
                { key: 'sentiment',   label: 'Sentiment analysis',    desc: 'Detect customer mood and flag negative sentiment' },
                { key: 'translate',   label: 'Auto-translate',        desc: 'Translate incoming messages to your language'     },
              ] as { key: keyof AISettings; label: string; desc: string }[]).map(item => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Toggle checked={settings[item.key] as boolean} onChange={v => handleChange({ [item.key]: v })} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Usage this month</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Suggestions shown', value: '1,243' },
            { label: 'Suggestions used',  value: '876'   },
            { label: 'Acceptance rate',   value: '70.5%' },
          ].map(stat => (
            <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
