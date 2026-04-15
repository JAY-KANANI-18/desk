import type { NotificationRecord } from "./notificationApi";

export function getNotificationPath(
  notification?: Pick<NotificationRecord, "metadata"> | null,
) {
  const metadata = notification?.metadata;

  if (typeof metadata?.deepLink === "string" && metadata.deepLink.trim()) {
    return metadata.deepLink;
  }

  if (typeof metadata?.conversationId === "string" && metadata.conversationId) {
    const params = new URLSearchParams();

    if (typeof metadata?.workspaceId === "string" && metadata.workspaceId) {
      params.set("workspaceId", metadata.workspaceId);
    }

    if (typeof metadata?.messageId === "string" && metadata.messageId) {
      params.set("targetMessageId", metadata.messageId);
    }

    const query = params.toString();
    return `/inbox/${metadata.conversationId}${query ? `?${query}` : ""}`;
  }

  if (typeof metadata?.jobId === "string" && metadata.jobId) {
    const params = new URLSearchParams();

    if (typeof metadata?.workspaceId === "string" && metadata.workspaceId) {
      params.set("workspaceId", metadata.workspaceId);
    }

    params.set("jobId", metadata.jobId);

    return `/contacts/import-jobs?${params.toString()}`;
  }

  return null;
}
