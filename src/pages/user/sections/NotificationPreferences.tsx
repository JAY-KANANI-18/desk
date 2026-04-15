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
  const {
    browserPermission,
    pushSupported,
    pushRegistrationStatus,
    pushDevices,
    pushError,
    enableBackgroundPush,
    disableBackgroundPush,
    refreshPushDevices,
    removePushDevice,
  } = useNotifications();
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
        <h2 className="text-base font-semibold text-gray-900">Background push notifications</h2>
        <p className="text-sm text-gray-500 mt-2">
          Enable Web Push so Axodesk can notify you even when the app is fully closed. On iPhone and iPad, background push requires installing the app to the Home Screen first.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {!pushSupported
              ? "Push unsupported"
              : browserPermission === "granted" && pushRegistrationStatus === "registered"
                ? "Active on this device"
                : browserPermission === "granted" && pushRegistrationStatus === "registering"
                  ? "Registering"
                  : browserPermission === "granted"
                    ? "Permission granted"
                    : browserPermission === "denied"
                      ? "Blocked by browser"
                      : "Permission not granted"}
          </span>
          {pushSupported && browserPermission !== "granted" && (
            <button
              type="button"
              onClick={() => void enableBackgroundPush()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Enable background push
            </button>
          )}
          {pushSupported && browserPermission === "granted" && (
            <button
              type="button"
              onClick={() =>
                void (pushRegistrationStatus === "registered"
                  ? disableBackgroundPush()
                  : enableBackgroundPush())
              }
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                pushRegistrationStatus === "registered"
                  ? "border border-gray-200 text-gray-700 hover:bg-gray-50"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {pushRegistrationStatus === "registered"
                ? "Disable on this device"
                : "Complete setup"}
            </button>
          )}
          <button
            type="button"
            onClick={() => void refreshPushDevices()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh devices
          </button>
        </div>
        {!pushSupported && (
          <p className="text-xs text-amber-600 mt-3">
            This browser does not support the Push API or background service workers required for Web Push delivery.
          </p>
        )}
        {browserPermission === "denied" && (
          <p className="text-xs text-amber-600 mt-3">
            Your browser has blocked notifications. Re-enable them from the site permissions in your browser settings.
          </p>
        )}
        {pushError && (
          <p className="text-xs text-red-500 mt-3">
            {pushError}
          </p>
        )}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Delivery strategy
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Axodesk uses realtime inbox delivery while you have an active session and background push when no live app session is connected. This prevents duplicates for active agents while still covering closed-app delivery.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Registered devices</h2>
            <p className="mt-2 text-sm text-gray-500">
              Review which browsers or installed PWAs can currently receive background notifications for your account.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {pushDevices.length} device{pushDevices.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {pushDevices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
              No push-capable devices are registered yet.
            </div>
          ) : (
            pushDevices.map((device) => {
              const status = device.disabledAt
                ? "Disabled"
                : device.invalidatedAt
                  ? "Invalid endpoint"
                  : device.failureCount > 0 && device.lastFailureAt
                    ? "Needs attention"
                    : "Active";

              const statusClassName = device.disabledAt
                ? "bg-slate-100 text-slate-600"
                : device.invalidatedAt
                  ? "bg-amber-100 text-amber-700"
                  : device.failureCount > 0 && device.lastFailureAt
                    ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700";

              return (
                <div
                  key={device.id}
                  className="rounded-xl border border-slate-200 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {device.deviceName || "Unnamed device"}
                        </p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClassName}`}>
                          {status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                        {device.platform.replace(/-/g, " ")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span>
                          Last seen: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Never"}
                        </span>
                        <span>
                          Last success: {device.lastSuccessfulDeliveryAt ? new Date(device.lastSuccessfulDeliveryAt).toLocaleString() : "None"}
                        </span>
                        <span>Failures: {device.failureCount}</span>
                      </div>
                      {device.disabledReason && (
                        <p className="mt-2 text-xs text-slate-500">
                          Reason: {device.disabledReason}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => void removePushDevice(device.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Remove device
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <RadioGroup title="Sound notifications" value={prefs.soundScope} options={soundOptions} onChange={(value) => setPrefs({ ...prefs, soundScope: value })} />
      <RadioGroup title="Call sound notifications" value={prefs.callSoundScope} options={callSoundOptions} onChange={(value) => setPrefs({ ...prefs, callSoundScope: value })} />
      <RadioGroup title="Desktop notifications" value={prefs.desktopScope} options={channelOptions} onChange={(value) => setPrefs({ ...prefs, desktopScope: value })} />
      <RadioGroup title="Background push notifications" value={prefs.mobileScope} options={channelOptions} onChange={(value) => setPrefs({ ...prefs, mobileScope: value })} />
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
