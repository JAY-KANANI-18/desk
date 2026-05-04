import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { AlarmClock, RefreshCw } from "@/components/ui/icons";
import { Button } from "../../components/ui/Button";
import { Tag } from "../../components/ui/Tag";
import { useChannel } from "../../context/ChannelContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useAuth } from "../../context/AuthContext";
import { useInbox } from "../../context/InboxContext";
import { inboxApi, MessageSearchResult } from "../../lib/inboxApi";
import { MessageAreaDateBadge } from "./MessageAreaDateBadge";
import { MessageAreaSearchBar } from "./MessageAreaSearchBar";
import type { Conversation } from "./types";
import { MessageAreaEmailModal } from "./message-area/MessageAreaEmailModal";
import { TimelineItemRow } from "./message-area/TimelineItemRow";
import { dateBadgeLabel } from "./message-area/helpers";
import type {
  Message,
  MessageGroupPosition,
  RenderItem,
  ReplyContext,
  TimelineItem,
} from "./message-area/types";

export type { ReplyContext } from "./message-area/types";

interface MessageAreaProps {
  selectedConversation: Conversation;
  messages?: Message[];
  timelineItems?: TimelineItem[];
  targetMessageId?: string | null;
  snoozedUntil: string | null;
  onUnsnooze: () => void;
  msgSearchOpen: boolean;
  msgSearch: string;
  onMsgSearchChange: (value: string) => void;
  onCloseMsgSearch: () => void;
  onReply?: (ctx: ReplyContext) => void;
}

const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;
const NON_GROUPABLE_MESSAGE_TYPES = new Set<Message["type"]>([
  "comment",
  "system",
  "event",
  "call_event",
  "status",
]);

function isGroupableMessageItem(
  item?: RenderItem,
): item is Extract<RenderItem, { kind: "message" }> {
  return (
    item?.kind === "message" &&
    !NON_GROUPABLE_MESSAGE_TYPES.has(item.msg.type)
  );
}

function getMessageSenderKey(message: Message) {
  const direction = message.direction ?? "incoming";

  if (direction === "incoming") {
    return "incoming";
  }

  if (typeof message.author === "string") {
    return `outgoing:${message.author}`;
  }

  return `outgoing:${
    message.author?.id ??
    message.metadata?.sender?.userId ??
    message.initials ??
    "user"
  }`;
}

function areItemsInSameMessageGroup(
  current?: RenderItem,
  next?: RenderItem,
) {
  if (!isGroupableMessageItem(current) || !isGroupableMessageItem(next)) {
    return false;
  }

  const currentMessage = current.msg;
  const nextMessage = next.msg;
  const currentTime = current.timestamp.getTime();
  const nextTime = next.timestamp.getTime();

  if (!Number.isFinite(currentTime) || !Number.isFinite(nextTime)) {
    return false;
  }

  return (
    (currentMessage.direction ?? "incoming") ===
      (nextMessage.direction ?? "incoming") &&
    getMessageSenderKey(currentMessage) === getMessageSenderKey(nextMessage) &&
    (currentMessage.channelId || currentMessage.channel || "") ===
      (nextMessage.channelId || nextMessage.channel || "") &&
    nextTime - currentTime >= 0 &&
    nextTime - currentTime <= MESSAGE_GROUP_WINDOW_MS
  );
}

function getMessageGroupPosition(
  groupedWithPrevious: boolean,
  groupedWithNext: boolean,
): MessageGroupPosition {
  if (groupedWithPrevious && groupedWithNext) return "middle";
  if (groupedWithPrevious) return "last";
  if (groupedWithNext) return "first";
  return "single";
}

export function MessageArea({
  selectedConversation,
  messages = [],
  timelineItems,
  targetMessageId,
  snoozedUntil,
  onUnsnooze,
  msgSearchOpen,
  msgSearch,
  onMsgSearchChange,
  onCloseMsgSearch,
  onReply,
}: MessageAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const prevConvIdRef = useRef(selectedConversation?.id);
  const prevLastItemKeyRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);
  const isRestoringScrollRef = useRef(false);
  const pendingJumpModeRef = useRef<"bottom" | "target" | null>("bottom");
  const itemRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingPrependRestoreRef = useRef(false);
  const targetScrollDoneRef = useRef<string | null>(null);
  const targetHighlightTimeoutRef = useRef<number | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const newItemAnimationTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [emailModalMsg, setEmailModalMsg] = useState<Message | null>(null);
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<MessageSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(true);
  const [animatedItemKeys, setAnimatedItemKeys] = useState<Set<string>>(
    () => new Set(),
  );
