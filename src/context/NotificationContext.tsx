import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { playNotificationSound } from "../lib/notificationSound";
import type { NotificationSoundType } from "../lib/notificationSound";
import {
  notificationApi,
  NotificationDeviceRecord,
  NotificationRecord,
  NotificationTab,
} from "../lib/notificationApi";
import { getNotificationPath } from "../lib/notificationLink";
import {
  base64UrlToUint8Array,
  buildPushDeviceMetadata,
  buildPushDeviceName,
  detectPushPlatform,
  getOrCreatePushDeviceKey,
  isPushSupported,
  uint8ArrayToBase64Url,
} from "../lib/pushNotifications";
import { useSocket } from "../socket/socket-provider";
import { useAuth } from "./AuthContext";
import { useWorkspace } from "./WorkspaceContext";

export type NotificationEventType = NotificationSoundType;

export interface AppNotification {
  id: string;
  type: NotificationEventType;
  title: string;
  body: string;
  conversationId?: number;
  contactName?: string;
  timestamp: number;
}

interface NotificationFeedState {
  items: NotificationRecord[];
  nextCursor: string | null;
  loading: boolean;
  loaded: boolean;
  error: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  browserPermission: NotificationPermission | "unsupported";
  pushSupported: boolean;
  pushRegistrationStatus: "idle" | "registering" | "registered" | "error";
  pushDevices: NotificationDeviceRecord[];
  pushError: string | null;
  activeTab: NotificationTab;
  center: Record<NotificationTab, NotificationFeedState>;
  notify: (event: Omit<AppNotification, "id" | "timestamp">) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  toggleSound: () => void;
  requestBrowserPermission: () => Promise<NotificationPermission | "unsupported">;
  enableBackgroundPush: () => Promise<void>;
  disableBackgroundPush: () => Promise<void>;
  refreshPushDevices: () => Promise<void>;
  removePushDevice: (deviceId: string) => Promise<void>;
  setActiveTab: (tab: NotificationTab) => void;
  loadTab: (tab?: NotificationTab, reset?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  updateNotificationState: (
    id: string,
    state: { read?: boolean; archived?: boolean },
  ) => Promise<void>;
  archiveAll: (tab?: NotificationTab) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const AUTO_DISMISS_MS = 5500;
const MAX_VISIBLE = 5;
const HEARTBEAT_THROTTLE_MS = 30000;
const PUSH_DEBUG_STORAGE_KEY = "axodesk:push-debug";

const isPushDebugEnabled = () => {
  if (import.meta.env.DEV || import.meta.env.VITE_PUSH_DEBUG === "true") {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    const stored = window.localStorage.getItem(PUSH_DEBUG_STORAGE_KEY);
    return stored === "1" || stored === "true";
  } catch {
    return false;
  }
};

const logPushDebug = (event: string, details?: unknown) => {
  if (!isPushDebugEnabled()) {
    return;
  }

  console.info(`[PushDebug][NotificationContext] ${event}`, details ?? "");
};

const logPushDebugError = (event: string, error: unknown, details?: unknown) => {
  if (!isPushDebugEnabled()) {
    return;
  }

  console.error(`[PushDebug][NotificationContext] ${event}`, {
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : error,
    details,
  });
};

const summarizeSubscription = (subscription: PushSubscription | null) => ({
  endpoint: subscription?.endpoint ?? null,
  expirationTime: subscription?.expirationTime ?? null,
  hasAuthKey: Boolean(subscription?.getKey("auth")),
  hasP256dhKey: Boolean(subscription?.getKey("p256dh")),
});

const emptyFeed = (): NotificationFeedState => ({
  items: [],
  nextCursor: null,
  loading: false,
  loaded: false,
  error: false,
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">(
    typeof window === "undefined" || !("Notification" in window)
      ? "unsupported"
      : Notification.permission,
  );
  const [pushRegistrationStatus, setPushRegistrationStatus] = useState<
    "idle" | "registering" | "registered" | "error"
  >(browserPermission === "granted" ? "registering" : "idle");
  const [pushDevices, setPushDevices] = useState<NotificationDeviceRecord[]>([]);
  const [pushError, setPushError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NotificationTab>("new");
  const [center, setCenter] = useState<Record<NotificationTab, NotificationFeedState>>({
    new: emptyFeed(),
    archived: emptyFeed(),
    all: emptyFeed(),
  });

  const { socket } = useSocket();
  const { user, setUserOnce } = useAuth();

  const centerRef = useRef(center);
  centerRef.current = center;

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const heartbeatRef = useRef(0);
  const browserNotificationsRef = useRef<Record<string, Notification>>({});
  const browserPermissionPromptedRef = useRef(false);
  const pushSyncPromiseRef = useRef<Promise<void> | null>(null);
  const pushDeviceKeyRef = useRef<string | null>(null);

    const {activeWorkspace} = useWorkspace()
  

  const dismiss = useCallback((id: string) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    setNotifications([]);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const result = await notificationApi.unreadCount();
      setUnreadCount(result.unreadCount ?? 0);
    } catch {
      // best effort
    }
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserPermission("unsupported");
      logPushDebug("permission:unsupported");
      return "unsupported";
    }

    const permission = await Notification.requestPermission();
    setBrowserPermission(permission);
    logPushDebug("permission:result", {
      permission,
    });
    return permission;
  }, []);

