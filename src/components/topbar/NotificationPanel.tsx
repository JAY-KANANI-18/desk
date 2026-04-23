import { useEffect } from "react";
import {
  AtSign,
  Bell,
  Check,
  MessageCircle,
  Trash2,
  UserCheck,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import type { NotificationRecord } from "../../lib/notificationApi";
import { getNotificationPath } from "../../lib/notificationLink";
import { MobileSheet } from "./MobileSheet";
import { relativeTime } from "./utils";

interface NotificationPanelProps {
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
  onNavigateToInbox: (path?: string | null) => void;
  onOpenPreferences: () => void;
}

type NotificationAppearance = {
  icon: React.ReactNode;
  iconClassName: string;
  chipClassName: string;
  label: string;
};

type NotificationCopy = {
  heading: string;
  detail?: string | null;
  preview?: string | null;
};

const DEFAULT_NOTIFICATION_LABEL = "Activity";

function normalizeText(value?: string | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function readMetadataText(
  notification: NotificationRecord,
  keys: string[],
) {
  const metadata = notification.metadata;

  if (!metadata) {
    return null;
  }

  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return normalizeText(value);
    }
  }

  return null;
}

function resolveNotificationTypeAppearance(type: string): NotificationAppearance {
  const normalized = type.toLowerCase();

  if (normalized.includes("mention")) {
    return {
      icon: <AtSign size={15} />,
      iconClassName: "bg-violet-100 text-violet-700",
      chipClassName: "bg-violet-50 text-violet-700",
      label: "Mention",
    };
  }

  if (normalized.includes("assign")) {
    return {
      icon: <UserCheck size={15} />,
      iconClassName: "bg-emerald-100 text-emerald-700",
      chipClassName: "bg-emerald-50 text-emerald-700",
      label: "Assignment",
    };
  }

  if (normalized.includes("message") || normalized.includes("incoming")) {
    return {
      icon: <MessageCircle size={15} />,
      iconClassName: "bg-blue-100 text-blue-700",
      chipClassName: "bg-blue-50 text-blue-700",
      label: "Message",
    };
  }

  return {
    icon: <Bell size={15} />,
    iconClassName: "bg-slate-100 text-slate-700",
    chipClassName: "bg-slate-100 text-slate-700",
    label: DEFAULT_NOTIFICATION_LABEL,
  };
}

function buildNotificationCopy(notification: NotificationRecord): NotificationCopy {
  const normalizedType = notification.type.toLowerCase();
  const rawTitle = normalizeText(notification.title) || "New notification";
  const rawBody = normalizeText(notification.body);
  const preview = rawBody && rawBody !== rawTitle ? rawBody : null;
  const actorName =
    readMetadataText(notification, [
      "senderName",
      "contactName",
      "actorName",
      "subjectName",
      "userName",
      "name",
    ]) ?? null;

  if (normalizedType.includes("message") || normalizedType.includes("incoming")) {
    const titleMatch =
      rawTitle.match(/^(?:new\s+)?(?:incoming\s+)?message\s+from\s+(.+)$/i) ??
      rawTitle.match(/^(.+?)\s+sent you a message$/i);
    const senderName = actorName ?? titleMatch?.[1]?.trim() ?? null;

    if (senderName) {
      return {
        heading: senderName,
        detail: "sent you a new message",
        preview,
      };
    }

    return {
      heading: rawTitle,
      detail: preview ? "Latest message" : null,
      preview,
    };
  }

  if (normalizedType.includes("mention")) {
    const titleMatch =
      rawTitle.match(/^(?:new\s+)?mention\s+from\s+(.+)$/i) ??
      rawTitle.match(/^(.+?)\s+mentioned you$/i);
    const mentionerName = actorName ?? titleMatch?.[1]?.trim() ?? null;

    if (mentionerName) {
      return {
        heading: mentionerName,
        detail: "mentioned you",
        preview,
      };
    }

    return {
      heading: rawTitle,
      detail: preview ? "Mention details" : null,
      preview,
    };
  }

  if (normalizedType.includes("assign")) {
    return {
      heading: rawTitle,
      detail: preview ? "Assignment details" : null,
      preview,
    };
  }

  return {
    heading: rawTitle,
    detail: null,
    preview,
  };
}

