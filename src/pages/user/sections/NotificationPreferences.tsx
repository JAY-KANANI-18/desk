import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Save } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { useNotifications } from "../../../context/NotificationContext";
import { workspaceApi } from "../../../lib/workspaceApi";

type SoundScope = "ASSIGNED_AND_UNASSIGNED" | "ASSIGNED_ONLY" | "NONE";
type CallSoundScope =
  | "ASSIGNED_AND_UNASSIGNED"
  | "ASSIGNED_ONLY"
  | "ALL"
  | "MUTE_ALL";
type ContactScope =
  | "ALL_CONTACTS"
  | "ASSIGNED_AND_UNASSIGNED"
  | "ASSIGNED_ONLY"
  | "MENTIONS_ONLY"
  | "NONE";

type NotificationPreferenceState = {
  soundScope: SoundScope;
  callSoundScope: CallSoundScope;
  desktopScope: ContactScope;
  mobileScope: ContactScope;
  emailScope: ContactScope;
};

type PreferenceOption<T extends string> = {
  value: T;
  label: string;
  description: string;
};

const channelOptions: PreferenceOption<ContactScope>[] = [
  {
    value: "ALL_CONTACTS",
    label: "All activity",
    description:
      "Notify me for all assigned, unassigned, and mention activity.",
  },
  {
    value: "ASSIGNED_AND_UNASSIGNED",
    label: "Mine + unassigned",
    description:
      "Notify me for my contacts, unassigned contacts, and mentions.",
  },
  {
    value: "ASSIGNED_ONLY",
    label: "Only mine",
    description: "Notify me only for contacts assigned to me and mentions.",
  },
  {
    value: "MENTIONS_ONLY",
    label: "Mentions only",
    description: "Only notify me when I am mentioned.",
  },
  {
    value: "NONE",
    label: "Off",
    description: "Do not notify me on this channel.",
  },
];

const soundOptions: PreferenceOption<SoundScope>[] = [
  {
    value: "ASSIGNED_AND_UNASSIGNED",
    label: "Mine + unassigned",
    description: "Play sounds for my contacts and unassigned contacts.",
  },
  {
    value: "ASSIGNED_ONLY",
    label: "Only mine",
    description: "Only play sounds for contacts assigned to me.",
  },
  {
    value: "NONE",
    label: "Off",
    description: "Mute message sounds in the inbox.",
  },
];

const callSoundOptions: PreferenceOption<CallSoundScope>[] = [
  {
    value: "ASSIGNED_AND_UNASSIGNED",
    label: "Mine + unassigned",
    description: "Play call sounds for my contacts and unassigned contacts.",
  },
  {
    value: "ASSIGNED_ONLY",
    label: "Only mine",
    description: "Only play call sounds for contacts assigned to me.",
  },
  {
    value: "ALL",
    label: "All calls",
    description: "Play call sounds for all incoming calls.",
  },
  {
    value: "MUTE_ALL",
    label: "Mute all",
    description: "Do not play call sounds.",
  },
];

