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

export interface NotificationPushConfig {
  enabled: boolean;
  publicKey: string | null;
}

export interface NotificationDeviceRecord {
  id: string;
  workspaceId?: string | null;
  deviceKey?: string | null;
  platform: string;
  deviceName?: string | null;
  metadata?: Record<string, unknown> | null;
  pushPermission?: string | null;
  lastSeenAt?: string | null;
  lastSuccessfulDeliveryAt?: string | null;
  lastFailureAt?: string | null;
  failureCount: number;
  invalidatedAt?: string | null;
  disabledAt?: string | null;
  disabledReason?: string | null;
  createdAt: string;
  updatedAt: string;
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

  pushConfig: () =>
    api.get(`/notifications/push/config`) as Promise<NotificationPushConfig>,

  listDevices: () =>
    api.get(`/notifications/devices`) as Promise<NotificationDeviceRecord[]>,

  registerDevice: (body: {
    platform: string;
    deviceKey?: string;
    token?: string;
    deviceName?: string;
    pushPermission?: string;
    metadata?: Record<string, unknown>;
    subscription?: {
      endpoint: string;
      expirationTime?: number | null;
      keys: {
        p256dh: string;
        auth: string;
      };
    };
  }) => api.post(`/notifications/devices`, body),

  unregisterDevice: (body: {
    deviceId?: string;
    deviceKey?: string;
    token?: string;
    reason?: string;
  }) => api.post(`/notifications/devices/unregister`, body) as Promise<{ success: boolean }>,

  removeDevice: (id: string) =>
    api.delete(`/notifications/devices/${id}`) as Promise<{ success: boolean }>,
};
