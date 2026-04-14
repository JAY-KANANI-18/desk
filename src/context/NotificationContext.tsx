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
  NotificationRecord,
  NotificationTab,
} from "../lib/notificationApi";
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
  activeTab: NotificationTab;
  center: Record<NotificationTab, NotificationFeedState>;
  notify: (event: Omit<AppNotification, "id" | "timestamp">) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  toggleSound: () => void;
  requestBrowserPermission: () => Promise<NotificationPermission | "unsupported">;
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
      return "unsupported";
    }

    const permission = await Notification.requestPermission();
    setBrowserPermission(permission);
    return permission;
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    if (now - heartbeatRef.current < HEARTBEAT_THROTTLE_MS) {
      return;
    }

    heartbeatRef.current = now;

    try {
      const result = await notificationApi.heartbeat(document.visibilityState === "visible" ? "app" : "background");
      const rawStatus = String(result.status ?? result.activityStatus ?? "").toLowerCase();
      const nextStatus = rawStatus === "active" ? "online" : rawStatus;

      if (nextStatus && user.activityStatus !== nextStatus) {
        setUserOnce({ ...user, activityStatus: nextStatus });
      }
    } catch {
      // best effort
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
    void refreshUnreadCount();
    void loadTab("new", true);
    void loadTab("archived", true);
    void loadTab("all", true);
  }, [refreshUnreadCount,activeWorkspace]);

  useEffect(() => {
    if (!user) return;

    const handler = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    };

    void sendHeartbeat();

    const interactionEvents: Array<keyof WindowEventMap> = ["focus", "click", "keydown", "mousemove"];
    interactionEvents.forEach((eventName) => window.addEventListener(eventName, handler, { passive: true }));
    document.addEventListener("visibilitychange", handler);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    }, 60000);

    return () => {
      interactionEvents.forEach((eventName) => window.removeEventListener(eventName, handler));
      document.removeEventListener("visibilitychange", handler);
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
        const conversationId =
          typeof incoming.metadata?.conversationId === "string"
            ? incoming.metadata.conversationId
            : null;

        browserNotificationsRef.current[incoming.id]?.close();
        const browserNotification = new Notification(incoming.title, {
          body: incoming.body ?? "",
          tag: incoming.id,
        });
        browserNotificationsRef.current[incoming.id] = browserNotification;

        browserNotification.onclick = () => {
          window.focus();
          window.location.href = conversationId
            ? `${window.location.origin}/inbox/${conversationId}`
            : `${window.location.origin}/inbox`;
          browserNotification.close();
        };
      }

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
      activeTab,
      center,
      notify,
      dismiss,
      dismissAll,
      toggleSound,
      requestBrowserPermission,
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
      activeTab,
      center,
      notify,
      dismiss,
      dismissAll,
      toggleSound,
      requestBrowserPermission,
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
