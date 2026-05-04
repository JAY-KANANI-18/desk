import { useCallback, useEffect, useState } from "react";
import { Check, Phone, Save } from "@/components/ui/icons";
import { Button } from "../../../components/ui/Button";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { TextareaInput } from "../../../components/ui/inputs/TextareaInput";
import { Tag } from "../../../components/ui/Tag";
import { ToggleSwitch } from "../../../components/ui/toggle/ToggleSwitch";
import { workspaceApi } from "../../../lib/workspaceApi";
import { DataLoader } from "../../Loader";
import { SectionError } from "../components/SectionError";
import type { CallSettings } from "../types";

const CALL_FEATURES: Array<{
  key: keyof Pick<
    CallSettings,
    "recording" | "transcription" | "voicemail" | "holdMusic"
  >;
  label: string;
  desc: string;
}> = [
  {
    key: "recording",
    label: "Call recording",
    desc: "Record all calls for quality assurance. Customers will be notified.",
  },
  {
    key: "transcription",
    label: "Auto-transcription",
    desc: "Automatically transcribe call recordings to text",
  },
  {
    key: "voicemail",
    label: "Voicemail",
    desc: "Allow callers to leave a voicemail when no agent is available",
  },
  {
    key: "holdMusic",
    label: "Hold music",
    desc: "Play music when customers are placed on hold",
  },
];

const CALL_STATS = [
  { label: "Total calls", value: "342" },
  { label: "Avg duration", value: "4m 12s" },
  { label: "Missed calls", value: "28" },
  { label: "Voicemails", value: "15" },
];

export const Calls = () => {
  const [settings, setSettings] = useState<CallSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await workspaceApi.getCallSettings());
    } catch {
      setError("Failed to load call settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    try {
      await workspaceApi.updateCallSettings(settings);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save call settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DataLoader type="call settings" />;
  if (error || !settings) {
    return <SectionError message={error ?? "Unknown error"} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Phone size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Voice calls</h2>
              <p className="text-xs text-gray-500">VoIP calling via your connected number</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tag label="New" size="sm" bgColor="warning" />
            <ToggleSwitch
              checked={settings.enabled}
              onChange={(enabled) => setSettings({ ...settings, enabled })}
              aria-label="Enable voice calls"
            />
          </div>
        </div>

        {settings.enabled ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BaseInput
              label="Caller ID number"
              value={settings.callerId}
              onChange={(event) =>
                setSettings({ ...settings, callerId: event.target.value })
              }
            />
            <BaseInput
              label="Max call duration (minutes)"
              type="number"
              value={settings.maxDuration}
              min="5"
              max="240"
              onChange={(event) =>
                setSettings({ ...settings, maxDuration: event.target.value })
              }
            />
          </div>
        ) : null}
      </div>

      {settings.enabled ? (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Call features</h2>
            <div className="space-y-4">
              {CALL_FEATURES.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <ToggleSwitch
                    checked={settings[item.key]}
                    onChange={(value) =>
                      setSettings({ ...settings, [item.key]: value })
                    }
                    aria-label={`Enable ${item.label}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {settings.voicemail ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <TextareaInput
                label="Voicemail greeting"
                value={settings.voicemailGreeting}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    voicemailGreeting: event.target.value,
                  })
                }
                rows={3}
                hint="This text will be converted to speech using text-to-speech."
              />
            </div>
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Call stats this month</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {CALL_STATS.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          loading={saving}
          loadingMode="inline"
          variant={saved ? "success" : "primary"}
          leftIcon={saved ? <Check size={16} /> : <Save size={16} />}
        >
          {saved ? "Saved" : saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
};
