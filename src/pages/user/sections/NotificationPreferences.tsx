import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { workspaceApi } from "../../../lib/workspaceApi";
import { useNotifications } from "../../../context/NotificationContext";

type SoundScope = "ASSIGNED_AND_UNASSIGNED" | "ASSIGNED_ONLY" | "NONE";
type CallSoundScope = "ASSIGNED_AND_UNASSIGNED" | "ASSIGNED_ONLY" | "ALL" | "MUTE_ALL";
type ContactScope = "ALL_CONTACTS" | "ASSIGNED_AND_UNASSIGNED" | "ASSIGNED_ONLY" | "MENTIONS_ONLY" | "NONE";

type NotificationPreferenceState = {
  soundScope: SoundScope;
  callSoundScope: CallSoundScope;
  desktopScope: ContactScope;
  mobileScope: ContactScope;
  emailScope: ContactScope;
};

const channelOptions: Array<{ value: ContactScope; label: string; description: string }> = [
  { value: "ALL_CONTACTS", label: "All contacts and mentions", description: "Notify me for all assigned, unassigned, and mention activity." },
  { value: "ASSIGNED_AND_UNASSIGNED", label: "Assigned to me, unassigned, and mentions", description: "Notify me for my contacts, unassigned contacts, and mentions." },
  { value: "ASSIGNED_ONLY", label: "Assigned to me and mentions", description: "Notify me only for contacts assigned to me and mentions." },
  { value: "MENTIONS_ONLY", label: "Mentions only", description: "Only notify me when I am mentioned." },
  { value: "NONE", label: "No notifications", description: "Do not notify me on this channel." },
];

const soundOptions: Array<{ value: SoundScope; label: string; description: string }> = [
  { value: "ASSIGNED_AND_UNASSIGNED", label: "Assigned to me or unassigned", description: "Play sounds for my contacts and unassigned contacts." },
  { value: "ASSIGNED_ONLY", label: "Assigned to me only", description: "Only play sounds for contacts assigned to me." },
  { value: "NONE", label: "Do not play sounds", description: "Mute message sounds in the inbox." },
];

const callSoundOptions: Array<{ value: CallSoundScope; label: string; description: string }> = [
  { value: "ASSIGNED_AND_UNASSIGNED", label: "Assigned to me and unassigned", description: "Play call sounds for my contacts and unassigned contacts." },
  { value: "ASSIGNED_ONLY", label: "Assigned to me only", description: "Only play call sounds for contacts assigned to me." },
  { value: "ALL", label: "All contacts", description: "Play call sounds for all incoming calls." },
  { value: "MUTE_ALL", label: "Mute all", description: "Do not play call sounds." },
];

function RadioGroup<T extends string>({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: T;
  options: Array<{ value: T; label: string; description: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
              value === option.value
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 h-4 w-4 rounded-full border flex-shrink-0 ${
                  value === option.value ? "border-indigo-600 bg-indigo-600" : "border-gray-300 bg-white"
                }`}
              >
                {value === option.value && <span className="block h-full w-full rounded-full border-2 border-white" />}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export const NotificationPreferences = () => {
  const { browserPermission, requestBrowserPermission } = useNotifications();
  const [prefs, setPrefs] = useState<NotificationPreferenceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await workspaceApi.getNotificationPrefs();
      setPrefs(result);
    } catch {
      setError("Failed to load notification preferences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => !!prefs, [prefs]);

  const save = useCallback(async () => {
    if (!prefs) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await workspaceApi.updateNotificationPrefs(prefs);
      setPrefs(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save notification preferences.");
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
        Loading notification preferences...
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 text-sm text-red-500">
        {error ?? "Notification preferences are unavailable."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900">Browser notifications</h2>
        <p className="text-sm text-gray-500 mt-2">
          Allow desktop notifications in this browser so new notifications can appear even when the app tab is not focused.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {browserPermission === "unsupported"
              ? "Not supported"
              : browserPermission === "granted"
                ? "Allowed"
                : browserPermission === "denied"
                  ? "Blocked"
                  : "Not requested"}
          </span>
          {browserPermission !== "granted" && browserPermission !== "unsupported" && (
            <button
              type="button"
              onClick={() => void requestBrowserPermission()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Enable browser notifications
            </button>
          )}
        </div>
        {browserPermission === "denied" && (
          <p className="text-xs text-amber-600 mt-3">
            Your browser has blocked notifications. Re-enable them from the site permissions in your browser settings.
          </p>
        )}
      </div>

      <RadioGroup title="Sound notifications" value={prefs.soundScope} options={soundOptions} onChange={(value) => setPrefs({ ...prefs, soundScope: value })} />
      <RadioGroup title="Call sound notifications" value={prefs.callSoundScope} options={callSoundOptions} onChange={(value) => setPrefs({ ...prefs, callSoundScope: value })} />
      <RadioGroup title="Desktop notifications" value={prefs.desktopScope} options={channelOptions} onChange={(value) => setPrefs({ ...prefs, desktopScope: value })} />
      <RadioGroup title="Mobile push notifications" value={prefs.mobileScope} options={channelOptions} onChange={(value) => setPrefs({ ...prefs, mobileScope: value })} />
      <RadioGroup title="Email notifications" value={prefs.emailScope} options={channelOptions} onChange={(value) => setPrefs({ ...prefs, emailScope: value })} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
            saved ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};
