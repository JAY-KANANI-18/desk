import { useState, useEffect, useCallback } from 'react';
import { Wand2 } from 'lucide-react';

import { SectionError } from '../components/SectionError';
import type { AISettings, AIPrompt } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';
import { DataLoader } from '../../Loader';
import { Button } from '../../../components/ui/Button';
import { TextareaInput } from '../../../components/ui/inputs/TextareaInput';
import { ToggleSwitch } from '../../../components/ui/toggle/ToggleSwitch';
import { useIsMobile } from '../../../hooks/useIsMobile';

export const AIAssist = () => {
  const isMobile = useIsMobile();
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
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl bg-slate-50/80 p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 sm:h-10 sm:w-10">
              <Wand2 size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">AI Assist</h2>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Configure the one prompt used by the `AI Assist` button in the inbox composer.
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto">
            <ToggleSwitch
              checked={settings.enabled}
              onChange={v => handleSettingsChange({ enabled: v })}
              aria-label={settings.enabled ? 'Disable AI assist' : 'Enable AI assist'}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-4 sm:p-5">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-900">AI Assist Prompt</p>
            <p className="mt-1 text-sm leading-5 text-gray-500">
              This prompt is used only for the AI Assist reply action. Summary prompt is internal and not user-editable.
            </p>
          </div>
          <TextareaInput
            value={assistPrompt.prompt}
            onChange={(e) => setAssistPrompt({ ...assistPrompt, prompt: e.target.value })}
            rows={6}
            placeholder="You will be a seasoned customer support agent..."
          />
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={handlePromptSave}
              loading={savingPrompt}
              loadingMode="inline"
              loadingLabel="Saving..."
              fullWidth={isMobile}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
