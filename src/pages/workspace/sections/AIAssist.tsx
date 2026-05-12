import { useState, useEffect, useCallback } from 'react';
import { Wand2 } from '@/components/ui/icons';

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
      await workspaceApi.updateAISettings(patch);
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
    <div className="settings-page-stack">
      <section className="settings-data-header">
        <div className="settings-page-intro">
          <p className="settings-page-intro__copy">
            Choose how AI helps your team write better replies in the inbox.
          </p>
        </div>
      </section>

      <section className={`settings-row-card ${settings.enabled ? 'settings-row-card--active' : ''}`}>
        <div className="settings-control-card__body flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="settings-control-card__content flex min-w-0 items-start gap-3">
            <div className="settings-section-icon">
              <Wand2 size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="settings-section-title">Enable AI Assist</h2>
              <p className="settings-section-description settings-control-card__description">
                Show an AI Assist option while your team writes replies.
              </p>
            </div>
          </div>
          <div className="settings-toggle-pill">
            <span className="settings-toggle-pill__label">{settings.enabled ? 'On' : 'Off'}</span>
            <ToggleSwitch
              checked={settings.enabled}
              onChange={v => handleSettingsChange({ enabled: v })}
              aria-label={settings.enabled ? 'Disable AI assist' : 'Enable AI assist'}
            />
          </div>
        </div>
      </section>

      <section className="settings-section-panel">
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900">AI Assist Prompt</p>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            Tell AI how it should write replies for your team.
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
      </section>
    </div>
  );
};
