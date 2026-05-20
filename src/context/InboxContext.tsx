/**
 * InboxContext.tsx
 * ─────────────────────────────────────────────────────────────────
 * Central state for the inbox page.
 *
 * What's new vs the old version:
 *  ✓ Server-driven conversation list (cursor pagination)
 *  ✓ Full filter state: status, priority, direction, channel, assignee, unreplied
 *  ✓ Server-side conversation search (contact name / phone / email)
 *  ✓ Timeline API (merged messages + activities)
 *  ✓ All conversation mutations wired to BE: close/open/pending, assign user/team, priority
 *  ✓ Internal note sending via dedicated endpoint
 *  ✓ Real-time: socket events upsert conversations + append messages
 *  ✓ Presigned upload → direct R2 upload helper
 *  ✓ Proper workspaceId threading (no more missing wsId bugs)
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useNotifications } from "./NotificationContext";
import { useSocket } from "../socket/socket-provider";
import { useWorkspace } from "./WorkspaceContext";
import { useAuth } from "./AuthContext";
import {
  contactsApi,
  type ContactMergePreview,
  type ContactMergeResult,
} from "../lib/contactApi";
import { ApiError, CONTACT_CHANNEL_IDENTIFIER_CONFLICT } from "../lib/apiClient";
import {
  inboxApi,
  ApiConversation,
  ApiMessage,
  ApiTimelineItem,
  TimelineWindowResult,
  ConversationFilters,
  ConversationCountSummary,
  ConvStatus,
  ConvPriority,
} from "../lib/inboxApi";
import { workspaceApi } from "../lib/workspaceApi";
import { useFeatureFlags } from "./FeatureFlagContext";
import { useChannel } from "./ChannelContext";
import { getContactScopedChannels, isSameChannel } from "../pages/inbox/channelUtils";
import {
  ChannelIdentityConflictModal,
  type ChannelIdentityConflictContact,
  type ChannelIdentityConflictDetails,
} from "../pages/inbox/ChannelIdentityConflictModal";
import { MergeModal } from "../pages/inbox/contact-sidebar/MergeModal";
import type { SidebarContact } from "../pages/inbox/contact-sidebar/types";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */

export type { ApiConversation, ApiMessage, ApiTimelineItem };

type InboxContactMergeResult = ContactMergeResult & {
  survivorConversation?: ApiConversation | null;
};

export interface InboxFilters extends ConversationFilters {
  // extends the API filter type — status, priority, direction,
  // channelType, assigneeId, teamId, unreplied, search, cursor, limit
}

export interface InboxContextType {
  /* Conversation list */
  convList: ApiConversation[];
  convLoading: boolean;
  hasMoreConvs: boolean;
  conversationCounts: ConversationCountSummary;
  conversationCountsLoading: boolean;
  loadMoreConversations: () => void;
  refreshConversations: () => Promise<ApiConversation[]>;
  refreshConversationCounts: () => Promise<ConversationCountSummary | null>;

  /* Filters */
  filters: InboxFilters;
  setFilters: (f: Partial<InboxFilters>) => void;
  resetFilters: () => void;

  /* Conversation search (by contact name / phone / email) */
  convSearch: string;
  setConvSearch: (q: string) => void;

  /* Selected conversation */
  selectedConversation: ApiConversation | null;
  selectConversation: (
    conv: ApiConversation,
    options?: { targetMessageId?: string | null; preserveSearch?: boolean },
  ) => void;

  /* Timeline (messages + activities merged) */
  timeline: ApiTimelineItem[];
  timelineLoading: boolean;
  loadingOlderTimeline: boolean;
  loadingNewerTimeline: boolean;
  hasMoreOlderTimeline: boolean;
  hasMoreNewerTimeline: boolean;
  targetMessageId: string | null;
  requestedTargetMessageId: string | null;
  loadOlderTimeline: () => Promise<void>;
  loadNewerTimeline: () => Promise<void>;

  /* Channels */
  channels: any[] | null;
  selectedChannel: any;
  handleChannelChange: (channel: any) => void;

  /* Contact detail */
  selectedContact: any;
  refreshContact: () => Promise<void>;

  /* Input mode */
  inputMode: "reply" | "note";
  setInputMode: React.Dispatch<React.SetStateAction<"reply" | "note">>;
  lifecycles: any[];
  /* Message search (within open conversation) */
  msgSearchOpen: boolean;
  msgSearch: string;
  toggleMsgSearch: () => void;
  setMsgSearch: React.Dispatch<React.SetStateAction<string>>;

  /* Snooze */
  snoozedUntil: string | null;
  setSnoozedUntil: React.Dispatch<React.SetStateAction<string | null>>;