  const refreshPushDevices = useCallback(async () => {
    if (!user) {
      setPushDevices([]);
      return;
    }

    try {
      logPushDebug("devices:refresh:start", {
        userId: user.id,
      });
      const result = await notificationApi.listDevices();
      logPushDebug("devices:refresh:success", {
        count: result.length,
        devices: result,
      });
      setPushDevices(result);
    } catch (error) {
      logPushDebugError("devices:refresh:failed", error, {
        userId: user.id,
      });
    }
  }, [user]);

  const syncPushSubscription = useCallback(
    async (requestPermissionIfNeeded = false) => {
      logPushDebug("subscription:sync:start", {
        requestPermissionIfNeeded,
        hasUser: Boolean(user),
        userId: user?.id ?? null,
        activeWorkspaceId: activeWorkspace?.id ?? null,
        permission: browserPermission,
        pushSupported: isPushSupported(),
        visibilityState:
          typeof document === "undefined" ? "unknown" : document.visibilityState,
      });

      if (!user || !activeWorkspace || !isPushSupported()) {
        setPushRegistrationStatus("idle");
        if (!isPushSupported()) {
          setPushError("Push notifications are not supported in this browser.");
        }
        logPushDebug("subscription:sync:aborted", {
          reason: !user
            ? "missing-user"
            : !activeWorkspace
              ? "missing-workspace"
              : "push-unsupported",
        });
        return;
      }

      if (pushSyncPromiseRef.current) {
        logPushDebug("subscription:sync:reuse-inflight");
        await pushSyncPromiseRef.current;
        return;
      }

      const job = (async () => {
        setPushRegistrationStatus("registering");
        setPushError(null);

        let permission: NotificationPermission | "unsupported" = browserPermission;
        if (permission !== "granted" && requestPermissionIfNeeded) {
          permission = await requestBrowserPermission();
          logPushDebug("subscription:permission:requested", {
            permission,
          });
        }

        if (permission !== "granted") {
          setPushRegistrationStatus("idle");
          logPushDebug("subscription:permission:not-granted", {
            permission,
          });
          return;
        }

        const pushConfig = await notificationApi.pushConfig();
        logPushDebug("subscription:push-config", pushConfig);
        if (!pushConfig.enabled || !pushConfig.publicKey) {
          setPushRegistrationStatus("error");
          setPushError("Background push is not configured on the server.");
          logPushDebug("subscription:push-config:disabled", pushConfig);
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        logPushDebug("subscription:service-worker-ready", {
          scope: registration.scope,
          activeScriptURL: registration.active?.scriptURL ?? null,
          installingScriptURL: registration.installing?.scriptURL ?? null,
          waitingScriptURL: registration.waiting?.scriptURL ?? null,
        });
        let subscription = await registration.pushManager.getSubscription();
        logPushDebug("subscription:existing", summarizeSubscription(subscription));

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64UrlToUint8Array(pushConfig.publicKey),
          });
          logPushDebug("subscription:created", summarizeSubscription(subscription));
        }

        const authKey = subscription.getKey("auth");
        const p256dhKey = subscription.getKey("p256dh");

        if (!authKey || !p256dhKey) {
          throw new Error("The browser did not return Push subscription keys.");
        }

        const deviceKey = getOrCreatePushDeviceKey();
        pushDeviceKeyRef.current = deviceKey;

        const response = await notificationApi.registerDevice({
          platform: detectPushPlatform(),
          deviceKey,
          token: subscription.endpoint,
          deviceName: buildPushDeviceName(),
          pushPermission: Notification.permission,
          metadata: buildPushDeviceMetadata(),
          subscription: {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime ?? null,
            keys: {
              auth: uint8ArrayToBase64Url(new Uint8Array(authKey)),
              p256dh: uint8ArrayToBase64Url(new Uint8Array(p256dhKey)),
            },
          },
        });
        logPushDebug("subscription:register-device:success", {
          deviceKey,
          platform: detectPushPlatform(),
          deviceName: buildPushDeviceName(),
          permission: Notification.permission,
          subscription: summarizeSubscription(subscription),
          response,
        });

        setPushRegistrationStatus("registered");
        setPushError(null);
        await refreshPushDevices();
      })().catch((error) => {
        setPushRegistrationStatus("error");
        setPushError(
          error instanceof Error
            ? error.message
            : "Unable to enable background push notifications.",
        );
        logPushDebugError("subscription:sync:failed", error, {
          activeWorkspaceId: activeWorkspace?.id ?? null,
          permission: browserPermission,
        });
      });

