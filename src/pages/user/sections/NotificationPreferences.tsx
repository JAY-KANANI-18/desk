import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  Bell,
  Mail,
  MonitorSmartphone,
  PhoneCall,
  Volume2,
} from "@/components/ui/icons";
import { Button } from "../../../components/ui/button";
import { BaseSelect } from "../../../components/ui/select";
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

type PreferenceModeId = "focused" | "mine" | "quiet" | "custom";

type PreferencePreset = {
  id: Exclude<PreferenceModeId, "custom">;
  title: string;
  value: NotificationPreferenceState;
};

interface PreferenceSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

interface PreferenceSelectRowProps<T extends string> {
  title: string;
  description: string;
  value: T;
  options: PreferenceOption<T>[];
  leading: ReactNode;
  onChange: (value: T) => void;
}

const contactOptions: PreferenceOption<ContactScope>[] = [
  {
    value: "ASSIGNED_AND_UNASSIGNED",
    label: "My chats + waiting chats",
    description: "Assigned to me, waiting for owner, or tagged.",
  },
  {
    value: "ASSIGNED_ONLY",
    label: "Chats assigned to me",
    description: "Assigned to me or tagged.",
  },
  {
    value: "MENTIONS_ONLY",
    label: "Only when someone tags me",
    description: "Only direct team tags.",
  },
  {
    value: "ALL_CONTACTS",
    label: "Every customer chat",
    description: "All customer activity.",
  },
  {
    value: "NONE",
    label: "Off",
    description: "Do not send alerts here.",
  },
];

const soundOptions: PreferenceOption<SoundScope>[] = [
  {
    value: "ASSIGNED_AND_UNASSIGNED",
    label: "My chats + waiting chats",
    description: "My chats, waiting chats, or team tags.",
  },
  {
    value: "ASSIGNED_ONLY",
    label: "Chats assigned to me",
    description: "Assigned to me or tagged.",
  },
  {
    value: "NONE",
    label: "Silent",
    description: "Do not play message sounds.",
  },
];

const callSoundOptions: PreferenceOption<CallSoundScope>[] = [
  {
    value: "ASSIGNED_AND_UNASSIGNED",
    label: "My calls + waiting calls",
    description: "My calls and calls waiting for owner.",
  },
  {
    value: "ASSIGNED_ONLY",
    label: "Calls for my chats",
    description: "Only calls linked to my chats.",
  },
  {
    value: "ALL",
    label: "Every incoming call",
    description: "All workspace calls.",
  },
  {
    value: "MUTE_ALL",
    label: "Silent",
    description: "Do not ring for incoming calls.",
  },
];

const notificationPresets: PreferencePreset[] = [
  {
    id: "focused",
    title: "Keep me focused",
    value: {
      soundScope: "ASSIGNED_AND_UNASSIGNED",
      callSoundScope: "ASSIGNED_AND_UNASSIGNED",
      desktopScope: "ASSIGNED_AND_UNASSIGNED",
      mobileScope: "ASSIGNED_ONLY",
      emailScope: "MENTIONS_ONLY",
    },
  },
  {
    id: "mine",
    title: "Only my work",
    value: {
      soundScope: "ASSIGNED_ONLY",
      callSoundScope: "ASSIGNED_ONLY",
      desktopScope: "ASSIGNED_ONLY",
      mobileScope: "ASSIGNED_ONLY",
      emailScope: "ASSIGNED_ONLY",
    },
  },
  {
    id: "quiet",
    title: "Quiet mode",
    value: {
      soundScope: "NONE",
      callSoundScope: "MUTE_ALL",
      desktopScope: "MENTIONS_ONLY",
      mobileScope: "NONE",
      emailScope: "MENTIONS_ONLY",
    },
  },
];

const modeOptions: PreferenceOption<PreferenceModeId>[] = [
  {
    value: "custom",
    label: "Custom",
    description: "Your own choices.",
  },
  ...notificationPresets.map((preset) => ({
    value: preset.id,
    label: preset.title,
    description: "Applies a ready-made setup.",
  })),
];

const preferenceKeys: Array<keyof NotificationPreferenceState> = [
  "soundScope",
  "callSoundScope",
  "desktopScope",
  "mobileScope",
  "emailScope",
];