export function NotificationPanel({
  open,
  isMobile,
  onClose,
  onNavigateToInbox,
  onOpenPreferences,
}: NotificationPanelProps) {
  if (!open && !isMobile) {
    return null;
  }

  const {
    activeTab,
    center,
    setActiveTab,
    loadTab,
    updateNotificationState,
    archiveAll,
    markAllRead,
    soundEnabled,
    toggleSound,
  } = useNotifications();

  const centerState = center[activeTab];
  const items = centerState.items;

  useEffect(() => {
    if (!centerState.loaded && !centerState.loading && !centerState.error) {
      void loadTab(activeTab, true);
    }
  }, [activeTab, centerState.error, centerState.loaded, centerState.loading, loadTab]);

  const headerActions = (
    <>
      <button
        type="button"
        onClick={toggleSound}
        title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
        className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
      {activeTab === "new" && items.length > 0 && (
        <button
          type="button"
          onClick={() => void markAllRead()}
          title="Mark all read"
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Check size={16} />
        </button>
      )}
      {items.length > 0 && (
        <button
          type="button"
          onClick={() => void archiveAll(activeTab)}
          title="Archive all"
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Trash2 size={16} />
        </button>
      )}
    </>
  );

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-400">
        {soundEnabled ? "Sound on" : "Sound off"}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenPreferences}
          className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          Preferences
        </button>
        {centerState.nextCursor && (
          <button
            type="button"
            onClick={() => void loadTab(activeTab)}
            className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );

  const panelBody = (
    <>
      <div
        className={`border-b border-slate-100 ${
          isMobile ? "px-4 py-3" : "flex items-center gap-1 px-3 pb-1 pt-2"
        }`}
      >
        <div className={`flex ${isMobile ? "gap-2 overflow-x-auto" : "items-center gap-1"}`}>
          {(["new", "archived", "all"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab === "new" ? "New" : tab === "archived" ? "Archived" : "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {centerState.loading && items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : centerState.error && items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-gray-600">
              Could not load notifications
            </p>
            <button
              type="button"
              onClick={() => void loadTab(activeTab, true)}
              className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Bell size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {activeTab === "archived"
                ? "Archived notifications will show here"
                : "New activity will show here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((notification) => {
              const notificationPath = getNotificationPath(notification);
              const typeAppearance = resolveNotificationTypeAppearance(
                notification.type,
              );
              const copy = buildNotificationCopy(notification);
              const isUnread =
                !notification.readAt && !notification.archivedAt;

              const actionButtonClassName = isMobile
                ? "inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
                : "inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100";

              return (
                <div
                  key={notification.id}
                  className={`group px-4 py-3.5 transition-colors ${
                    isUnread ? "bg-indigo-50/45" : "bg-white"
                  } ${notificationPath ? "cursor-pointer hover:bg-slate-50" : ""}`}
                  onClick={() => {
                    if (!notificationPath) return;
                    onNavigateToInbox(notificationPath);
                    void updateNotificationState(notification.id, { read: true });
                    onClose();
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${typeAppearance.iconClassName}`}
                    >
                      {typeAppearance.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${typeAppearance.chipClassName}`}
                        >
                          {typeAppearance.label}
                        </span>
                        {isUnread && (
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                            New
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {relativeTime(new Date(notification.createdAt).getTime())}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-5 text-slate-900">
                        {copy.heading}
                      </p>
                      {copy.detail ? (
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {copy.detail}
                        </p>
                      ) : null}
                      {copy.preview ? (
                        <div className="mt-2 rounded-2xl bg-white/80 px-3 py-2.5 text-[13px] leading-5 text-slate-600 shadow-sm shadow-slate-200/60">
                          {copy.preview}
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {notificationPath && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onNavigateToInbox(notificationPath);
                              void updateNotificationState(notification.id, {
                                read: true,
                              });
                              onClose();
                            }}
                            className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-slate-800"
                          >
                            Open
                          </button>
                        )}
                        {activeTab === "new" && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void updateNotificationState(notification.id, {
                                archived: true,
                              });
                            }}
                            className={actionButtonClassName}
                          >
                            Archive
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void updateNotificationState(notification.id, {
                              read: !notification.readAt,
                            });
                          }}
                          className={actionButtonClassName}
                        >
                          {notification.readAt ? "Mark unread" : "Mark read"}
                        </button>
                        {notification.archivedAt && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void updateNotificationState(notification.id, {
                                archived: false,
                              });
                            }}
                            className={actionButtonClassName}
                          >
                            Unarchive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <MobileSheet
        open={open}
        title={
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-slate-700" />
            <span className="text-base font-semibold text-slate-900">
              Notifications
            </span>
            {items.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {items.length}
              </span>
            )}
          </div>
        }
        onClose={onClose}
        headerActions={headerActions}
        footer={footer}
        fullScreen
      >
        {panelBody}
      </MobileSheet>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className="absolute right-0 top-full z-20 mt-2 flex w-[min(26rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        style={{ maxHeight: "480px" }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-gray-700" />
            <span className="text-sm font-semibold text-gray-800">
              Notifications
            </span>
            {items.length > 0 && (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                {items.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        {panelBody}
        <div className="border-t border-gray-100 px-4 py-2.5">{footer}</div>
      </div>
    </>
  );
}