      pushSyncPromiseRef.current = job.finally(() => {
        pushSyncPromiseRef.current = null;
      });

      await pushSyncPromiseRef.current;
    },
    [
      activeWorkspace,
      browserPermission,
      refreshPushDevices,
      requestBrowserPermission,
      user,
    ],
  );

  const enableBackgroundPush = useCallback(async () => {
    logPushDebug("subscription:enable:requested");
    await syncPushSubscription(true);
  }, [syncPushSubscription]);

  const disableBackgroundPush = useCallback(async () => {
    if (!user || !isPushSupported()) {
      setPushRegistrationStatus("idle");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const deviceKey = pushDeviceKeyRef.current ?? getOrCreatePushDeviceKey();
      logPushDebug("subscription:disable:start", {
        userId: user.id,
        deviceKey,
        subscription: summarizeSubscription(subscription),
      });

      await notificationApi.unregisterDevice({
        deviceKey,
        token: subscription?.endpoint,
        reason: "user-unregistered",
      });

      if (subscription) {
        await subscription.unsubscribe();
      }

      setPushRegistrationStatus("idle");
      setPushError(null);
      await refreshPushDevices();
    } catch (error) {
      setPushRegistrationStatus("error");
      setPushError(
          error instanceof Error
          ? error.message
          : "Unable to disable background push notifications.",
      );
      logPushDebugError("subscription:disable:failed", error, {
        userId: user.id,
      });
    }
  }, [refreshPushDevices, user]);

  const removePushDevice = useCallback(
    async (deviceId: string) => {
      logPushDebug("device:remove:start", {
        deviceId,
      });
      await notificationApi.removeDevice(deviceId);
      logPushDebug("device:remove:success", {
        deviceId,
      });
      await refreshPushDevices();
    },
    [refreshPushDevices],
  );

  const sendHeartbeat = useCallback(async (
    module: "app" | "background" = document.visibilityState === "visible"
      ? "app"
      : "background",
    force = false,
  ) => {
    if (!user) return;

    const now = Date.now();
    if (!force && module === "app" && now - heartbeatRef.current < HEARTBEAT_THROTTLE_MS) {
      return;
    }

    heartbeatRef.current = now;

    try {
      const result = await notificationApi.heartbeat(module);
      const rawStatus = String(result.status ?? result.activityStatus ?? "").toLowerCase();
      const nextStatus = rawStatus === "active" ? "online" : rawStatus;
      logPushDebug("heartbeat:success", {
        module,
        force,
        visibilityState:
          typeof document === "undefined" ? "unknown" : document.visibilityState,
        result,
        nextStatus,
      });

      if (nextStatus && user.activityStatus !== nextStatus) {
        setUserOnce({ ...user, activityStatus: nextStatus });
      }
    } catch (error) {
      logPushDebugError("heartbeat:failed", error, {
        module,
        force,
      });
    }
  }, [setUserOnce, user]);

  const loadTab = useCallback(
    async (tab?: NotificationTab, reset = false) => {
      const targetTab = tab ?? activeTab;
      const snapshot = centerRef.current[targetTab];

      if (snapshot.loading) {
        return;
      }

      setCenter((prev) => ({
        ...prev,
        [targetTab]: {
          ...prev[targetTab],
          loading: true,
          error: false,
        },
      }));

      try {
        const result = await notificationApi.list(
          targetTab,
          reset ? undefined : snapshot.nextCursor ?? undefined,
        );

        setCenter((prev) => ({
          ...prev,
          [targetTab]: {
            items: reset ? result.items : [...prev[targetTab].items, ...result.items],
            nextCursor: result.nextCursor,
            loading: false,
            loaded: true,
            error: false,
          },
        }));
      } catch {
        setCenter((prev) => ({
          ...prev,
          [targetTab]: {
            ...prev[targetTab],
            loading: false,
            loaded: true,
            error: true,
          },
        }));
      }
    },
    [activeTab],
  );

  useEffect(() => {
    logPushDebug("bootstrap", {
      browserPermission,
      pushSupported: isPushSupported(),
      activeWorkspaceId: activeWorkspace?.id ?? null,
      userId: user?.id ?? null,
      visibilityState:
        typeof document === "undefined" ? "unknown" : document.visibilityState,
    });
  }, [activeWorkspace, browserPermission, user]);

  useEffect(() => {
    void refreshUnreadCount();
    void loadTab("new", true);
    void loadTab("archived", true);
    void loadTab("all", true);
  }, [refreshUnreadCount,activeWorkspace]);

  useEffect(() => {
    if (!user || !activeWorkspace) {
      setPushDevices([]);
      setPushRegistrationStatus("idle");
      return;
    }

    void refreshPushDevices();
  }, [activeWorkspace, refreshPushDevices, user]);

  useEffect(() => {
    if (browserPermission !== "granted" || !user || !activeWorkspace) {
      logPushDebug("subscription:auto-sync:skipped", {
        browserPermission,
        hasUser: Boolean(user),
        activeWorkspaceId: activeWorkspace?.id ?? null,
      });
      return;
    }

    logPushDebug("subscription:auto-sync:start", {
      activeWorkspaceId: activeWorkspace.id,
      userId: user.id,
    });
    void syncPushSubscription(false);
  }, [activeWorkspace, browserPermission, syncPushSubscription, user]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const messageType = event.data?.type;
      logPushDebug("service-worker:message", {
        messageType,
        data: event.data ?? null,
      });

      if (messageType === "notification:push-subscription-change") {
        void syncPushSubscription(false);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [syncPushSubscription]);

  useEffect(() => {
    if (!user) return;

    const handler = () => {
      logPushDebug("visibility:change", {
        visibilityState: document.visibilityState,
      });
      void sendHeartbeat(
        document.visibilityState === "visible" ? "app" : "background",
        true,
      );
    };
    const handlePageHide = () => {
      logPushDebug("pagehide", {
        visibilityState: document.visibilityState,
      });
      void sendHeartbeat("background", true);
    };

    void sendHeartbeat("app", true);

    const interactionEvents: Array<keyof WindowEventMap> = ["focus", "click", "keydown", "mousemove"];
    interactionEvents.forEach((eventName) => window.addEventListener(eventName, handler, { passive: true }));
    document.addEventListener("visibilitychange", handler);
    window.addEventListener("pagehide", handlePageHide);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat("app");
      }
    }, 60000);

    return () => {
      interactionEvents.forEach((eventName) => window.removeEventListener(eventName, handler));
      document.removeEventListener("visibilitychange", handler);
      window.removeEventListener("pagehide", handlePageHide);
      window.clearInterval(interval);
    };
  }, [sendHeartbeat, user,activeWorkspace]);

  useEffect(() => {
    if (browserPermission !== "default" || browserPermissionPromptedRef.current) {
      return;
    }

    const requestOnFirstInteraction = () => {
      if (browserPermissionPromptedRef.current) {
        return;
      }
      browserPermissionPromptedRef.current = true;
      void requestBrowserPermission();
      interactionEvents.forEach((eventName) =>
        window.removeEventListener(eventName, requestOnFirstInteraction),
      );
    };

    const interactionEvents: Array<keyof WindowEventMap> = ["click", "keydown", "pointerdown"];
    interactionEvents.forEach((eventName) =>
      window.addEventListener(eventName, requestOnFirstInteraction, { passive: true, once: true }),
    );

    return () => {
      interactionEvents.forEach((eventName) =>
        window.removeEventListener(eventName, requestOnFirstInteraction),
      );
    };
  }, [browserPermission, requestBrowserPermission]);

  useEffect(() => {
    if (!socket) return;

    const handleNew = (payload: {
      notification?: NotificationRecord;
      unreadCount?: number;
    }) => {
      const incoming = payload.notification;

      if (typeof payload.unreadCount === "number") {
        setUnreadCount(payload.unreadCount);
      }

      if (!incoming) {
        return;
      }

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        browserPermission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        const notificationPath = getNotificationPath(incoming);

        browserNotificationsRef.current[incoming.id]?.close();
        const browserNotification = new Notification(incoming.title, {
          body: incoming.body ?? "",
          tag: incoming.id,
        });
        browserNotificationsRef.current[incoming.id] = browserNotification;
        logPushDebug("browser-notification:shown", {
          notificationId: incoming.id,
          notificationPath,
          payload: incoming,
        });

        browserNotification.onclick = () => {
          logPushDebug("browser-notification:clicked", {
            notificationId: incoming.id,
            notificationPath,
          });
          window.focus();
          window.location.href = notificationPath
            ? `${window.location.origin}${notificationPath}`
            : `${window.location.origin}/inbox`;
          browserNotification.close();
        };
      }

      logPushDebug("socket:notification:new", {
        unreadCount: payload.unreadCount ?? null,
        notification: incoming,
        visibilityState: document.visibilityState,
      });

      setCenter((prev) => ({
        ...prev,
        all: {
          ...prev.all,
          items: [incoming, ...prev.all.items.filter((item) => item.id !== incoming.id)],
        },
        new:
          incoming.archivedAt || incoming.readAt
            ? prev.new
            : {
                ...prev.new,
                items: [incoming, ...prev.new.items.filter((item) => item.id !== incoming.id)],
              },
      }));
    };

    const handleUpdated = (notification: NotificationRecord) => {
      setCenter((prev) => ({
        new: {
          ...prev.new,
          items: prev.new.items.filter(
            (item) => item.id !== notification.id && !notification.archivedAt,
          ),
        },
        archived: {
          ...prev.archived,
          items: notification.archivedAt
            ? [
                notification,
                ...prev.archived.items.filter((item) => item.id !== notification.id),
              ]
            : prev.archived.items.filter((item) => item.id !== notification.id),
        },
        all: {
          ...prev.all,
          items: prev.all.items.map((item) =>
            item.id === notification.id ? notification : item,
          ),
        },
      }));
    };

    const handleBadge = (payload: { unreadCount?: number }) => {
      if (typeof payload.unreadCount === "number") {
        setUnreadCount(payload.unreadCount);
      }
    };

    socket.on("notification:new", handleNew);
    socket.on("notification:updated", handleUpdated);
    socket.on("notification:badge", handleBadge);

    return () => {
      socket.off("notification:new", handleNew);
      socket.off("notification:updated", handleUpdated);
      socket.off("notification:badge", handleBadge);
    };
  }, [browserPermission, socket,activeWorkspace]);

  const notify = useCallback(
    (event: Omit<AppNotification, "id" | "timestamp">) => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const notification: AppNotification = { ...event, id, timestamp: Date.now() };

      if (soundEnabledRef.current) {
        playNotificationSound(event.type);
      }

      setNotifications((prev) => [notification, ...prev].slice(0, MAX_VISIBLE));
      timersRef.current[id] = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllRead();
    await refreshUnreadCount();
    await loadTab("new", true);
    await loadTab("all", true);
  }, [loadTab, refreshUnreadCount]);

  const updateNotificationState = useCallback(
    async (id: string, state: { read?: boolean; archived?: boolean }) => {
      const updated = await notificationApi.updateState(id, state);
      setCenter((prev) => ({
        new: {
          ...prev.new,
          items: prev.new.items.filter((item) => item.id !== id),
        },
        archived: {
          ...prev.archived,
          items: updated.archivedAt
            ? [updated, ...prev.archived.items.filter((item) => item.id !== id)]
            : prev.archived.items.filter((item) => item.id !== id),
        },
        all: {
          ...prev.all,
          items: prev.all.items.map((item) => (item.id === id ? updated : item)),
        },
      }));
      await refreshUnreadCount();
    },
    [refreshUnreadCount],
  );

  const archiveAll = useCallback(
    async (tab?: NotificationTab) => {
      const targetTab = tab ?? activeTab;
      await notificationApi.archiveAll(targetTab);
      await refreshUnreadCount();
      await loadTab("new", true);
      await loadTab("archived", true);
      await loadTab("all", true);
    },
    [activeTab, loadTab, refreshUnreadCount],
  );

  const value = useMemo<NotificationContextType>(
    () => ({
      notifications,
      unreadCount,
      soundEnabled,
      browserPermission,
      pushSupported: isPushSupported(),
      pushRegistrationStatus,
      pushDevices,
      pushError,
      activeTab,
      center,
      notify,
      dismiss,
      dismissAll,
      toggleSound,
      requestBrowserPermission,
      enableBackgroundPush,
      disableBackgroundPush,
      refreshPushDevices,
      removePushDevice,
      setActiveTab,
      loadTab,
      markAllRead,
      updateNotificationState,
      archiveAll,
    }),
    [
      notifications,
      unreadCount,
      soundEnabled,
      browserPermission,
      pushRegistrationStatus,
      pushDevices,
      pushError,
      activeTab,
      center,
      notify,
      dismiss,
      dismissAll,
      toggleSound,
      requestBrowserPermission,
      enableBackgroundPush,
      disableBackgroundPush,
      refreshPushDevices,
      removePushDevice,
      loadTab,
      markAllRead,
      updateNotificationState,
      archiveAll,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
};
