import { api } from "./api";

export type NotificationTab = "new" | "archived" | "all";

export interface NotificationRecord {
  id: string;
  userId: string;
  workspaceId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
}

export const notificationApi = {
  heartbeat: (module?: string) =>
    api.post(`/notifications/activity/heartbeat`, { module }) as Promise<{
      activityStatus?: string;
      status?: string;
      inactivityTimeoutSec?: number;
    }>,

  list: (tab: NotificationTab, cursor?: string, limit = 20) =>
    api.get(
      `/notifications?tab=${tab}&limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
    ) as Promise<{ items: NotificationRecord[]; nextCursor: string | null }>,

  unreadCount: () =>
    api.get(`/notifications/unread-count`) as Promise<{ unreadCount: number }>,

  updateState: (
    id: string,
    body: { read?: boolean; archived?: boolean },
  ) => api.patch(`/notifications/${id}/state`, body) as Promise<NotificationRecord>,

  markAllRead: () => api.post(`/notifications/mark-all-read`, {}) as Promise<{ success: boolean }>,

  archiveAll: (tab: NotificationTab) =>
    api.post(`/notifications/archive-all`, { tab }) as Promise<{ success: boolean }>,
};