function PreferenceSelectRow<T extends string>({
  title,
  description,
  value,
  options,
  onChange,
}: {
  title: string;
  description: string;
  value: T;
  options: PreferenceOption<T>[];
  onChange: (value: T) => void;
}) {
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="grid gap-4 rounded-2xl bg-slate-50/80 p-4 md:grid-cols-[minmax(0,1fr)_280px] md:items-start">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <Select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        options={options.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        helperText={selectedOption.description}
      />
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
  const [savedPrefs, setSavedPrefs] =
    useState<NotificationPreferenceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevices, setShowDevices] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await workspaceApi.getNotificationPrefs();
      setPrefs(result);
      setSavedPrefs(result);
    } catch {
      setError("Failed to load notification preferences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!prefs || !savedPrefs) return false;
    return JSON.stringify(prefs) !== JSON.stringify(savedPrefs);
  }, [prefs, savedPrefs]);

  const save = useCallback(async () => {
    if (!prefs) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await workspaceApi.updateNotificationPrefs(prefs);
      setPrefs(updated);
      setSavedPrefs(updated);
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
      <div className="rounded-2xl bg-slate-50/80 p-6 text-sm text-gray-500">
        Loading notification preferences...
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-sm text-red-500">
        {error ?? "Notification preferences are unavailable."}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-slate-50/80 p-5 sm:p-6">
        <h1 className="text-lg font-semibold text-slate-900">Notifications</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Keep only the alerts you need. Pick one simple option for each
          channel.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50/80 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Alert preferences
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              These settings control where and when Axodesk should notify you.
            </p>
          </div>
          {dirty && (
            <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <PreferenceSelectRow
            title="Message sounds"
            description="Play a sound when a new message needs your attention."
            value={prefs.soundScope}
            options={soundOptions}
            onChange={(value) => setPrefs({ ...prefs, soundScope: value })}
          />
          <PreferenceSelectRow
            title="Call sounds"
            description="Choose when incoming calls should ring."
            value={prefs.callSoundScope}
            options={callSoundOptions}
            onChange={(value) => setPrefs({ ...prefs, callSoundScope: value })}
          />
          <PreferenceSelectRow
            title="Desktop alerts"
            description="Show notifications while you are working on this device."
            value={prefs.desktopScope}
            options={channelOptions}
            onChange={(value) => setPrefs({ ...prefs, desktopScope: value })}
          />
          <PreferenceSelectRow
            title="Background push"
            description="Use this for alerts when Axodesk is closed or not active on screen."
            value={prefs.mobileScope}
            options={channelOptions}
            onChange={(value) => setPrefs({ ...prefs, mobileScope: value })}
          />
          <PreferenceSelectRow
            title="Email updates"
            description="Receive notification emails for the activity you care about."
            value={prefs.emailScope}
            options={channelOptions}
            onChange={(value) => setPrefs({ ...prefs, emailScope: value })}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50/80 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Browser push setup
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Turn this on if you want alerts even when Axodesk is fully
              closed.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {!pushSupported
              ? "Unsupported"
              : browserPermission === "granted" &&
                  pushRegistrationStatus === "registered"
                ? "Active on this device"
                : browserPermission === "granted" &&
                    pushRegistrationStatus === "registering"
                  ? "Setting up"
                  : browserPermission === "granted"
                    ? "Permission granted"
                    : browserPermission === "denied"
                      ? "Blocked"
                      : "Not enabled"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {pushSupported && browserPermission !== "granted" && (
            <Button onClick={() => void enableBackgroundPush()}>
              Enable browser push
            </Button>
          )}
          {pushSupported && browserPermission === "granted" && (
            <Button
              variant={
                pushRegistrationStatus === "registered" ? "secondary" : "primary"
              }
              onClick={() =>
                void (pushRegistrationStatus === "registered"
                  ? disableBackgroundPush()
                  : enableBackgroundPush())
              }
            >
              {pushRegistrationStatus === "registered"
                ? "Disable on this device"
                : "Finish setup"}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => void refreshPushDevices()}
          >
            Refresh devices
          </Button>
        </div>

        {!pushSupported && (
          <p className="mt-3 text-xs text-amber-600">
            This browser does not support the background push features needed
            for web notifications.
          </p>
        )}
        {browserPermission === "denied" && (
          <p className="mt-3 text-xs text-amber-600">
            Your browser has blocked notifications. Re-enable them from your
            site permissions.
          </p>
        )}
        {pushError && <p className="mt-3 text-xs text-red-500">{pushError}</p>}

        <div className="mt-5 rounded-2xl bg-white/65 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Registered devices
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Advanced: review browsers or installed apps that can receive
                background push for your account.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowDevices((current) => !current)}
            >
              {showDevices ? "Hide devices" : `Show devices (${pushDevices.length})`}
            </Button>
          </div>

          {showDevices && (
            <div className="mt-4 space-y-3">
              {pushDevices.length === 0 ? (
                <div className="rounded-xl bg-white px-4 py-5 text-sm text-slate-500">
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
                      className="rounded-xl bg-white px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {device.deviceName || "Unnamed device"}
                            </p>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClassName}`}
                            >
                              {status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                            {device.platform.replace(/-/g, " ")}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                            <span>
                              Last seen:{" "}
                              {device.lastSeenAt
                                ? new Date(device.lastSeenAt).toLocaleString()
                                : "Never"}
                            </span>
                            <span>
                              Last success:{" "}
                              {device.lastSuccessfulDeliveryAt
                                ? new Date(
                                    device.lastSuccessfulDeliveryAt,
                                  ).toLocaleString()
                                : "None"}
                            </span>
                            <span>Failures: {device.failureCount}</span>
                          </div>
                          {device.disabledReason && (
                            <p className="mt-2 text-xs text-slate-500">
                              Reason: {device.disabledReason}
                            </p>
                          )}
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void removePushDevice(device.id)}
                        >
                          Remove device
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={save}
          disabled={!dirty || saving}
          loading={saving}
          leftIcon={
            saving ? undefined : saved ? <Check size={16} /> : <Save size={16} />
          }
          variant={saved ? "success" : "primary"}
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </Button>

        <Button
          variant="secondary"
          onClick={() => savedPrefs && setPrefs({ ...savedPrefs })}
          disabled={!dirty || saving || !savedPrefs}
        >
          Reset
        </Button>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};
