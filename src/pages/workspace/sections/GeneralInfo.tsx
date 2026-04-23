import { useState, useEffect, useRef } from "react";
import { Upload, Copy, Save, Check } from "lucide-react";
import { SectionError } from "../components/SectionError";
import { workspaceApi } from "../../../lib/workspaceApi";
import { useWorkspace, Workspace } from "../../../context/WorkspaceContext";
import { DataLoader } from "../../Loader";

export const WorkspaceGeneralInfo = () => {
  const { activeWorkspace } = useWorkspace();

  const [form, setForm] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeWorkspace) {
      setForm(activeWorkspace);
      setLogoPreview(activeWorkspace.logo ?? null);
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

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);

    const formData = new FormData();
    formData.append("logo", file);

    const res = await workspaceApi.uploadLogo(
      String(activeWorkspace?.id),
      formData,
    );

    setForm((prev) => (prev ? { ...prev, logo: res.url } : prev));
  };

  if (loading) return <DataLoader type={"workspace"} />;

  if (error || !form)
    return <SectionError message={error ?? "Unknown error"} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-50/80 p-5 sm:p-6">
        {/* <h2 className="text-base font-semibold text-gray-900 mb-5">
          Workspace identity
        </h2> */}

        <div className="flex items-start gap-6 mb-6">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workspace name
              </label>

              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workspace ID
              </label>

              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={form.id}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                />

                <button
                  onClick={() => navigator.clipboard.writeText(form.id)}
                  className="rounded-lg bg-white/80 p-2 shadow-sm shadow-slate-200/60 transition-colors hover:bg-white"
                  title="Copy"
                >
                  <Copy size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50/80 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          Localization
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Timezone"
            value={form.timezone}
            onChange={(v) => setForm({ ...form, timezone: v })}
            options={[
              "UTC-12",
              "UTC-8 (PST)",
              "UTC-5 (EST)",
              "UTC+0 (GMT)",
              "UTC+1 (CET)",
              "UTC+5:30 (IST)",
              "UTC+8 (SGT)",
              "UTC+9 (JST)",
            ]}
          />

          {/* <Select
            label="Language"
            value={form.language}
            onChange={(v) => setForm({ ...form, language: v })}
            options={[
              "English",
              "Spanish",
              "French",
              "German",
              "Portuguese",
              "Arabic",
              "Chinese",
              "Japanese",
            ]}
          />

          <Select
            label="Date format"
            value={form.dateFormat}
            onChange={(v) => setForm({ ...form, dateFormat: v })}
            options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]}
          /> */}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60 ${saved ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
        >
          {saved ? (
            <>
              <Check size={16} /> Saved
            </>
          ) : saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
              Saving…
            </>
          ) : (
            <>
              <Save size={16} /> Save changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const Select = ({ label, value, options, onChange }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>

    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((o: string) => (
          <option key={o}>{o}</option>
        ))}
      </select>

      <svg
        className="w-4 h-4 absolute right-2 top-3 text-gray-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  </div>
);
