/**
 * inboxApi.ts
 * ─────────────────────────────────────────────────────────────────
 * Central API layer for the inbox / conversations system.
 *
 * BE base URL is read from REACT_APP_API_URL env var.
 *
 * All endpoints require the Authorization: Bearer <jwt> header,
 * added automatically by `apiFetch`.
 *
 * Endpoints implemented here map to the NestJS ConversationController:
 *
 *  GET    /workspaces/:wsId/conversations              list + filter
 *  GET    /workspaces/:wsId/conversations/search       full-text search
 *  GET    /workspaces/:wsId/conversations/:id          single conversation
 *  GET    /workspaces/:wsId/conversations/:id/messages paginated messages
 *  GET    /workspaces/:wsId/conversations/:id/timeline merged msg+activity
 *  POST   /workspaces/:wsId/conversations/:id/messages send message
 *  POST   /workspaces/:wsId/conversations/:id/close
 *  POST   /workspaces/:wsId/conversations/:id/open
 *  POST   /workspaces/:wsId/conversations/:id/pending
 *  POST   /workspaces/:wsId/conversations/:id/assign/user
 *  DELETE /workspaces/:wsId/conversations/:id/assign/user
 *  POST   /workspaces/:wsId/conversations/:id/assign/team
 *  DELETE /workspaces/:wsId/conversations/:id/assign/team
 *  POST   /workspaces/:wsId/conversations/:id/notes
 *  PATCH  /workspaces/:wsId/conversations/:id/priority
 *  POST   /workspaces/:wsId/conversations/:id/read     mark read
 *  POST   /workspaces/:wsId/messages/presign           get upload URL
 */

import { api } from "./api";
import { apiFetch } from "./apiClient";



/* ══════════════════════════════════════════════════════════════════
   SHARED TYPES (mirror the BE response shapes)
══════════════════════════════════════════════════════════════════ */

export type ConvStatus = "open" | "pending" | "resolved" | "closed";
export type ConvPriority = "low" | "normal" | "high" | "urgent";
export type Direction = "incoming" | "outgoing";

export interface ApiConversation {
  id: string;
  workspaceId: string;
  contactId: string;

  subject?: string;
  status: ConvStatus;
  priority: ConvPriority;
  unreadCount: number;
  lastMessageAt?: string;
  lastIncomingAt?: string;
  createdAt: string;
  updatedAt: string;
  contact: ApiContact;
  channel?: ApiChannel;
  lastMessage?: ApiMessage;
}

export interface ApiContact {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  company?: string;
  tag?: string;
  status?: string;
  assigneeId?: string;
  teamId?: string;
}

export interface ApiChannel {
  id: string;
  type: string;
  name: string;
  identifier?: string;
  status: string;
}

export interface ApiMessage {
  id: string;
  conversationId: string;
  channelId?: string;
  channelType?: string;
  type: string;
  direction: Direction;
  text?: string;
  subject?: string;
  status: string;
  author?: string;
  initials?: string;
  createdAt: string;
  sentAt?: string;
  metadata?: Record<string, any>;
  attachments?: ApiAttachment[];
  messageAttachments?: ApiAttachment[];
}

export interface ApiAttachment {
  id: string;
  type: string;
  name?: string;
  url?: string;
  mimeType?: string;
  size?: number;
}

export interface ApiActivity {
  id: string;
  conversationId: string;
  eventType: string;
  actorType: string;
  actor?: { id: string; name: string; avatarUrl?: string };
  subjectUser?: { id: string; name: string; avatarUrl?: string };
  subjectTeam?: { id: string; name: string };
  metadata?: Record<string, any>;
  createdAt: string;
  description: string;
}

export interface ApiTimelineItem {
  id: string;
  type: "message" | "activity";
  timestamp: string;
  message?: ApiMessage;
  activity?: ApiActivity;
}

/* ══════════════════════════════════════════════════════════════════
   FILTER / PAGINATION PARAMS
══════════════════════════════════════════════════════════════════ */

export interface ConversationFilters {
  status?: ConvStatus | "all";
  priority?: ConvPriority | "all";
  direction?: Direction | "all";
  //   channelType?: string | "all";
  assigneeId?: string | "me" | "unassigned";
  teamId?: string;
  unreplied?: boolean;
  search?: string;           // contact name / email / phone search
  cursor?: string;           // for cursor pagination
  limit?: number;
}

export interface PaginatedConversations {
  data: ApiConversation[];
  nextCursor?: string;
  total: number;
}

export interface MessageSearchResult {
  conversationId: string;
  messageId: string;
  text: string;
  snippet: string;           // highlighted snippet from BE
  createdAt: string;
  contact: ApiContact;
}

/* ══════════════════════════════════════════════════════════════════
   INBOX API
══════════════════════════════════════════════════════════════════ */

