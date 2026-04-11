import { useState, useEffect, useCallback } from 'react';
import { Wand2 } from 'lucide-react';
import { Toggle } from '../components/Toggle';

import { SectionError } from '../components/SectionError';
import type { AISettings, AIPrompt } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';
import { DataLoader } from '../../Loader';

export const AIAssist = () => {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [assistPrompt, setAssistPrompt] = useState<AIPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPrompt, setSavingPrompt] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsResult, promptResult] = await Promise.all([
        workspaceApi.getAISettings(),
        workspaceApi.getAIAssistPrompt(),
      ]);
      setSettings(settingsResult);
      setAssistPrompt(promptResult);
    } catch {
      setError('Failed to load AI assist settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSettingsChange = async (patch: Partial<AISettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...patch };
    setSettings(updated);
    try {
      await workspaceApi.updateAISettings(updated);
    } catch {
      void load();
    }
  };

  const handlePromptSave = async () => {
    if (!assistPrompt) return;
    setSavingPrompt(true);
    try {
      const updated = await workspaceApi.updateAIAssistPrompt({
        prompt: assistPrompt.prompt,
      });
      setAssistPrompt(updated);
    } catch {
      setError('Failed to save AI assist prompt.');
    } finally {
      setSavingPrompt(false);
    }
  };

  if (loading) return <DataLoader type={'AI details'} />;
  if (error || !settings || !assistPrompt) return <SectionError message={error ?? 'Unknown error'} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Wand2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">AI Assist</h2>
              <p className="text-xs text-gray-500">
                Configure the one prompt used by the `AI Assist` button in the inbox composer.
              </p>
            </div>
          </div>
          <Toggle checked={settings.enabled} onChange={v => handleSettingsChange({ enabled: v })} />
        </div>

        <div className="rounded-xl border border-gray-200 p-5">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-900">AI Assist Prompt</p>
            <p className="text-xs text-gray-500">
              This prompt is used only for the AI Assist reply action. Summary prompt is internal and not user-editable.
            </p>
          </div>
          <textarea
            value={assistPrompt.prompt}
            onChange={(e) => setAssistPrompt({ ...assistPrompt, prompt: e.target.value })}
            rows={6}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="You will be a seasoned customer support agent..."
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handlePromptSave}
              disabled={savingPrompt}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingPrompt ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