function pickPreferenceState(
  value: NotificationPreferenceState,
): NotificationPreferenceState {
  return {
    soundScope: value.soundScope,
    callSoundScope: value.callSoundScope,
    desktopScope: value.desktopScope,
    mobileScope: value.mobileScope,
    emailScope: value.emailScope,
  };
}

function isSamePreferenceState(
  first: NotificationPreferenceState,
  second: NotificationPreferenceState,
) {
  return preferenceKeys.every((key) => first[key] === second[key]);
}

function PreferenceSection({
  title,
  description,
  action,
  children,
}: PreferenceSectionProps) {
  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--color-gray-900)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 max-w-2xl text-sm leading-5 text-[var(--color-gray-500)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-3">{children}</div>
    </section>
  );
}

function PreferenceSelectRow<T extends string>({
  title,
  description,
  value,
  options,
  leading,
  onChange,
}: PreferenceSelectRowProps<T>) {
  return (
    <div className="grid gap-3 py-2.5 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] md:items-center">
      <div className="flex min-w-0 gap-2.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--color-primary)]">
          {leading}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-gray-900)]">
            {title}
          </h3>
          <p className="mt-0.5 text-sm leading-5 text-[var(--color-gray-500)]">
            {description}
          </p>
        </div>
      </div>

      <BaseSelect
        value={value}
        onChange={(nextValue) => onChange(nextValue as T)}
        options={options.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        size="sm"
      />
    </div>
  );
}

