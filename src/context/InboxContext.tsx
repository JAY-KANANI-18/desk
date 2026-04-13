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
import { contactsApi } from "../lib/contactApi";
import {
  inboxApi,
  ApiConversation,
  ApiMessage,
  ApiTimelineItem,
  TimelineWindowResult,
  ConversationFilters,
  ConvPriority,
} from "../lib/inboxApi";
import { workspaceApi } from "../lib/workspaceApi";
import { useChannel } from "./ChannelContext";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */

export type { ApiConversation, ApiMessage, ApiTimelineItem };

export interface InboxFilters extends ConversationFilters {
  // extends the API filter type — status, priority, direction,
  // channelType, assigneeId, teamId, unreplied, search, cursor, limit
}

export interface InboxContextType {
  /* Conversation list */
  convList: ApiConversation[];
  convLoading: boolean;
  hasMoreConvs: boolean;
  loadMoreConversations: () => void;
  refreshConversations: () => Promise<ApiConversation[]>;

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
  // status: "open",
  // priority: "all",
  // direction: "all",
  // // channelType: "all",
  // assigneeId: undefined,
  // teamId: undefined,
  // unreplied: false,
  limit: 25,
};

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

  const wsId = activeWorkspace?.id as string | undefined;

  /* ── Filters ── */
  const [filters, _setFilters] = useState<InboxFilters>(DEFAULT_FILTERS);
  const [convSearch, setConvSearch] = useState("");

  const setFilters = useCallback((partial: Partial<InboxFilters>) => {
    console.log({ partial });

    _setFilters((prev) => {
      console.log({ prev });
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
    console.log({ convList });

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
      setConvLoading(true);
      try {
        const result = await inboxApi.getConversations({
          ...filters,
          search: convSearch || undefined,
          cursor: replace ? undefined : nextConvCursor,
        });
        setConvList((prev) =>
          replace ? result.data : [...prev, ...result.data],
        );
        setNextConvCursor(result.nextCursor);
        setHasMoreConvs(!!result.nextCursor);
      } catch (err) {
        console.error("[InboxContext] fetchConversations:", err);
      } finally {
        setConvLoading(false);
      }
    },
    [wsId, filters, convSearch, nextConvCursor],
  );

  const refreshConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const result = await inboxApi.getConversations({
        ...filters,
        search: convSearch || undefined,
        cursor: undefined,
      });
      setConvList(result.data);
      setNextConvCursor(result.nextCursor);
      setHasMoreConvs(!!result.nextCursor);
      return result.data;
    } catch (err) {
      console.error("[InboxContext] refreshConversations:", err);
      return [];
    } finally {
      setConvLoading(false);
    }
  }, [filters, convSearch]);

  /* Initial load + re-load when filters change */
  useEffect(() => {
    fetchConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId, filters, convSearch]);

  const loadMoreConversations = useCallback(() => {
    if (!convLoading && hasMoreConvs) fetchConversations(false);
  }, [convLoading, hasMoreConvs, fetchConversations]);

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
        console.error("[InboxContext] fetchLatestTimeline:", err);
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
        console.error("[InboxContext] fetchTimelineAroundMessage:", err);
      } finally {
        setTimelineLoading(false);
      }
    },
    [applyTimelineWindow, wsId],
  );

  const fetchLifecycles = useCallback(async () => {
    const result = await workspaceApi.getLifecycleStages();
    setLifecycles(result);
  }, [activeWorkspace?.id]);

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
          console.error("[InboxContext] loadOlderTimeline:", err);
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
      console.error("[InboxContext] loadOlderTimeline:", err);
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
      console.error("[InboxContext] loadNewerTimeline:", err);
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
      console.log({ msg });
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
        console.log({ exists });
        if (!exists) return [conv, ...prev];

        return prev.map((c) => (c.id === conv.id ? mergeConversation(c, conv) : c));
      });

      if (conv.id === selectedConvIdRef.current) {
        setSelectedConversation((prev) =>
          prev ? mergeConversation(prev, conv) : conv,
        );
      }

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
    console.log("listening socket");

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
  }, [socket, activeWorkspace?.id, fetchConversations, refreshConversations, fetchLatestTimeline]);

  /* ══════════════════════════════════════════════════════════════
     SEND MESSAGE
  ══════════════════════════════════════════════════════════════ */

  const sendMessage = useCallback(
    async (msg: any) => {
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
      console.log({ payload, selectedConversation });

      const message = await inboxApi.sendMessage(
        selectedConversation?.id!,
        selectedChannel?.id,
        payload,
      );

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

      console.log({ message });
    },
    [selectedChannel?.id, selectedConversation, user?.id, workspaceUsers],
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
  //       console.error("[InboxContext] sendMessage:", err);
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
        console.error("[InboxContext] sendNote:", err);
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

  const closeConversation = useCallback(async () => {
    if (!wsId || !selectedConversation) return;
    await inboxApi.close(wsId, selectedConversation.id);
    updateSelectedConv({ status: "closed" });
  }, [wsId, selectedConversation]);

  const openConversation = useCallback(async () => {
    if (!wsId || !selectedConversation) return;
    await inboxApi.open(wsId, selectedConversation.id);
    updateSelectedConv({ status: "open" });
  }, [wsId, selectedConversation]);

  const setPendingConversation = useCallback(async () => {
    if (!wsId || !selectedConversation) return;
    await inboxApi.setPending(wsId, selectedConversation.id);
    updateSelectedConv({ status: "pending" });
  }, [wsId, selectedConversation]);

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
    },
    [wsId, selectedConversation],
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
    },
    [wsId, selectedConversation],
  );

  const setPriority = useCallback(
    async (priority: ConvPriority) => {
      if (!wsId || !selectedConversation) return;
      await inboxApi.setPriority(wsId, selectedConversation.id, priority);
      updateSelectedConv({ priority });
    },
    [wsId, selectedConversation],
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
      setSelectedConversation({ ...conv, unreadCount: 0 });
      selectedConvIdRef.current = conv.id;

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
      console.log({ ApiConversation: conv });

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
      setSelectedChannel(matchedChannel ?? channels?.[0] ?? null);

      // Mark read
      if (wsId) inboxApi.markRead(wsId, conv.id).catch(() => {});

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
        .then(setSelectedContact)
        .catch(() => {});

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
    [wsId, channels, fetchLatestTimeline, fetchTimelineAroundMessage],
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

  /* ══════════════════════════════════════════════════════════════
     PROVIDE
  ══════════════════════════════════════════════════════════════ */

  return (
    <InboxContext.Provider
      value={{
        convList,
        convLoading,
        hasMoreConvs,
        loadMoreConversations,
        refreshConversations,
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
    </InboxContext.Provider>
  );
};

export const useInbox = (): InboxContextType => {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used within InboxProvider");
  return ctx;
};
