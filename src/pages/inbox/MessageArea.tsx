import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { AlarmClock, RefreshCw } from "lucide-react";
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

  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [emailModalMsg, setEmailModalMsg] = useState<Message | null>(null);
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<MessageSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(true);

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

  useEffect(() => {
    const convChanged = prevConvIdRef.current !== selectedConversation?.id;

    if (convChanged || isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevConvIdRef.current = selectedConversation?.id;
      prevLastItemKeyRef.current = lastItemKey;
      pendingJumpModeRef.current = targetMessageId ? "target" : "bottom";
      targetScrollDoneRef.current = null;
      setExpanded({});

      if (scrollRef.current) {
        scrollRef.current.style.visibility = "hidden";
      }
      return;
    }

    if (lastItemKey && lastItemKey !== prevLastItemKeyRef.current) {
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
  }, [selectedConversation?.id, totalLen, lastItemKey, targetMessageId]);

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
  }, [
    hasMoreNewerTimeline,
    hasMoreOlderTimeline,
    loadNewerTimeline,
    loadOlderTimeline,
    loadingNewerTimeline,
    loadingOlderTimeline,
  ]);

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

  return (
    <>
      {snoozedUntil && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <AlarmClock size={14} className="text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 font-medium">
            This chat is snoozed
            {snoozedUntil === "30m" && " for 30 minutes"}
            {snoozedUntil === "1h" && " for 1 hour"}
            {snoozedUntil === "3h" && " for 3 hours"}
            {snoozedUntil === "tomorrow" && " until tomorrow morning"}
            {snoozedUntil === "nextweek" && " until next week"}
          </span>
          <button
            onClick={onUnsnooze}
            className="ml-auto text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-0.5 rounded hover:bg-amber-100 transition-colors"
          >
            Unsnooze
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6"
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
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <RefreshCw size={12} className="animate-spin" />
              Loading messages...
            </div>
          </div>
        )}

        {!hasMoreOlderTimeline && !loadingOlderTimeline && (
          <div className="flex justify-center mb-6">
            <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
              Beginning of conversation
            </span>
          </div>
        )}

        {loadingTimeline ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 justify-center py-10">
            <RefreshCw size={14} className="animate-spin" />
            Loading conversation...
          </div>
        ) : (
          <>
            {dateGroups.map(({ dateKey, items }) => (
              <div key={dateKey}>
                <MessageAreaDateBadge label={dateBadgeLabel(dateKey)} />

                {items.map((item) => (
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
                  />
                ))}
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