// Add these near your other state declarations
const [isListHovered, setIsListHovered] = useState(false);
const [isScrolling, setIsScrolling] = useState(false);
const scrollTimer = useRef<ReturnType<typeof setTimeout>>();


  const { channels } = useChannel();
  const { workspaceUsers, activeWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const {
    loadOlderTimeline,
    loadNewerTimeline,
    loadingOlderTimeline,
    loadingNewerTimeline,
    hasMoreOlderTimeline,
    hasMoreNewerTimeline,
    selectConversation,
  } = useInbox();

  const previewLength = 220;

  const clearNewItemAnimations = useCallback(() => {
    newItemAnimationTimersRef.current.forEach((timer) => clearTimeout(timer));
    newItemAnimationTimersRef.current.clear();
    setAnimatedItemKeys(new Set());
  }, []);

  const markNewItemKeys = useCallback((keys: string[]) => {
    const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));
    if (uniqueKeys.length === 0) return;

    setAnimatedItemKeys((current) => {
      const next = new Set(current);
      uniqueKeys.forEach((key) => next.add(key));
      return next;
    });

    uniqueKeys.forEach((key) => {
      const existingTimer = newItemAnimationTimersRef.current.get(key);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        newItemAnimationTimersRef.current.delete(key);
        setAnimatedItemKeys((current) => {
          if (!current.has(key)) return current;
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }, 700);

      newItemAnimationTimersRef.current.set(key, timer);
    });
  }, []);

  useEffect(() => {
    if (timelineItems !== undefined) {
      setLoadingTimeline(false);
    }
  }, [timelineItems]);

  useEffect(() => {
    if (!msgSearchOpen) {
      setSearchResults([]);
      setSearchLoading(false);
      setShowSearchResults(true);
      return;
    }

    if (!msgSearch || msgSearch.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setShowSearchResults(true);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      const wsId = activeWorkspace?.id;
      if (!wsId) return;

      setSearchLoading(true);
      try {
        const results = await inboxApi.searchMessages(wsId, msgSearch.trim());
        setSearchResults(results);
        setShowSearchResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [msgSearch, msgSearchOpen, activeWorkspace?.id]);

  const allItems = useMemo<RenderItem[]>(() => {
    if (timelineItems && timelineItems.length > 0) {
      return timelineItems.map((item): RenderItem => {
        const timestamp = new Date(item.timestamp);

        if (item.type === "activity" && item.activity) {
          return {
            kind: "activity",
            key: item.id,
            timestamp,
            act: item.activity,
          };
        }

        return {
          kind: "message",
          key: item.id,
          timestamp,
          msg: item.message!,
        };
      });
    }

    return messages.map(
      (message): RenderItem => ({
        kind: "message",
        key: String(message.id),
        timestamp: message.createdAt ? new Date(message.createdAt) : new Date(),
        msg: message,
      }),
    );
  }, [timelineItems, messages]);

  const matchingKeys = useMemo<string[]>(() => {
    if (!msgSearch) return [];

    const term = msgSearch.toLowerCase();

    return allItems
      .filter((item) => {
        if (item.kind === "activity") {
          const description = (item.act.description ?? "").toLowerCase();
          const note = ((item.act.metadata?.text as string) ?? "").toLowerCase();
          return description.includes(term) || note.includes(term);
        }

        return (item.msg.text ?? "").toLowerCase().includes(term);
      })
      .map((item) => item.key);
  }, [allItems, msgSearch]);

  const matchCount = matchingKeys.length;

  useEffect(() => {
    setSearchMatchIndex(0);
  }, [msgSearch]);

  useEffect(() => {
    if (!msgSearch || matchCount === 0) return;
    if (targetMessageId && targetScrollDoneRef.current !== targetMessageId) return;

    const key = matchingKeys[searchMatchIndex];
    if (!key) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = itemRefsMap.current.get(key);
        if (el) {
          el.scrollIntoView({ behavior: "auto", block: "center" });
        }
      });
    });
  }, [searchMatchIndex, msgSearch, matchCount, matchingKeys, targetMessageId]);

  useEffect(() => {
    if (!msgSearch || !targetMessageId) return;

    const idx = matchingKeys.indexOf(targetMessageId);
    if (idx >= 0 && idx !== searchMatchIndex) {
      setSearchMatchIndex(idx);
    }
  }, [msgSearch, targetMessageId, matchingKeys, searchMatchIndex]);

  const handleSearchPrev = useCallback(() => {
    setSearchMatchIndex((index) => (index - 1 + matchCount) % matchCount);
  }, [matchCount]);

  const handleSearchNext = useCallback(() => {
    setSearchMatchIndex((index) => (index + 1) % matchCount);
  }, [matchCount]);

  useEffect(() => {
    if (!msgSearchOpen) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.shiftKey ? handleSearchPrev() : handleSearchNext();
      }

      if (event.key === "Escape") onCloseMsgSearch();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [msgSearchOpen, handleSearchPrev, handleSearchNext, onCloseMsgSearch]);

  useEffect(() => {
    if (!msgSearchOpen) return;

    const handler = (event: MouseEvent) => {
      if (!searchBarRef.current) return;
      if (!searchBarRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [msgSearchOpen]);

  useEffect(() => {
    if (!highlightedMessageId) return;

    if (targetHighlightTimeoutRef.current) {
      window.clearTimeout(targetHighlightTimeoutRef.current);
    }

    targetHighlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedMessageId(null);
      targetHighlightTimeoutRef.current = null;
    }, 3500);

    return () => {
      if (targetHighlightTimeoutRef.current) {
        window.clearTimeout(targetHighlightTimeoutRef.current);
        targetHighlightTimeoutRef.current = null;
      }
    };
  }, [highlightedMessageId]);

  const visibleItems = allItems;
  const totalLen = allItems.length;
  const lastItemKey = allItems[allItems.length - 1]?.key ?? null;

  useLayoutEffect(() => {
    const convChanged = prevConvIdRef.current !== selectedConversation?.id;

    if (convChanged || isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevConvIdRef.current = selectedConversation?.id;
      prevLastItemKeyRef.current = lastItemKey;
      pendingJumpModeRef.current = targetMessageId ? "target" : "bottom";
      targetScrollDoneRef.current = null;
      setExpanded({});
      clearNewItemAnimations();

      if (scrollRef.current) {
        scrollRef.current.style.visibility = "hidden";
      }
      return;
    }

    if (lastItemKey && lastItemKey !== prevLastItemKeyRef.current) {
      const previousLastItemKey = prevLastItemKeyRef.current;
      const previousLastItemIndex = previousLastItemKey
        ? allItems.findIndex((item) => item.key === previousLastItemKey)
        : -1;

      if (previousLastItemIndex >= 0 && previousLastItemIndex < allItems.length - 1) {
        markNewItemKeys(
          allItems
            .slice(previousLastItemIndex + 1)
            .filter((item) => item.kind === "message")
            .map((item) => item.key),
        );
      }

      prevLastItemKeyRef.current = lastItemKey;
      const el = scrollRef.current;

      if (el) {
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distFromBottom < 120) {
          el.scrollTo({
            top: el.scrollHeight,
            behavior: "auto",
          });
        }
      }
      return;
    }

    prevLastItemKeyRef.current = lastItemKey;
  }, [
    allItems,
    clearNewItemAnimations,
    lastItemKey,
    markNewItemKeys,
    selectedConversation?.id,
    targetMessageId,
    totalLen,
  ]);

  const tryScrollToTarget = useCallback(() => {
    if (!targetMessageId) return false;
    if (targetScrollDoneRef.current === targetMessageId) return true;

    const el = scrollRef.current;
    const targetEl = itemRefsMap.current.get(targetMessageId);

    if (!el || !targetEl) return false;

    pendingJumpModeRef.current = null;
    targetScrollDoneRef.current = targetMessageId;
    targetEl.scrollIntoView({ behavior: "auto", block: "center" });
    el.style.visibility = "visible";
    setHighlightedMessageId(targetMessageId);
    return true;
  }, [targetMessageId]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (pendingJumpModeRef.current === "bottom" && totalLen > 0) {
      pendingJumpModeRef.current = null;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "auto",
      });
      el.style.visibility = "visible";
      return;
    }

    if (pendingPrependRestoreRef.current && prevScrollHeightRef.current > 0) {
      pendingPrependRestoreRef.current = false;

      const addedHeight = el.scrollHeight - prevScrollHeightRef.current;
      el.scrollTop = prevScrollTopRef.current + addedHeight;

      prevScrollHeightRef.current = 0;
      prevScrollTopRef.current = 0;
      isRestoringScrollRef.current = false;
    }

    if (
      pendingJumpModeRef.current === "target" &&
      totalLen > 0 &&
      targetMessageId &&
      targetScrollDoneRef.current !== targetMessageId
    ) {
      tryScrollToTarget();
    }
  }, [totalLen, targetMessageId, tryScrollToTarget]);

  useEffect(() => {
    if (!targetMessageId) return;
    if (targetScrollDoneRef.current === targetMessageId) return;
    pendingJumpModeRef.current = "target";
  }, [targetMessageId]);

  useEffect(() => {
    if (!targetMessageId) return;
    if (targetScrollDoneRef.current === targetMessageId) return;

    let attempts = 0;
    let rafId = 0;

    const tick = () => {
      if (tryScrollToTarget()) return;

      attempts += 1;
      if (attempts < 8) {
        rafId = window.requestAnimationFrame(tick);
      } else if (scrollRef.current) {
        scrollRef.current.style.visibility = "visible";
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [targetMessageId, totalLen, tryScrollToTarget]);

const handleScroll = useCallback(() => {
  // existing logic stays exactly the same...
  const el = scrollRef.current;
  if (!el || isRestoringScrollRef.current) return;

  if (el.scrollTop <= 160 && !loadingOlderTimeline && hasMoreOlderTimeline) {
    prevScrollHeightRef.current = el.scrollHeight;
    prevScrollTopRef.current = el.scrollTop;
    isRestoringScrollRef.current = true;
    pendingPrependRestoreRef.current = true;
    loadOlderTimeline().catch(() => {
      pendingPrependRestoreRef.current = false;
      isRestoringScrollRef.current = false;
    });
    return;
  }

  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (distanceFromBottom <= 160 && !loadingNewerTimeline && hasMoreNewerTimeline) {
    loadNewerTimeline().catch(() => {});
  }

  // 👇 Add this
  setIsScrolling(true);
  clearTimeout(scrollTimer.current);
  scrollTimer.current = setTimeout(() => setIsScrolling(false), 1000);
}, [
  hasMoreNewerTimeline,
  hasMoreOlderTimeline,
  loadNewerTimeline,
  loadOlderTimeline,
  loadingNewerTimeline,
  loadingOlderTimeline,
]);
useEffect(() => {
  return () => {
    clearTimeout(scrollTimer.current);
    newItemAnimationTimersRef.current.forEach((timer) => clearTimeout(timer));
    newItemAnimationTimersRef.current.clear();
  };
}, []);

  type DateGroup = { dateKey: string; items: RenderItem[] };

  const dateGroups = useMemo<DateGroup[]>(() => {
    const groups: DateGroup[] = [];

    for (const item of visibleItems) {
      const dateKey = item.timestamp.toISOString().slice(0, 10);

      if (!groups.length || groups[groups.length - 1].dateKey !== dateKey) {
        groups.push({ dateKey, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    }

    return groups;
  }, [visibleItems]);

  const setItemRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) itemRefsMap.current.set(key, el);
    else itemRefsMap.current.delete(key);
  }, []);

  const isCurrentMatch = (key: string) =>
    !!msgSearch && matchingKeys[searchMatchIndex] === key;
  const isAnyMatch = (key: string) => !!msgSearch && matchingKeys.includes(key);

  const matchRingClass = (key: string) =>
    isCurrentMatch(key)
      ? "ring-2 ring-yellow-400 ring-offset-2 rounded-2xl"
      : isAnyMatch(key)
        ? "ring-1 ring-yellow-200 ring-offset-1 rounded-2xl"
        : "";

  const snoozeLabel =
    snoozedUntil === "30m"
      ? "This chat is snoozed for 30 minutes"
      : snoozedUntil === "1h"
        ? "This chat is snoozed for 1 hour"
        : snoozedUntil === "3h"
          ? "This chat is snoozed for 3 hours"
          : snoozedUntil === "tomorrow"
            ? "This chat is snoozed until tomorrow morning"
            : snoozedUntil === "nextweek"
              ? "This chat is snoozed until next week"
              : "This chat is snoozed";

  return (
    <>
      {snoozedUntil && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <AlarmClock size={14} className="text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 font-medium">
            {snoozeLabel}
          </span>
          <Button
            onClick={onUnsnooze}
            type="button"
            variant="soft-warning"
            size="xs"
            className="ml-auto"
          >
            Unsnooze
          </Button>
        </div>
      )}

      <div
  ref={scrollRef}
  onScroll={handleScroll}
  onMouseEnter={() => setIsListHovered(true)}
  onMouseLeave={() => setIsListHovered(false)}
  className={`relative flex-1 overflow-x-hidden px-2 py-3 sm:px-4 sm:py-4 ${
    isListHovered || isScrolling ? "msg-area-scroll--visible" : "msg-area-scroll"
  }`}
  style={{ scrollBehavior: "auto", overflowAnchor: "none" }}
>

  
        {msgSearchOpen && (
          <div
            ref={searchBarRef}
            className="sticky ml-auto top-0 right-0 z-30 w-[360px] max-w-[90%] pointer-events-auto"
          >
            <MessageAreaSearchBar
              value={msgSearch}
              onChange={onMsgSearchChange}
              onFocus={() => setShowSearchResults(true)}
              onClose={onCloseMsgSearch}
              matchCount={matchCount}
              matchIndex={searchMatchIndex}
              onPrev={handleSearchPrev}
              onNext={handleSearchNext}
              results={searchResults}
              loading={searchLoading}
              showResults={showSearchResults}
              onSelectResult={async (result) => {
                setSearchLoading(false);
                setShowSearchResults(false);

                try {
                  const wsId = activeWorkspace?.id;
                  if (!wsId) return;

                  const isSameConv =
                    selectedConversation?.id === result.conversationId;
                  const conversation = isSameConv
                    ? (selectedConversation as any)
                    : await inboxApi.getConversation(wsId, result.conversationId);

                  selectConversation(conversation, {
                    targetMessageId: result.messageId,
                    preserveSearch: true,
                  });

                  if (!isSameConv) {
                    navigate(`/inbox/${result.conversationId}`, {
                      state: {
                        targetMessageId: result.messageId,
                        preserveSearch: true,
                      },
                    });
                  }
                } catch {}
              }}
            />
          </div>
        )}

        {loadingOlderTimeline && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 flex justify-center mb-5">
            <Tag
              label="Loading messages..."
              icon={<RefreshCw size={12} className="animate-spin" />}
              size="sm"
              bgColor="gray"
            />
          </div>
        )}

        {!hasMoreOlderTimeline && !loadingOlderTimeline && (
          <div className="flex justify-center mb-6">
            <Tag label="Beginning of conversation" size="sm" bgColor="gray" />
          </div>
        )}

        {loadingTimeline ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 justify-center py-10">
            <Tag
              label="Loading conversation..."
              icon={<RefreshCw size={14} className="animate-spin" />}
              bgColor="gray"
            />
          </div>
        ) : (
          <>
            {dateGroups.map(({ dateKey, items }) => (
              <div key={dateKey}>
                <MessageAreaDateBadge label={dateBadgeLabel(dateKey)} />

                {items.map((item, index) => {
                  const groupedWithPrevious = areItemsInSameMessageGroup(
                    items[index - 1],
                    item,
                  );
                  const groupedWithNext = areItemsInSameMessageGroup(
                    item,
                    items[index + 1],
                  );

                  return (
                    <TimelineItemRow
                      key={item.key}
                      item={item}
                      currentUser={currentUser}
                      msgSearch={msgSearch}
                      highlighted={highlightedMessageId === item.key}
                      matchRingClass={matchRingClass}
                      setItemRef={setItemRef}
                      selectedConversation={selectedConversation}
                      channels={channels}
                      workspaceUsers={workspaceUsers}
                      hoveredMsgId={hoveredMsgId}
                      setHoveredMsgId={setHoveredMsgId}
                      expanded={expanded}
                      setExpanded={setExpanded}
                      previewLength={previewLength}
                      onReply={onReply}
                      onOpenEmailModal={setEmailModalMsg}
                      animateIn={animatedItemKeys.has(item.key)}
                      groupPosition={getMessageGroupPosition(
                        groupedWithPrevious,
                        groupedWithNext,
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageAreaEmailModal
        message={emailModalMsg}
        onClose={() => setEmailModalMsg(null)}
      />
    </>
  );
}
