import { useEffect } from "react";
import { Bell, Check, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { MobileSheet } from "./MobileSheet";
import { getNotificationTypeLabel, relativeTime } from "./utils";

interface NotificationPanelProps {
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
  onNavigateToInbox: (conversationId?: string | null) => void;
  onOpenPreferences: () => void;
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
              const conversationId =
                typeof notification.metadata?.conversationId === "string"
                  ? notification.metadata.conversationId
                  : null;

              const actionButtonClassName = isMobile
                ? "inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                : "text-[11px] text-gray-500 hover:text-gray-700";

              return (
                <div
                  key={notification.id}
                  className={`group px-4 py-3 transition-colors ${
                    !notification.readAt && !notification.archivedAt
                      ? "bg-indigo-50/40"
                      : ""
                  } ${conversationId ? "cursor-pointer hover:bg-gray-50" : ""}`}
                  onClick={() => {
                    if (!conversationId) return;
                    onNavigateToInbox(conversationId);
                    void updateNotificationState(notification.id, { read: true });
                    onClose();
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-tight text-gray-800">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-500">
                        {notification.body}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {relativeTime(new Date(notification.createdAt).getTime())}
                      </p>
                      {isMobile && (
                        <div className="mt-3 flex flex-wrap gap-2">
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
                      )}
                    </div>
                    {!isMobile && (
                      <div className="flex flex-col items-end gap-1 opacity-0 transition-all group-hover:opacity-100">
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
                          {notification.readAt ? "Unread" : "Read"}
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
                    )}
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
        className="absolute right-0 top-full z-20 mt-2 flex w-[min(22rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
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