  /* Actions */
  sendMessage: (payload: {
    text?: string;
    attachments?: Array<{
      type: string;
      url: string;
      name: string;
      mimeType?: string;
    }>;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  fetchLifecycles: () => Promise<void>;
  sendNote: (text: string, mentionedUserIds?: string[]) => Promise<void>;
  closeConversation: () => Promise<void>;
  openConversation: () => Promise<void>;
  setPendingConversation: () => Promise<void>;
  assignUser: (userId: string | null) => Promise<void>;
  assignTeam: (teamId: string | null) => Promise<void>;
  setPriority: (priority: ConvPriority) => Promise<void>;
  uploadFile: (file: File, entityId: string) => Promise<string>;

  /* Workspace users */
  workspaceUsers: any[];
}

/* ══════════════════════════════════════════════════════════════════
   DEFAULT FILTERS
══════════════════════════════════════════════════════════════════ */

const DEFAULT_FILTERS: InboxFilters = {
  status: "open",
  // priority: "all",
  // direction: "all",
  // // channelType: "all",
  // assigneeId: undefined,
  // teamId: undefined,
  // unreplied: false,
  limit: 25,
};

const DEFAULT_CONVERSATION_COUNTS: ConversationCountSummary = {
  all: { total: 0, unread: 0 },
  mine: { total: 0, unread: 0 },
  unassigned: { total: 0, unread: 0 },
};

function buildConversationCountFilters(
  filters: InboxFilters,
  search: string,
): ConversationFilters {
  const {
    assigneeId: _assigneeId,
    lifecycleId: _lifecycleId,
    cursor: _cursor,
    limit: _limit,
    ...countFilters
  } = filters;

  return {
    ...countFilters,
    search: search || undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function optionalId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
}

function readConflictContact(value: unknown): ChannelIdentityConflictContact | null {
  if (!isRecord(value)) return null;

  return {
    id: optionalId(value.id),
    firstName: optionalString(value.firstName),
    lastName: optionalString(value.lastName),
    email: optionalString(value.email),
    phone: optionalString(value.phone),
    company: optionalString(value.company),
    avatarUrl: optionalString(value.avatarUrl),
  };
}

function buildChannelIdentityConflict(
  error: unknown,
  currentContact: unknown,
): ChannelIdentityConflictDetails | null {
  if (!(error instanceof ApiError) || error.code !== CONTACT_CHANNEL_IDENTIFIER_CONFLICT) {
    return null;
  }

  const data = isRecord(error.data) ? error.data : {};
  const identifierField = optionalString(data.identifierField);
  const identifier = optionalString(data.identifier);
  const existingContact =
    readConflictContact(data.existingContact) ??
    ({
      id: optionalId(data.existingContactId),
      firstName: optionalString(data.existingContactName),
      ...(identifierField === "email" ? { email: identifier } : { phone: identifier }),
    } satisfies ChannelIdentityConflictContact);

  return {
    channelType: optionalString(data.channelType),
    channelLabel: optionalString(data.channelLabel),
    identifier,
    identifierField,
    message: optionalString(data.message) ?? error.message,
    currentContact: readConflictContact(currentContact),
    existingContact,
    existingContactName: optionalString(data.existingContactName),
  };
}

/* ══════════════════════════════════════════════════════════════════
   CONTEXT
══════════════════════════════════════════════════════════════════ */

const InboxContext = createContext<InboxContextType | null>(null);

export const InboxProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { notify } = useNotifications();
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  const { socket } = useSocket();
  const { user } = useAuth();
  const { activeWorkspace, refreshWorkspaceUsers, workspaceUsers } = useWorkspace();
  const { flags } = useFeatureFlags();

  const wsId = activeWorkspace?.id as string | undefined;

  /* ── Filters ── */
  const [filters, _setFilters] = useState<InboxFilters>(DEFAULT_FILTERS);
  const [convSearch, setConvSearch] = useState("");

  const setFilters = useCallback((partial: Partial<InboxFilters>) => {

    _setFilters((prev) => {
      return { ...prev, ...partial, cursor: undefined };
    });
  }, []);

  const resetFilters = useCallback(() => {
    _setFilters(DEFAULT_FILTERS);
    setConvSearch("");
  }, []);

  /* ── Conversation list ── */
  const [convList, setConvList] = useState<ApiConversation[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [nextConvCursor, setNextConvCursor] = useState<string | undefined>();
  const [hasMoreConvs, setHasMoreConvs] = useState(false);
  const [conversationCounts, setConversationCounts] =
    useState<ConversationCountSummary>(DEFAULT_CONVERSATION_COUNTS);
  const [conversationCountsLoading, setConversationCountsLoading] = useState(false);
  const conversationRequestIdRef = useRef(0);
  const conversationAbortRef = useRef<AbortController | null>(null);
  const conversationLoadingRef = useRef(false);
  const conversationCountsRequestIdRef = useRef(0);
  const conversationCountsAbortRef = useRef<AbortController | null>(null);

  /* ── Selected conversation ── */
  const [selectedConversation, setSelectedConversation] =
    useState<ApiConversation | null>(null);
  const selectedConvIdRef = useRef<string | undefined>();
  const selectedContactRef = useRef<any>(null);

  /* ── Timeline ── */
  const [timeline, setTimeline] = useState<ApiTimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [loadingOlderTimeline, setLoadingOlderTimeline] = useState(false);
  const [loadingNewerTimeline, setLoadingNewerTimeline] = useState(false);
  const [nextTimelineCursor, setNextTimelineCursor] = useState<string | undefined>();
  const [hasMoreOlderTimeline, setHasMoreOlderTimeline] = useState(false);
  const [hasMoreNewerTimeline, setHasMoreNewerTimeline] = useState(false);
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null);
  const [requestedTargetMessageId, setRequestedTargetMessageId] = useState<string | null>(null);
  const [lifecycles, setLifecycles] = useState<any[]>([]);

  /* ── Channels ── */
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  /* ── Contact detail ── */
  const [selectedContact, setSelectedContact] = useState<any>(null);

  /* ── UI state ── */
  const [inputMode, setInputMode] = useState<"reply" | "note">("reply");
  const [snoozedUntil, setSnoozedUntil] = useState<string | null>(null);
  const [msgSearchOpen, setMsgSearchOpen] = useState(false);
  const [msgSearch, setMsgSearch] = useState("");
  const [channelIdentityConflict, setChannelIdentityConflict] =
    useState<ChannelIdentityConflictDetails | null>(null);
  const [channelMergePreview, setChannelMergePreview] =
    useState<ContactMergePreview | null>(null);
  const [channelMergeCurrentContact, setChannelMergeCurrentContact] =
    useState<SidebarContact | null>(null);
  const [channelMergeDuplicateContact, setChannelMergeDuplicateContact] =
    useState<SidebarContact | null>(null);
  const [channelMergePreviewLoading, setChannelMergePreviewLoading] = useState(false);
  const [channelMergeLoading, setChannelMergeLoading] = useState(false);
  const [channelMergeError, setChannelMergeError] = useState<string | null>(null);

  const clearChannelIdentityConflict = useCallback(() => {
    setChannelIdentityConflict(null);
    setChannelMergePreview(null);
    setChannelMergeCurrentContact(null);
    setChannelMergeDuplicateContact(null);
    setChannelMergePreviewLoading(false);
    setChannelMergeLoading(false);
    setChannelMergeError(null);
  }, []);

  /* ── Workspace users (for assignee picker) ── */
  const { channels } = useChannel();
  /* ══════════════════════════════════════════════════════════════
     BOOTSTRAP
  ══════════════════════════════════════════════════════════════ */

  useEffect(() => {
    refreshWorkspaceUsers();
  }, [refreshWorkspaceUsers]);

  useEffect(() => {
    if (!wsId) return;

    if (!selectedChannel && channels.length > 0)
      setSelectedChannel(channels[0]);
  }, [wsId]);

  useEffect(() => {

    setSelectedConversation((prev) => {
      if (prev) {
        const updatedConv = convList.find((c) => c.id === prev.id);
        return updatedConv || prev;
      }
      return prev;
    });
  }, [convList]);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  /* ══════════════════════════════════════════════════════════════
     LOAD CONVERSATIONS  (re-fetches when filters / search change)
  ══════════════════════════════════════════════════════════════ */

  const fetchConversations = useCallback(
    async (replace: boolean) => {
      if (!wsId) return;
      if (!replace && conversationLoadingRef.current) return;

      const requestId = conversationRequestIdRef.current + 1;
      conversationRequestIdRef.current = requestId;
      conversationAbortRef.current?.abort();
      const controller = new AbortController();
      conversationAbortRef.current = controller;
      conversationLoadingRef.current = true;
      setConvLoading(true);
      try {
        const result = await inboxApi.getConversations({
          ...filters,
          search: convSearch || undefined,
          cursor: replace ? undefined : nextConvCursor,
        }, {
          signal: controller.signal,
        });
        if (requestId !== conversationRequestIdRef.current) return;
        setConvList((prev) =>
          replace ? result.data : [...prev, ...result.data],
        );
        setNextConvCursor(result.nextCursor);
        setHasMoreConvs(!!result.nextCursor);
      } catch (err) {
        if (controller.signal.aborted) return;
      } finally {
        if (requestId === conversationRequestIdRef.current) {
          conversationLoadingRef.current = false;
          if (conversationAbortRef.current === controller) {
            conversationAbortRef.current = null;
          }
          setConvLoading(false);
        }
      }
    },
    [wsId, filters, convSearch, nextConvCursor],
  );

  const refreshConversations = useCallback(async () => {
    if (!wsId) return [];

    const requestId = conversationRequestIdRef.current + 1;
    conversationRequestIdRef.current = requestId;
    conversationAbortRef.current?.abort();
    const controller = new AbortController();
    conversationAbortRef.current = controller;
    conversationLoadingRef.current = true;
    setConvLoading(true);
    try {
      const result = await inboxApi.getConversations({
        ...filters,
        search: convSearch || undefined,
        cursor: undefined,
      }, {
        signal: controller.signal,
      });
      if (requestId !== conversationRequestIdRef.current) return [];
      setConvList(result.data);
      setNextConvCursor(result.nextCursor);
      setHasMoreConvs(!!result.nextCursor);
      return result.data;
    } catch (err) {
      if (controller.signal.aborted) return [];
      return [];
    } finally {
      if (requestId === conversationRequestIdRef.current) {
        conversationLoadingRef.current = false;
        if (conversationAbortRef.current === controller) {
          conversationAbortRef.current = null;
        }
        setConvLoading(false);
      }
    }
  }, [wsId, filters, convSearch]);

  const refreshConversationCounts = useCallback(async () => {
    if (!wsId) {
      setConversationCounts(DEFAULT_CONVERSATION_COUNTS);
      return null;
    }

    const requestId = conversationCountsRequestIdRef.current + 1;
    conversationCountsRequestIdRef.current = requestId;
    conversationCountsAbortRef.current?.abort();
    const controller = new AbortController();
    conversationCountsAbortRef.current = controller;
    setConversationCountsLoading(true);

    try {
      const result = await inboxApi.getConversationCounts(
        buildConversationCountFilters(filters, convSearch),
        { signal: controller.signal },
      );
      if (requestId !== conversationCountsRequestIdRef.current) return null;
      setConversationCounts(result);
      return result;
    } catch (err) {
      if (controller.signal.aborted) return null;
      return null;
    } finally {
      if (requestId === conversationCountsRequestIdRef.current) {
        if (conversationCountsAbortRef.current === controller) {
          conversationCountsAbortRef.current = null;
        }
        setConversationCountsLoading(false);
      }
    }
  }, [wsId, filters, convSearch]);

  /* Initial load + re-load when filters change */
  useEffect(() => {
    fetchConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId, filters, convSearch]);

  useEffect(() => {
    void refreshConversationCounts();
  }, [refreshConversationCounts]);

  const loadMoreConversations = useCallback(() => {
    if (!conversationLoadingRef.current && hasMoreConvs) fetchConversations(false);
  }, [hasMoreConvs, fetchConversations]);

  useEffect(() => {
    return () => {
      conversationRequestIdRef.current += 1;
      conversationAbortRef.current?.abort();
      conversationCountsRequestIdRef.current += 1;
      conversationCountsAbortRef.current?.abort();
    };
  }, []);

  /* ══════════════════════════════════════════════════════════════
     SELECT CONVERSATION → load timeline
  ══════════════════════════════════════════════════════════════ */

  const mergeUniqueTimelineItems = useCallback(
    (items: ApiTimelineItem[]) => {
      const seen = new Set<string>();
      return items.filter((item) => {
        const key = `${item.type}:${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    [],
  );

  const applyTimelineWindow = useCallback(
    (
      result: TimelineWindowResult,
      mode: "replace" | "prepend" | "append",
    ) => {
      setTimeline((prev) => {
        const next =
          mode === "replace"
            ? result.data
            : mode === "prepend"
              ? [...result.data, ...prev]
              : [...prev, ...result.data];
        return mergeUniqueTimelineItems(next);
      });

      if (mode === "replace") {
        setHasMoreOlderTimeline(!!result.hasMoreOlder || !!result.nextCursor);
        setHasMoreNewerTimeline(!!result.hasMoreNewer);
      } else {
        if (result.hasMoreOlder !== undefined) setHasMoreOlderTimeline(!!result.hasMoreOlder);
        if (result.hasMoreNewer !== undefined) setHasMoreNewerTimeline(!!result.hasMoreNewer);
      }

      if (result.nextCursor !== undefined) {
        setNextTimelineCursor(result.nextCursor);
      }

      if (mode === "replace") {
        setTargetMessageId(result.targetFound === false ? null : (result.targetMessageId ?? null));
      }
    },
    [mergeUniqueTimelineItems],
  );

  const fetchLatestTimeline = useCallback(
    async (convId: string) => {
      if (!wsId) return;
      setTimelineLoading(true);
      try {
        const result = await inboxApi.getTimeline(wsId, convId, { limit: 30 });
        applyTimelineWindow(result, "replace");
      } catch (err) {
      } finally {
        setTimelineLoading(false);
      }
    },
    [applyTimelineWindow, wsId],
  );

  const fetchTimelineAroundMessage = useCallback(
    async (convId: string, messageId: string) => {
      if (!wsId) return;
      setTimelineLoading(true);
      try {
        const result = await inboxApi.getTimeline(wsId, convId, {
          aroundMessageId: messageId,
          before: 20,
          after: 20,
          limit: 40,
        });
        applyTimelineWindow(result, "replace");
      } catch (err) {
      } finally {
        setTimelineLoading(false);
      }
    },
    [applyTimelineWindow, wsId],
  );

  const fetchLifecycles = useCallback(async () => {
    if (!flags.lifecycle) {
      setLifecycles([]);
      _setFilters((prev) =>
        prev.lifecycleId == null ? prev : { ...prev, lifecycleId: undefined, cursor: undefined },
      );
      return;
    }

    const result = await workspaceApi.getLifecycleStages();
    setLifecycles(result);
  }, [activeWorkspace?.id, flags.lifecycle]);

  const getBoundaryMessageId = useCallback(
    (direction: "older" | "newer") => {
      const items = direction === "older" ? timeline : [...timeline].reverse();
      const boundary = items.find((item) => item.type === "message" && item.message?.id);
      return boundary?.message?.id;
    },
    [timeline],
  );

  const loadOlderTimeline = useCallback(async () => {
    if (!wsId || !selectedConversation || loadingOlderTimeline || !hasMoreOlderTimeline) return;

    const anchorMessageId = getBoundaryMessageId("older");
    if (!anchorMessageId) {
      if (!timelineLoading && nextTimelineCursor) {
        setLoadingOlderTimeline(true);
        try {
          const result = await inboxApi.getTimeline(wsId, selectedConversation.id, {
            cursor: nextTimelineCursor,
            limit: 30,
          });
          applyTimelineWindow(result, "prepend");
        } catch (err) {
        } finally {
          setLoadingOlderTimeline(false);
        }
      }
      return;
    }

    setLoadingOlderTimeline(true);
    try {
      const result = await inboxApi.getTimeline(wsId, selectedConversation.id, {
        anchorMessageId,
        direction: "older",
        limit: 30,
      });
      applyTimelineWindow(result, "prepend");
    } catch (err) {
    } finally {
      setLoadingOlderTimeline(false);
    }
  }, [
    applyTimelineWindow,
    getBoundaryMessageId,
    hasMoreOlderTimeline,
    loadingOlderTimeline,
    nextTimelineCursor,
    selectedConversation,
    timelineLoading,
    wsId,
  ]);

  const loadNewerTimeline = useCallback(async () => {
    if (!wsId || !selectedConversation || loadingNewerTimeline || !hasMoreNewerTimeline) return;

    const anchorMessageId = getBoundaryMessageId("newer");
    if (!anchorMessageId) return;

    setLoadingNewerTimeline(true);
    try {
      const result = await inboxApi.getTimeline(wsId, selectedConversation.id, {
        anchorMessageId,
        direction: "newer",
        limit: 30,
      });
      applyTimelineWindow(result, "append");
    } catch (err) {
    } finally {
      setLoadingNewerTimeline(false);
    }
  }, [
    applyTimelineWindow,
    getBoundaryMessageId,
    hasMoreNewerTimeline,
    loadingNewerTimeline,
    selectedConversation,
    wsId,
  ]);

  /* ══════════════════════════════════════════════════════════════
     REFRESH CONTACT
  ══════════════════════════════════════════════════════════════ */

  const refreshContact = useCallback(async () => {
    if (!selectedConversation?.contactId) return;
    try {
      const detail = await contactsApi.getContact(
        selectedConversation.contactId,
      );
      setSelectedContact(detail);
    } catch {}
  }, [selectedConversation?.contactId]);

  /* ══════════════════════════════════════════════════════════════
     REAL-TIME SOCKET EVENTS
  ══════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (!socket || !activeWorkspace?.id) return;

    const mergeConversation = (
      current: ApiConversation,
      incoming: Partial<ApiConversation>,
    ): ApiConversation => ({
      ...current,
      ...incoming,
      contact: incoming.contact
        ? {
            ...(current.contact ?? {}),
            ...incoming.contact,
          }
        : current.contact,
      lastMessage: incoming.lastMessage
        ? {
            ...(current.lastMessage ?? {}),
            ...incoming.lastMessage,
          }
        : current.lastMessage,
    });

    const upsertTimelineMessage = (
      prev: ApiTimelineItem[],
      message: ApiMessage & { conversationId: string },
    ) => {
      const existingIndex = prev.findIndex(
        (item) => item.type === "message" && item.message?.id === message.id,
      );

      const nextItem: ApiTimelineItem = {
        id: message.id,
        type: "message",
        timestamp: message.createdAt,
        message,
      };

      if (existingIndex === -1) {
        return [...prev, nextItem];
      }

      return prev.map((item, index) =>
        index === existingIndex
          ? {
              ...item,
              timestamp: message.createdAt,
              message: {
                ...item.message,
                ...message,
              },
            }
          : item,
      );
    };

    const onMessage = (msg: ApiMessage & { conversationId: string }) => {
      // Append to timeline if this conv is open
      let message = msg;
      if (message.conversationId === selectedConvIdRef.current) {
        setTimeline((prev) => upsertTimelineMessage(prev, message));
      }

      // Update conversation list
      setConvList((prev) => {
        const isSelected = message.conversationId === selectedConvIdRef.current;
        const existing = prev.find((c) => c.id === message.conversationId);

        if (!existing) {
          // Unknown conv — re-fetch list to pick it up
          fetchConversations(true);
          return prev;
        }

        const rest = prev.filter((c) => c.id !== message.conversationId);
        return [
          {
            ...existing,
            lastMessage: message as any,
            lastMessageAt: message.createdAt,
            unreadCount: isSelected ? 0 : existing.unreadCount + 1,
          },
          ...rest,
        ];
      });
      void refreshConversationCounts();

      if (message.conversationId !== selectedConvIdRef.current) {
        notifyRef.current({
          type: "new_message",
          title: "New message",
          body: message.text || "Attachment",
          conversationId: message.conversationId as any,
        });
      }
    };

    const onStatusUpdate = (data: {
      conversationId: string;
      messageId: string;
      status: "delivered" | "read" | "failed";
    }) => {
      // Update timeline message
      if (data.conversationId === selectedConvIdRef.current) {
        setTimeline((prev) =>
          prev.map((item) => {
            if (item.type !== "message" || !item.message) return item;

            if (item.message.id === data.messageId) {
              return {
                ...item,
                message: {
                  ...item.message,
                  status: data.status,
                },
              };
            }

            return item;
          }),
        );
      }

      // Update conversation list lastMessage status
      // setConvList((prev) =>
      //   prev.map((conv) => {
      //     if (conv.id !== data.conversationId) return conv;

      //     if (conv.lastMessage?.id !== data.messageId) return conv;

      //     return {
      //       ...conv,
      //       lastMessage: {
      //         ...conv.lastMessage,
      //         status: data.status,
      //       },
      //     };
      //   })
      // );
    };

    const onConversation = (conv: ApiConversation) => {
      setConvList((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        if (!exists) return [conv, ...prev];

        return prev.map((c) => (c.id === conv.id ? mergeConversation(c, conv) : c));
      });

      if (conv.id === selectedConvIdRef.current) {
        setSelectedConversation((prev) =>
          prev ? mergeConversation(prev, conv) : conv,
        );
      }
      void refreshConversationCounts();

      if (conv.contact && conv.contact.id === selectedContactRef.current?.id) {
        setSelectedContact((prev: any) =>
          prev
            ? {
                ...prev,
                ...conv.contact,
              }
            : conv.contact,
        );
      }
    };

    const onContactUpdated = (contact: any) => {
      if (!contact?.id) return;

      setConvList((prev) =>
        prev.map((conv) =>
          conv.contact?.id === contact.id
            ? mergeConversation(conv, {
                contact: {
                  ...conv.contact,
                  ...contact,
                },
              } as Partial<ApiConversation>)
            : conv,
        ),
      );

      setSelectedConversation((prev) =>
        prev && prev.contact?.id === contact.id
          ? mergeConversation(prev, {
              contact: {
                ...prev.contact,
                ...contact,
              },
            } as Partial<ApiConversation>)
          : prev,
      );

      setSelectedContact((prev: any) =>
        prev?.id === contact.id
          ? {
              ...prev,
              ...contact,
            }
          : prev,
      );
      void refreshConversationCounts();
    };

    const onContactMerged = async (payload: {
      primaryContactId: string;
      secondaryContactId: string;
      survivorConversationId?: string | null;
      mergedConversationIds?: string[];
    }) => {
      const mergedIds = new Set(payload.mergedConversationIds ?? []);

      if (mergedIds.size > 0) {
        setConvList((prev) => prev.filter((conv) => !mergedIds.has(conv.id)));
        void refreshConversationCounts();
      }

      const selectedConvId = selectedConvIdRef.current;
      const selectedWasMerged =
        !!selectedConvId && mergedIds.has(selectedConvId);

      if (!selectedWasMerged) {
        return;
      }

      const conversations = await refreshConversations();
      const survivorConversation = conversations.find(
        (conv) => conv.id === payload.survivorConversationId,
      );

      if (survivorConversation) {
        const nextConversation = {
          ...survivorConversation,
          unreadCount: 0,
        };
        setSelectedConversation(nextConversation);
        selectedConvIdRef.current = survivorConversation.id;
        setTimeline([]);
        setNextTimelineCursor(undefined);
        setHasMoreOlderTimeline(false);
        setHasMoreNewerTimeline(false);
        setTargetMessageId(null);
        setMsgSearch("");
        setMsgSearchOpen(false);
        setInputMode("reply");
        fetchLatestTimeline(survivorConversation.id);
        contactsApi
          .getContact(survivorConversation.contactId)
          .then(setSelectedContact)
          .catch(() => {});
      } else {
        setSelectedConversation(null);
        selectedConvIdRef.current = undefined;
        setTimeline([]);
      }
    };

    const onActivity = (item: ApiTimelineItem) => {
      if (item.activity?.conversationId === selectedConvIdRef.current) {
        setTimeline((prev) => [...prev, item]);
      }
    };

    const onActivityUpsert = (item: ApiTimelineItem) => {
      if (item.activity?.conversationId === selectedConvIdRef.current) {
        setTimeline((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, ...item } : i)),
        );
      }
    };

    socket.on("message.upsert", onMessage);
    socket.on("message.status_updated", onStatusUpdate);
    socket.on("activity.upsert", onActivityUpsert);
    socket.on("conversation.upsert", onConversation);
    socket.on("contact:updated", onContactUpdated);
    socket.on("activity", onActivity);
    socket.on("contact:merged", onContactMerged);

    return () => {
      socket.off("message.upsert", onMessage);
      socket.off("message.status_updated", onStatusUpdate);
      socket.off("conversation.upsert", onConversation);
      socket.off("contact:updated", onContactUpdated);
      socket.off("activity", onActivity);
      socket.off("contact:merged", onContactMerged);
    };
  }, [
    socket,
    activeWorkspace?.id,
    fetchConversations,
    refreshConversations,
    refreshConversationCounts,
    fetchLatestTimeline,
  ]);

  /* ══════════════════════════════════════════════════════════════
     SEND MESSAGE
  ══════════════════════════════════════════════════════════════ */

  const sendMessage = useCallback(
    async (msg: any) => {
      const resolvedChannelId =
        msg.channelId ??
        msg.channel?.id ??
        selectedChannel?.id;
      const quotedMessage = msg.metadata?.quotedMessage ?? msg.metadata?.replyTo;
      const payload: any = {
        ...(msg.text && { text: msg.text }),
        ...(msg.attachments?.length && { attachments: msg.attachments }),
        ...(quotedMessage?.id && { replyToMessageId: String(quotedMessage.id) }),
        ...((msg.metadata || quotedMessage) && {
          metadata: {
            ...(msg.metadata ?? {}),
            ...(quotedMessage ? { quotedMessage } : {}),
          },
        }),
      };

      if (payload.metadata?.replyTo) delete payload.metadata.replyTo;

      if (msg.template) {
        payload.metadata = {
          template: msg.template,
        };
      }

      try {
        await inboxApi.sendMessage(
          selectedConversation?.id!,
          resolvedChannelId,
          payload,
        );
      } catch (error) {
        const conflict = buildChannelIdentityConflict(
          error,
          selectedContact ?? selectedConversation?.contact,
        );
        if (conflict) {
          setChannelIdentityConflict(conflict);
          setChannelMergePreview(null);
          setChannelMergeCurrentContact(null);
          setChannelMergeDuplicateContact(null);
          setChannelMergeError(null);
        }
        return;
      }

      if (
        user?.id &&
        selectedConversation?.contact &&
        selectedConversation.contact.assigneeId !== user.id
      ) {
        const assignee = workspaceUsers?.find((member: any) => member.id === user.id);
        updateSelectedConv({
          contact: {
            ...selectedConversation.contact,
            assigneeId: user.id,
            ...(assignee ? { assignee } : {}),
          },
        });
        setSelectedContact((prev: any) =>
          prev?.id === selectedConversation.contact.id
            ? {
                ...prev,
                assigneeId: user.id,
                ...(assignee ? { assignee } : {}),
              }
            : prev,
        );
      }

    },
    [selectedChannel?.id, selectedConversation, selectedContact, user?.id, workspaceUsers],
  );

  // const sendMessage = useCallback(
  //   async (payload: {
  //     text?: string;
  //     attachments?: Array<{ type: string; url: string; name: string; mimeType?: string }>;
  //     metadata?: Record<string, any>;
  //   }) => {
  //     if (!wsId || !selectedConversation || !selectedChannel) return;

  //     // Optimistic: append a pending item
  //     const tempId = `temp-${Date.now()}`;
  //     const optimistic: ApiTimelineItem = {
  //       id:        tempId,
  //       type:      "message",
  //       timestamp: new Date().toISOString(),
  //       message: {
  //         // id:             tempId,
  //         // conversationId: selectedConversation.id,
  //         channelId:      selectedChannel.id,
  //         // type:           "text",
  //         // direction:      "outgoing",
  //         text:           payload.text,
  //         // status:         "pending",
  //         createdAt:      new Date().toISOString(),
  //       } as any,
  //     };
  //     setTimeline((prev) => [...prev, optimistic]);

  //     try {
  //       const saved = await inboxApi.sendMessage(
  //         wsId,
  //         selectedConversation.id,
  //         selectedChannel.id,
  //         payload
  //       );
  //       // Replace optimistic with real
  //       setTimeline((prev) =>
  //         prev.map((item) =>
  //           item.id === tempId
  //             ? { id: saved.id, type: "message", timestamp: saved.createdAt, message: saved }
  //             : item
  //         )
  //       );
  //     } catch (err) {
  //       // Mark failed
  //       setTimeline((prev) =>
  //         prev.map((item) =>
  //           item.id === tempId
  //             ? { ...item, message: { ...item.message!, status: "failed" } as any }
  //             : item
  //         )
  //       );
  //     }
  //   },
  //   [wsId, selectedConversation, selectedChannel]
  // );

  /* ══════════════════════════════════════════════════════════════
     SEND NOTE
  ══════════════════════════════════════════════════════════════ */

  const sendNote = useCallback(
    async (text: string, mentionedUserIds?: string[]) => {
      if (!wsId || !selectedConversation) return;
      try {
        const activity = await inboxApi.sendNote(
          wsId,
          selectedConversation.id,
          text,
          mentionedUserIds,
        );
        const item: ApiTimelineItem = {
          id: activity.id,
          type: "activity",
          timestamp: activity.createdAt,
          activity,
        };
        setTimeline((prev) => [...prev, item]);
      } catch (err) {
      }
    },
    [wsId, selectedConversation],
  );

  /* ══════════════════════════════════════════════════════════════
     CONVERSATION MUTATIONS
     Each mutation:
      1. Calls BE
      2. Updates selectedConversation local state
      3. Updates convList
  ══════════════════════════════════════════════════════════════ */

  const updateSelectedConv = (patch: Partial<ApiConversation>) => {
    setSelectedConversation((prev) => (prev ? { ...prev, ...patch } : prev));
    setConvList((prev) =>
      prev.map((c) =>
        c.id === selectedConversation?.id ? { ...c, ...patch } : c,
      ),
    );
  };

  const updateSelectedContactStatus = (status: ConvStatus) => {
    if (!selectedConversation?.contact) return;

    const contact = { ...selectedConversation.contact, status };

    updateSelectedConv({ contact });
    setSelectedContact((prev: any) =>
      prev?.id === contact.id ? { ...prev, status } : prev,
    );
  };

  const closeConversation = useCallback(async () => {
    if (!wsId || !selectedConversation) return;
    await inboxApi.close(wsId, selectedConversation.id);
    updateSelectedContactStatus("closed");
    void refreshConversationCounts();
  }, [wsId, selectedConversation, refreshConversationCounts]);

  const openConversation = useCallback(async () => {
    if (!wsId || !selectedConversation) return;
    await inboxApi.open(wsId, selectedConversation.id);
    updateSelectedContactStatus("open");
    void refreshConversationCounts();
  }, [wsId, selectedConversation, refreshConversationCounts]);

  const setPendingConversation = useCallback(async () => {
    if (!wsId || !selectedConversation) return;
    await inboxApi.setPending(wsId, selectedConversation.id);
    updateSelectedContactStatus("pending");
    void refreshConversationCounts();
  }, [wsId, selectedConversation, refreshConversationCounts]);

  const assignUser = useCallback(
    async (userId: string | null) => {
      if (!wsId || !selectedConversation) return;
      if (userId) {
        await inboxApi.assignUser(wsId, selectedConversation.id, userId);
        updateSelectedConv({
          contact: { ...selectedConversation.contact, assigneeId: userId },
        });
      } else {
        await inboxApi.unassignUser(wsId, selectedConversation.id);
        updateSelectedConv({
          contact: { ...selectedConversation.contact, assigneeId: undefined },
        });
      }
      void refreshConversationCounts();
    },
    [wsId, selectedConversation, refreshConversationCounts],
  );

  const assignTeam = useCallback(
    async (teamId: string | null) => {
      if (!wsId || !selectedConversation) return;
      if (teamId) {
        await inboxApi.assignTeam(wsId, selectedConversation.id, teamId);
        updateSelectedConv({
          contact: { ...selectedConversation.contact, teamId },
        });
      } else {
        await inboxApi.unassignTeam(wsId, selectedConversation.id);
        updateSelectedConv({
          contact: { ...selectedConversation.contact, teamId: undefined },
        });
      }
      void refreshConversationCounts();
    },
    [wsId, selectedConversation, refreshConversationCounts],
  );

  const setPriority = useCallback(
    async (priority: ConvPriority) => {
      if (!wsId || !selectedConversation) return;
      await inboxApi.setPriority(wsId, selectedConversation.id, priority);
      updateSelectedConv({ priority });
      void refreshConversationCounts();
    },
    [wsId, selectedConversation, refreshConversationCounts],
  );

  /* ══════════════════════════════════════════════════════════════
     FILE UPLOAD  (presign → PUT directly to R2)
  ══════════════════════════════════════════════════════════════ */

  const uploadFile = useCallback(
    async (file: File, entityId: string): Promise<string> => {
      if (!wsId) throw new Error("No workspace");
      const { uploadUrl, fileUrl } = await inboxApi.getPresignedUploadUrl({
        type: "message-attachment",
        fileName: file.name,
        contentType: file.type,
        entityId,
      });
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      return fileUrl;
    },
    [wsId],
  );

  const selectConversation = useCallback(
    (conv: ApiConversation, options?: { targetMessageId?: string | null; preserveSearch?: boolean }) => {
      clearChannelIdentityConflict();
      setSelectedConversation({ ...conv, unreadCount: 0 });
      selectedConvIdRef.current = conv.id;
      setSelectedContact(null);

      setTimeline([]);
      setNextTimelineCursor(undefined);
      setHasMoreOlderTimeline(false);
      setHasMoreNewerTimeline(false);
      setTargetMessageId(options?.targetMessageId ?? null);
      setRequestedTargetMessageId(options?.targetMessageId ?? null);
      if (!options?.preserveSearch) {
        setMsgSearch("");
        setMsgSearchOpen(false);
      }
      setInputMode("reply");

      const inferredType =
        (conv as any)?.lastMessage?.channel?.type ??
        (conv as any)?.lastMessage?.channelType ??
        (conv as any)?.channel?.type ??
        (conv as any)?.contact?.contactChannels?.[0]?.channelType;
      const inferredId =
        (conv as any)?.lastMessage?.channelId ??
        (conv as any)?.lastMessage?.channel?.id ??
        (conv as any)?.channel?.id ??
        (conv as any)?.contact?.contactChannels?.[0]?.channelId;
      const matchedChannel = channels?.find(
        (c: any) =>
          (inferredId && c.id === inferredId) ||
          (inferredType && c.type === inferredType),
      );
      const contactScopedChannels = getContactScopedChannels(
        channels,
        (conv as any)?.contact?.contactChannels,
        (conv as any)?.contact,
      );
      setSelectedChannel(matchedChannel ?? contactScopedChannels[0] ?? channels?.[0] ?? null);

      // Mark read
      if (wsId) {
        inboxApi
          .markRead(wsId, conv.id)
          .then(() => {
            void refreshConversationCounts();
          })
          .catch(() => {});
      }

      // Zero unread in list
      setConvList((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
      );

      if (options?.targetMessageId) {
        fetchTimelineAroundMessage(conv.id, options.targetMessageId);
      } else {
        fetchLatestTimeline(conv.id);
      }

      // Load contact detail
      contactsApi
        .getContact(conv.contactId)
        .then((contact) => {
          if (selectedConvIdRef.current !== conv.id) return;

          setSelectedContact(contact);

          const nextContactChannels = getContactScopedChannels(
            channels,
            (contact as any)?.contactChannels,
            contact as any,
          );
          if (nextContactChannels.length === 0) return;

          setSelectedChannel((current: any) => {
            if (nextContactChannels.some((channel) => isSameChannel(channel, current))) {
              return current;
            }

            const inferredMatch = nextContactChannels.find(
              (channel: any) =>
                (inferredId && String(channel.id) === String(inferredId)) ||
                (inferredType &&
                  String(channel.type).toLowerCase() === String(inferredType).toLowerCase()),
            );

            return inferredMatch ?? nextContactChannels[0];
          });
        })
        .catch(() => {
          if (selectedConvIdRef.current !== conv.id) return;
          setSelectedContact(null);
        });

      // Auto-select channel matching the conversation's channel type
      // if (conv.channelId) {
      //   setChannels((prev: any[] | null) => {
      //     if (!prev) return prev;
      //     const match = prev.find((c) => c.id === conv.channelId);
      //     if (match) setSelectedChannel(match);
      //     return prev;
      //   });
      // }
    },
    [
      wsId,
      channels,
      fetchLatestTimeline,
      fetchTimelineAroundMessage,
      clearChannelIdentityConflict,
      refreshConversationCounts,
    ],
  );

  /* ── Channel helpers ── */
  const handleChannelChange = useCallback((channel: any) => {
    setSelectedChannel(channel);
  }, []);

  const toggleMsgSearch = useCallback(() => {
    setMsgSearchOpen((prev) => {
      if (prev) setMsgSearch("");
      return !prev;
    });
  }, []);

  const openChannelIdentityMergePreview = useCallback(async () => {
    const primaryContactId = channelIdentityConflict?.currentContact?.id;
    const secondaryContactId = channelIdentityConflict?.existingContact?.id;

    if (!primaryContactId || !secondaryContactId) {
      setChannelMergeError("Could not prepare this merge. Refresh the contact and try again.");
      return;
    }

    setChannelMergePreviewLoading(true);
    setChannelMergeError(null);

    try {
      const preview = await contactsApi.getMergePreview(primaryContactId, secondaryContactId);
      setChannelMergePreview(preview);
      setChannelMergeCurrentContact(preview.primary as SidebarContact);
      setChannelMergeDuplicateContact(preview.secondary as SidebarContact);
    } catch (error) {
      setChannelMergeError(
        error instanceof Error
          ? error.message
          : "Could not prepare this merge. Try again.",
      );
    } finally {
      setChannelMergePreviewLoading(false);
    }
  }, [channelIdentityConflict]);

  const closeChannelMergeReview = useCallback(() => {
    setChannelMergePreview(null);
    setChannelMergeCurrentContact(null);
    setChannelMergeDuplicateContact(null);
    setChannelMergeLoading(false);
    setChannelMergeError(null);
  }, []);

  const mergeChannelIdentityContacts = useCallback(
    async (resolution: Record<string, any>) => {
      const primaryContactId =
        channelMergeCurrentContact?.id ?? channelIdentityConflict?.currentContact?.id;
      const secondaryContactId =
        channelMergeDuplicateContact?.id ?? channelIdentityConflict?.existingContact?.id;

      if (!primaryContactId || !secondaryContactId || !channelMergePreview) {
        setChannelMergeError("Could not merge these contacts. Refresh and try again.");
        return;
      }

      setChannelMergeLoading(true);
      setChannelMergeError(null);

      try {
        const mergeResult = (await contactsApi.mergeContactIntoPrimary(
          primaryContactId,
          secondaryContactId,
          {
            source: "inbox_send_conflict",
            confidenceScore: channelMergePreview.confidenceScore,
            reasonCodes: channelMergePreview.reasonCodes,
            resolution,
          },
        )) as InboxContactMergeResult;

        clearChannelIdentityConflict();

        const refreshedConversations = await refreshConversations();
        const survivorConversation =
          mergeResult.survivorConversation ??
          refreshedConversations.find(
            (conversation) => conversation.id === mergeResult.survivorConversationId,
          ) ??
          convList.find(
            (conversation) => conversation.id === mergeResult.survivorConversationId,
          ) ??
          null;

        if (survivorConversation) {
          selectConversation(survivorConversation);
          return;
        }

        await refreshContact();
      } catch (error) {
        setChannelMergeError(
          error instanceof Error
            ? error.message
            : "Could not merge these contacts. Try again.",
        );
      } finally {
        setChannelMergeLoading(false);
      }
    },
    [
      channelIdentityConflict,
      channelMergeCurrentContact?.id,
      channelMergeDuplicateContact?.id,
      channelMergePreview,
      clearChannelIdentityConflict,
      convList,
      refreshContact,
      refreshConversations,
      selectConversation,
    ],
  );

  /* ══════════════════════════════════════════════════════════════
     PROVIDE
  ══════════════════════════════════════════════════════════════ */

  return (
    <InboxContext.Provider
      value={{
        convList,
        convLoading,
        hasMoreConvs,
        conversationCounts,
        conversationCountsLoading,
        loadMoreConversations,
        refreshConversations,
        refreshConversationCounts,
        filters,
        lifecycles,
        setFilters,
        resetFilters,
        convSearch,
        setConvSearch,
        selectedConversation,
        selectConversation,
        timeline,
        timelineLoading,
        loadingOlderTimeline,
        loadingNewerTimeline,
        hasMoreOlderTimeline,
        hasMoreNewerTimeline,
        targetMessageId,
        requestedTargetMessageId,
        loadOlderTimeline,
        loadNewerTimeline,
        channels,
        selectedChannel,
        handleChannelChange,
        selectedContact,
        refreshContact,
        fetchLifecycles,
        inputMode,
        setInputMode,
        msgSearchOpen,
        msgSearch,
        toggleMsgSearch,
        setMsgSearch,
        snoozedUntil,
        setSnoozedUntil,
        sendMessage,
        sendNote,
        closeConversation,
        openConversation,
        setPendingConversation,
        assignUser,
        assignTeam,
        setPriority,
        uploadFile,
        workspaceUsers: workspaceUsers ?? [],
      }}
    >
      {children}
      {channelMergePreview && channelMergeCurrentContact && channelMergeDuplicateContact ? (
        <MergeModal
          current={channelMergeCurrentContact}
          duplicate={channelMergeDuplicateContact}
          preview={channelMergePreview}
          conflictField={channelIdentityConflict?.identifierField === "email" ? "email" : "phone"}
          onMerge={mergeChannelIdentityContacts}
          onCancel={closeChannelMergeReview}
          loading={channelMergeLoading}
          error={channelMergeError}
        />
      ) : (
        <ChannelIdentityConflictModal
          conflict={channelIdentityConflict}
          onClose={clearChannelIdentityConflict}
          onReviewMerge={() => void openChannelIdentityMergePreview()}
          mergePreviewLoading={channelMergePreviewLoading}
          mergeError={channelMergeError}
          canMerge={Boolean(
            channelIdentityConflict?.currentContact?.id &&
              channelIdentityConflict?.existingContact?.id,
          )}
        />
      )}
    </InboxContext.Provider>
  );
};

export const useInbox = (): InboxContextType => {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used within InboxProvider");
  return ctx;
};
