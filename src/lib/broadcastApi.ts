import { api } from "./api";

export type BroadcastAudiencePreview = {
  channelId: string;
  channelType: string;
  totalMatching: number;
  previewLimit: number;
  previewCount: number;
  sample: Array<{ contactId: string; identifier: string; name: string }>;
};

export type BroadcastSendResult = {
  broadcastRunId: string;
  totalAudience: number;
  queued: number;
  failed: number;
  channelId: string;
  status: string;
  scheduledAt?: string;
  whatsAppComplianceNote?: string;
};

export type BroadcastRunRow = {
  id: string;
  name: string;
  channelId: string;
  status: string;
  audienceFilters: unknown;
  contentMode: string;
  templateName: string | null;
  templateLanguage: string | null;
  textPreview: string | null;
  totalAudience: number;
  queuedCount: number;
  failedEnqueue: number;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  channel?: { id: string; name: string; type: string; identifier: string };
};

export type BroadcastAnalytics = {
  broadcastRunId: string;
  totalMessages: number;
  byStatus: Record<string, number>;
  byQueueStatus?: Record<string, number>;
  queueNote: string;
};

export type BroadcastTrace = {
  broadcastRunId: string;
  limit: number;
  rows: Array<{
    messageId: string;
    conversationId: string | null;
    contactId: string | null;
    recipient: string;
    identifier: string | null;
    messageStatus: string;
    queueStatus: string | null;
    attempts: number;
    maxRetries: number;
    lastError: string | null;
    channelMsgId: string | null;
    createdAt: string;
    scheduledAt: string | null;
    sentAt: string | null;
    preview: string | null;
  }>;
};

export const broadcastApi = {
  list: (take?: number) =>
    api.get(`/broadcasts${take != null ? `?take=${take}` : ""}`) as Promise<BroadcastRunRow[]>,

  get: (id: string) => api.get(`/broadcasts/${id}`) as Promise<BroadcastRunRow>,

  analytics: (id: string) =>
    api.get(`/broadcasts/${id}/analytics`) as Promise<BroadcastAnalytics>,

  trace: (id: string) => api.get(`/broadcasts/${id}/trace`) as Promise<BroadcastTrace>,

  update: (id: string, body: { name?: string; scheduledAt?: string }) =>
    api.patch(`/broadcasts/${id}`, body) as Promise<BroadcastRunRow>,

  sendNow: (id: string) => api.post(`/broadcasts/${id}/send-now`) as Promise<BroadcastRunRow>,

  audiencePreview: (body: {
    channelId: string;
    tagIds?: string[];
    lifecycleId?: string;
    teamId?: string;
    respectMarketingOptOut?: boolean;
    limit?: number;
  }) => api.post("/broadcasts/audience-preview", body) as Promise<BroadcastAudiencePreview>,

  send: (body: {
    name: string;
    channelId: string;
    text?: string;
    template?: { name: string; language: string; variables?: Record<string, string> };
    tagIds?: string[];
    lifecycleId?: string;
    teamId?: string;
    respectMarketingOptOut?: boolean;
    limit?: number;
    scheduledAt?: string;
  }) => api.post("/broadcasts/send", body) as Promise<BroadcastSendResult>,

  whatsappTemplates: (channelId: string) =>
    api.get(`/broadcasts/whatsapp-templates/${channelId}`) as Promise<
      Array<{
        id: string;
        name: string;
        language: string;
        category: string;
        status: string;
        variables: unknown;
      }>
    >,
};
