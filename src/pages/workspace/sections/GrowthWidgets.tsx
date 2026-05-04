import { useCallback, useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Save } from "@/components/ui/icons";
import { MOCK_DATA } from "../api";
import { Button } from "../../../components/ui/Button";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { ColorInput } from "../../../components/ui/inputs/ColorInput";
import { TextareaInput } from "../../../components/ui/inputs/TextareaInput";
import { ToggleSwitch } from "../../../components/ui/toggle/ToggleSwitch";
import { workspaceApi } from "../../../lib/workspaceApi";
import { DataLoader } from "../../Loader";
import { SectionError } from "../components/SectionError";
import type { WidgetConfig } from "../types";

const WIDGET_POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left"];

export const GrowthWidgets = () => {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setConfig(await workspaceApi.getWidgetConfig());
    } catch {
      setError("Failed to load widget config.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    setError(null);
    try {
      await workspaceApi.updateWidgetConfig(config);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save widget config.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DataLoader type="widget" />;
  if (error || !config) {
    return <SectionError message={error ?? "Unknown error"} onRetry={load} />;
  }

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
    void navigator.clipboard.writeText(embedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Widget appearance</h2>
            <div className="space-y-4">
              <ColorInput
                label="Brand color"
                value={config.color}
                onChange={(color) => setConfig({ ...config, color })}
                className="font-mono"
              />

              <div>
                <p className="mb-1 text-sm font-medium text-gray-700">Position</p>
                <div className="grid grid-cols-2 gap-2">
                  {WIDGET_POSITIONS.map((position) => (
                    <Button
                      key={position}
                      onClick={() => setConfig({ ...config, position })}
                      variant={config.position === position ? "soft-primary" : "secondary"}
                      selected={config.position === position}
                      size="sm"
                      fullWidth
                    >
                      {position.replace("-", " ")}
                    </Button>
                  ))}
                </div>
              </div>

              <TextareaInput
                label="Greeting message"
                value={config.greeting}
                onChange={(event) => setConfig({ ...config, greeting: event.target.value })}
                rows={2}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Show on mobile</p>
                    <p className="text-xs text-gray-400">Display widget on mobile devices</p>
                  </div>
                  <ToggleSwitch
                    checked={config.showOnMobile}
                    onChange={(showOnMobile) => setConfig({ ...config, showOnMobile })}
                    aria-label="Show widget on mobile"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Auto-open</p>
                    <p className="text-xs text-gray-400">Automatically open after delay</p>
                  </div>
                  <ToggleSwitch
                    checked={config.autoOpen}
                    onChange={(autoOpen) => setConfig({ ...config, autoOpen })}
                    aria-label="Auto-open widget"
                  />
                </div>
                {config.autoOpen ? (
                  <div className="w-28">
                    <BaseInput
                      label="Open delay (seconds)"
                      type="number"
                      value={config.delay}
                      min="0"
                      max="60"
                      onChange={(event) => setConfig({ ...config, delay: event.target.value })}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                loading={saving}
                loadingMode="inline"
                variant={saved ? "success" : "primary"}
                leftIcon={saved ? <Check size={16} /> : <Save size={16} />}
              >
                {saved ? "Saved" : saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Preview</h2>
            <div className="relative h-64 overflow-hidden rounded-xl bg-gray-100">
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                Website preview
              </div>
              <div
                className={`absolute ${config.position.includes("bottom") ? "bottom-4" : "top-4"} ${
                  config.position.includes("right") ? "right-4" : "left-4"
                }`}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg"
                  style={{ backgroundColor: config.color }}
                >
                  <MessageCircle size={22} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">Embed code</h2>
              <Button
                onClick={handleCopy}
                variant={copied ? "success" : "soft"}
                size="xs"
                leftIcon={copied ? <Check size={13} /> : <Copy size={13} />}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-xs leading-relaxed text-green-400">
              {embedCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