export const inboxApi = {
  /* ─── Conversations ─────────────────────────────────────────── */

  /**
   * GET /workspaces/:wsId/conversations
   * Returns paginated, filtered list.
   * BE supports: status, priority, direction, channelType,
   *              assigneeId (uuid | "me" | "unassigned"), teamId,
   *              unreplied (bool), search, cursor, limit
   */
  getConversations(
    filters: ConversationFilters = {}
  ): Promise<PaginatedConversations> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "all") {
        params.set(k, String(v));
      }
    });
    const qs = params.toString();
    return api.get(`/conversations${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /workspaces/:wsId/conversations/search?q=...
   * Full-text search across message content.
   * Returns list of matched snippets with conversationId.
   */
  searchMessages(
    workspaceId: string,
    q: string
  ): Promise<MessageSearchResult[]> {
    return api.get(
      `/conversations/search?q=${encodeURIComponent(q)}`
    );
  },

  /**
   * GET /workspaces/:wsId/conversations/:id
   */
  getConversation(
    workspaceId: string,
    conversationId: string
  ): Promise<ApiConversation> {
    return api.get(`/conversations/${conversationId}`);
  },

  /* ─── Messages ──────────────────────────────────────────────── */

  /**
   * GET /workspaces/:wsId/conversations/:id/messages?cursor=...&limit=30
   * Cursor-based pagination, newest-first from BE → FE reverses for display.
   */
  getMessages(
    workspaceId: string,
    conversationId: string,
    cursor?: string,
    limit = 30
  ): Promise<{ data: ApiMessage[]; nextCursor?: string }> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return api.get(
      `/conversations/${conversationId}/messages?${params}`
    );
  },

  /**
   * GET /workspaces/:wsId/conversations/:id/timeline
   * Returns merged messages + activities sorted by timestamp.
   */
  getTimeline(
    workspaceId: string,
    conversationId: string,
    cursor?: string,
    limit = 30
  ): Promise<{ data: ApiTimelineItem[]; nextCursor?: string }> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return api.get(
      `/conversations/${conversationId}/timeline?${params}`
    );
  },

  /**
   * POST /workspaces/:wsId/conversations/:id/messages
   * Body: { channelId, text?, attachments?, metadata? }
   * Returns the created Message.
   */
  sendMessage(
    conversationId: string,
    channelId: string,
    payload: {
      text?: string;
      attachments?: Array<{ type: string; url: string; name: string; mimeType?: string }>;
      metadata?: Record<string, any>;
    }
  ): Promise<ApiMessage> {
    return api.post(
      `/conversations/${conversationId}/messages`, { conversationId, channelId, ...payload }

    );
  },

  /**
   * POST /workspaces/:wsId/conversations/:id/notes
   * Sends an internal note (type = "note").
   */
  sendNote(
    workspaceId: string,
    conversationId: string,
    text: string,
    mentionedUserIds?: string[]
  ): Promise<ApiActivity> {
    return api.post(
      `/conversations/${conversationId}/notes`, { text, mentionedUserIds }

    );
  },

  /* ─── Conversation state mutations ──────────────────────────── */

  close(workspaceId: string, conversationId: string): Promise<void> {
    return api.post(
      `/conversations/${conversationId}/close`
    );
  },

  open(workspaceId: string, conversationId: string): Promise<void> {
    return api.post(
      `/conversations/${conversationId}/open`
    );
  },

  setPending(workspaceId: string, conversationId: string): Promise<void> {
    return api.post(
      `/conversations/${conversationId}/pending`    );
  },

  assignUser(
    workspaceId: string,
    conversationId: string,
    userId: string
  ): Promise<void> {
    return api.post(
      `/conversations/${conversationId}/assign/user`,{ userId }
    );
  },

  unassignUser(workspaceId: string, conversationId: string): Promise<void> {
    return api.delete(
      `/conversations/${conversationId}/assign/user`
    );
  },

  assignTeam(
    workspaceId: string,
    conversationId: string,
    teamId: string
  ): Promise<void> {
    return api.post(
      `/conversations/${conversationId}/assign/team`,{ teamId }
    );
  },

  unassignTeam(workspaceId: string, conversationId: string): Promise<void> {
    return api.delete(
      `/conversations/${conversationId}/assign/team`
    );
  },

  setPriority(
    workspaceId: string,
    conversationId: string,
    priority: ConvPriority
  ): Promise<void> {
    return api.put(
      `/conversations/${conversationId}/priority`,{ priority }
    );
  },

  markRead(workspaceId: string, conversationId: string): Promise<void> {
    return api.post(
      `/conversations/${conversationId}/read`
    );
  },

  updateContactLifecycle(contactId: string, lifecycleId: string): Promise<void> {
    return api.put(
      `/contacts/${contactId}/lifecycle`,{ lifecycleId }
    );
  },

  /* ─── Media / upload ────────────────────────────────────────── */

  /**
   * POST /workspaces/:wsId/messages/presign
   * Returns { uploadUrl, fileUrl } for direct R2 upload.
   */
  getPresignedUploadUrl(
    opts: {
      type: "message-attachment" | "user-avatar";
      fileName: string;
      contentType: string;
      entityId: string;
    },
    workspaceId?: string,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    return api.post(`/files/presign`, opts);
  },
};