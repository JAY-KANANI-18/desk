import { useState, useEffect } from "react";
import { Save, Check } from "@/components/ui/icons";
import { SectionError } from "../components/SectionError";
import { workspaceApi } from "../../../lib/workspaceApi";
import { useWorkspace, Workspace } from "../../../context/WorkspaceContext";
import { DataLoader } from "../../Loader";
import { Button } from "../../../components/ui/Button";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { CopyInput } from "../../../components/ui/inputs/CopyInput";
import { BaseSelect } from "../../../components/ui/select/BaseSelect";
import type { SelectOption } from "../../../components/ui/select/shared";

const timezoneOptions: SelectOption[] = [
  "UTC-12",
  "UTC-8 (PST)",
  "UTC-5 (EST)",
  "UTC+0 (GMT)",
  "UTC+1 (CET)",
  "UTC+5:30 (IST)",
  "UTC+8 (SGT)",
  "UTC+9 (JST)",
].map((timezone) => ({ value: timezone, label: timezone }));

export const WorkspaceGeneralInfo = () => {
  const { activeWorkspace } = useWorkspace();

  const [form, setForm] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      setForm(activeWorkspace);
      setLoading(false);
    }
  }, [activeWorkspace]);

  const handleSave = async () => {
    if (!form) return;

    setSaving(true);

    try {
      await workspaceApi.update(String(activeWorkspace?.id), {
        name: form.name,
        logoUrl: form.logo,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DataLoader type={"workspace"} />;

  if (error || !form)
    return <SectionError message={error ?? "Unknown error"} />;

  return (
    <div className="settings-page-stack">
      <section className="settings-data-header">
        <div className="settings-page-intro">
          <p className="settings-page-intro__copy">
            Update your workspace identity and regional defaults.
          </p>
          <div className="settings-page-actions">
            <Button
              onClick={handleSave}
              loading={saving}
              loadingMode="inline"
              loadingLabel="Saving..."
              variant={saved ? "success" : "primary"}
              leftIcon={saved ? <Check size={16} /> : <Save size={16} />}
            >
              {saved ? "Saved" : "Save changes"}
            </Button>
          </div>
        </div>
      </section>

      <section className="settings-section-panel">
        <div className="space-y-4">
          <BaseInput
            label="Workspace name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <CopyInput label="Workspace ID" value={form.id} />
        </div>
      </section>

      <section className="settings-section-panel">
        <h2 className="settings-section-title mb-5">Localization</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseSelect
            label="Timezone"
            value={form.timezone}
            onChange={(v) => setForm({ ...form, timezone: v })}
            options={timezoneOptions}
          />
        </div>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