export const NotificationPreferences = () => {
  const {
    browserPermission,
    pushSupported,
    pushRegistrationStatus,
    pushError,
    enableBackgroundPush,
  } = useNotifications();
  const [prefs, setPrefs] = useState<NotificationPreferenceState | null>(null);
  const [savedPrefs, setSavedPrefs] =
    useState<NotificationPreferenceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedFlashTimeoutRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = pickPreferenceState(await workspaceApi.getNotificationPrefs());
      setPrefs(result);
      setSavedPrefs(result);
    } catch {
      setError("We could not load your notification choices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!prefs || !savedPrefs) return false;
    return !isSamePreferenceState(prefs, savedPrefs);
  }, [prefs, savedPrefs]);

  const selectedMode = useMemo<PreferenceModeId>(() => {
    if (!prefs) return "custom";

    return (
      notificationPresets.find((preset) =>
        isSamePreferenceState(prefs, preset.value),
      )?.id ?? "custom"
    );
  }, [prefs]);

  const deviceAlertsBusy = pushRegistrationStatus === "registering";
  const deviceAlertsActive =
    pushSupported &&
    browserPermission === "granted" &&
    pushRegistrationStatus === "registered";
  const shouldShowNotificationWarning =
    !pushSupported ||
    browserPermission !== "granted" ||
    pushRegistrationStatus !== "registered" ||
    Boolean(pushError);
  const canEnableDesktopAlerts = pushSupported && !deviceAlertsActive;
  const desktopWarningText = !pushSupported
    ? "This browser cannot show desktop notifications."
    : browserPermission === "denied"
      ? "Desktop notifications are blocked by your browser."
      : browserPermission !== "granted"
        ? "Desktop notifications are off."
        : "Desktop notifications are not active yet.";

  const savePreferences = useCallback(async (nextPrefs: NotificationPreferenceState) => {
    setSaving(true);
    setError(null);
    try {
      const updated = pickPreferenceState(
        await workspaceApi.updateNotificationPrefs(nextPrefs),
      );
      setSavedPrefs(updated);
      setPrefs((current) =>
        current && isSamePreferenceState(current, nextPrefs) ? updated : current,
      );
      setSaved(true);

      if (savedFlashTimeoutRef.current) {
        window.clearTimeout(savedFlashTimeoutRef.current);
      }
      savedFlashTimeoutRef.current = window.setTimeout(() => {
        setSaved(false);
        savedFlashTimeoutRef.current = null;
      }, 2000);
    } catch {
      setError("Changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (!prefs || !savedPrefs || isSamePreferenceState(prefs, savedPrefs)) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void savePreferences(prefs);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [prefs, savedPrefs, savePreferences]);

  useEffect(
    () => () => {
      if (savedFlashTimeoutRef.current) {
        window.clearTimeout(savedFlashTimeoutRef.current);
      }
    },
    [],
  );

  const updatePreference = useCallback(
    function updatePreference<Key extends keyof NotificationPreferenceState>(
      key: Key,
      value: NotificationPreferenceState[Key],
    ) {
      setError(null);
      setSaved(false);
      setPrefs((current) => (current ? { ...current, [key]: value } : current));
    },
    [],
  );

  const handleModeChange = useCallback((mode: PreferenceModeId) => {
    if (mode === "custom") return;

    const preset = notificationPresets.find((item) => item.id === mode);
    if (!preset) return;

    setError(null);
    setSaved(false);
    setPrefs({ ...preset.value });
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--color-gray-200)] bg-white p-6 text-sm text-[var(--color-gray-500)] shadow-sm">
        Loading your notification choices...
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-700">
              {error ?? "Notification choices are unavailable."}
            </p>
            <Button className="mt-4" variant="secondary" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-[var(--color-gray-900)]">
            Control when and how you get notified about new chats.
          </p>
          <span
            className={`mt-1.5 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${
              error
                ? "bg-red-50 text-red-700"
                : dirty || saving
                  ? "bg-amber-50 text-amber-700"
                  : saved
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-[var(--color-gray-100)] text-[var(--color-gray-600)]"
            }`}
          >
            {error
              ? error
              : dirty || saving
                ? "Saving..."
                : "Saved"}
          </span>
        </div>

        <div className="w-full sm:w-60">
          <BaseSelect
            label="Notification profile"
            value={selectedMode}
            onChange={(value) => handleModeChange(value as PreferenceModeId)}
            options={modeOptions.map((option) => ({
              value: option.value,
              label: option.label,
              disabled: option.value === "custom" && selectedMode !== "custom",
            }))}
            size="sm"
          />
        </div>
      </div>

      {shouldShowNotificationWarning ? (
        <div className="py-1 text-sm text-amber-700">
          <span className="inline-flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
            <AlertCircle size={15} className="shrink-0" />
            <span>{desktopWarningText}</span>
            {canEnableDesktopAlerts ? (
              <>
                <Button
                  variant="link"
                  size="sm"
                  loading={deviceAlertsBusy}
                  className="inline-flex align-baseline text-sm font-semibold"
                  onClick={() => void enableBackgroundPush()}
                >
                  Click here
                </Button>
                <span>to enable desktop notifications.</span>
              </>
            ) : null}
          </span>
        </div>
      ) : null}

      <PreferenceSection
        title="Where to alert you"
        description="App, closed app, and email."
      >
        <div>
          <PreferenceSelectRow
            title="While I am using AxoDesk"
            description="Alerts while the app is open."
            value={prefs.desktopScope}
            options={contactOptions}
            leading={<MonitorSmartphone size={15} />}
            onChange={(value) => updatePreference("desktopScope", value)}
          />
          <PreferenceSelectRow
            title="When AxoDesk is closed"
            description="Alerts when the app is not open."
            value={prefs.mobileScope}
            options={contactOptions}
            leading={<Bell size={15} />}
            onChange={(value) => updatePreference("mobileScope", value)}
          />
          <PreferenceSelectRow
            title="Email me"
            description="Email reminders."
            value={prefs.emailScope}
            options={contactOptions}
            leading={<Mail size={15} />}
            onChange={(value) => updatePreference("emailScope", value)}
          />
        </div>
      </PreferenceSection>

      <PreferenceSection
        title="Sounds"
        description="Message and call sounds."
      >
        <div>
          <PreferenceSelectRow
            title="Message sounds"
            description="Sound for new chat alerts."
            value={prefs.soundScope}
            options={soundOptions}
            leading={<Volume2 size={15} />}
            onChange={(value) => updatePreference("soundScope", value)}
          />
          <PreferenceSelectRow
            title="Call ringing"
            description="Ringing for incoming calls."
            value={prefs.callSoundScope}
            options={callSoundOptions}
            leading={<PhoneCall size={15} />}
            onChange={(value) => updatePreference("callSoundScope", value)}
          />
        </div>
      </PreferenceSection>
    </div>
  );
};
