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
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-50/80 p-5 sm:p-6">
        <div className="flex items-start gap-6 mb-6">
          <div className="flex-1 space-y-4">
            <BaseInput
              label="Workspace name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <CopyInput label="Workspace ID" value={form.id} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50/80 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          Localization
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseSelect
            label="Timezone"
            value={form.timezone}
            onChange={(v) => setForm({ ...form, timezone: v })}
            options={timezoneOptions}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end">
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
  );
};
