/**
 * ConversationList.tsx
 * ─────────────────────────────────────────────────────────────────
 * Left-column conversation list.
 *
 * New features vs old version:
 *  ✓ Server-side filtering (status, direction, channel, assignee, unreplied)
 *  ✓ Server-side contact search with debounce
 *  ✓ Cursor-based infinite scroll via InboxContext.loadMoreConversations
 *  ✓ Priority badge
 *  ✓ Assigned agent avatar chip
 *  ✓ Skeleton loading state
 *  ✓ Filter pill chips with clear
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, X, ArrowDownLeft, ArrowUpRight,
  UserCircle2, PanelLeftOpen,
  Filter,
} from "lucide-react";
import { channelConfig } from "./data";
import { getActiveCategoryLabel } from "./MobileCategoryDrawer";
import { useInbox } from "../../context/InboxContext";
import { useChannel } from "../../context/ChannelContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import type { ApiConversation, ConvStatus, ConvPriority } from "../../lib/inboxApi";
import { InboxAddChannelPrompt } from "./InboxAddChannelPrompt";

/* ─── Skeleton ──────────────────────────────────────────────────── */

function ConvSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-gray-100 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-28" />
            <div className="h-3 bg-gray-100 rounded w-10" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-40" />
          <div className="flex gap-1.5">
            <div className="h-4 bg-gray-100 rounded w-16" />
            <div className="h-4 bg-gray-100 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Unread badge ──────────────────────────────────────────────── */

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-indigo-600 text-white
      text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ─── Priority dot ──────────────────────────────────────────────── */

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-gray-400",
  normal: "bg-blue-400",
  high: "bg-orange-400",
  urgent: "bg-red-500",
};

/* ─── Status options ────────────────────────────────────────────── */

const STATUS_OPTIONS: Array<{ value: ConvStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const CHANNEL_OPTIONS = [
  { value: "all", label: "All channels" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "messenger", label: "Messenger" },
  { value: "email", label: "Email" },
];

const ASSIGNEE_OPTIONS = [
  { value: "", label: "All agents" },
  { value: "me", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
];

/* ─── Filter pill ───────────────────────────────────────────────── */

function FilterPill({
  label, onRemove,
}: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50
      text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900"><X size={9} /></button>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */

interface ConversationListProps {
  onSelectConversation: (conversation: ApiConversation) => void;
  onOpenCategories?: () => void;
}

export function ConversationList({
  onSelectConversation,
  onOpenCategories,
}: ConversationListProps) {
  const {
    convList, convLoading, hasMoreConvs, loadMoreConversations,
    filters, setFilters, resetFilters,
    convSearch, setConvSearch,
    selectedConversation, selectConversation,
    lifecycles, fetchLifecycles,
  } = useInbox();
  const { channels, loading: channelsLoading } = useChannel();

  const { workspaceUsers } = useWorkspace();

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(convSearch);

  const filterRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  /* Debounce search input → context */
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setConvSearch(searchInput);
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [searchInput]);

  /* Close filter panel on click-outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Infinite scroll */
  const handleScroll = useCallback(() => {
    if (!listRef.current || convLoading || !hasMoreConvs) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 80) loadMoreConversations();
  }, [convLoading, hasMoreConvs, loadMoreConversations]);

  useEffect(() => {
    if (filters.lifecycleId == null || lifecycles.length > 0) return;
    void fetchLifecycles();
  }, [fetchLifecycles, filters.lifecycleId, lifecycles.length]);

  /* Total unread */
  const totalUnread = convList.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  const activeCategoryLabel = getActiveCategoryLabel(filters, lifecycles as any);
  const showChannelsLoadingState = channelsLoading && convList.length === 0;
  const showNoChannelsState =
    !channelsLoading && channels.length === 0 && convList.length === 0;

  /* Active filter pills */
  const activePills: Array<{ label: string; clear: () => void }> = [];
  if (filters.status && filters.status !== "open" && filters.status !== "all")
    activePills.push({ label: filters.status, clear: () => setFilters({ status: "open" }) });
  // if (filters.channelType && filters.channelType !== "all")
  //   activePills.push({ label: filters.channelType, clear: () => setFilters({ channelType: "all" }) });
  if (filters.assigneeId)
    activePills.push({ label: filters.assigneeId === "me" ? "Mine" : filters.assigneeId === "unassigned" ? "Unassigned" : "Assigned", clear: () => setFilters({ assigneeId: undefined }) });
  if (filters.unreplied)
    activePills.push({ label: "Unreplied", clear: () => setFilters({ unreplied: false }) });
  if (filters.direction && filters.direction !== "all")
    activePills.push({ label: filters.direction, clear: () => setFilters({ direction: "all" }) });

  return (
    <div className="flex min-h-0 w-full flex-col bg-white md:w-80 md:flex-shrink-0 md:border-r md:border-gray-200">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          {onOpenCategories ? (
            <button
              type="button"
              onClick={onOpenCategories}
              className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-slate-700 transition-colors hover:bg-slate-200 md:hidden"
            >
              <PanelLeftOpen size={16} className="flex-shrink-0 text-slate-500" />
              <span className="max-w-[7.5rem] truncate text-sm font-semibold">
                {activeCategoryLabel}
              </span>
              {totalUnread > 0 ? (
                <span className="inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              ) : null}
            </button>
          ) : null}

          <div className={`${onOpenCategories ? "hidden md:flex" : "flex"} min-w-0 items-center gap-2`}>
            <span className="text-sm font-bold text-gray-800">Inbox</span>
            {totalUnread > 0 ? (
              <span className="inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSearchOpen((o) => !o); if (searchOpen) setSearchInput(""); }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors md:h-8 md:w-8
              ${searchOpen ? "bg-indigo-100 text-indigo-600" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <Search size={18} />
          </button>
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors md:h-8 md:w-8
                ${activePills.length > 0 || filterOpen
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-gray-500 hover:bg-gray-100"}`}
            >
              <Filter size={18} />
              {activePills.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-indigo-600
                  text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {activePills.length}
                </span>
              )}
            </button>

            {/* Filter dropdown */}
            {filterOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-64 bg-white border border-gray-200
                rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Filters</span>
                  <button onClick={resetFilters} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium">
                    Reset all
                  </button>
                </div>

                <div className="p-3 space-y-3">
                  {/* Status */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFilters({ status: opt.value as any })}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                            ${(filters?.status ?? "all") === opt.value
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direction */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Direction
                    </label>
                    <div className="flex gap-1">
                      {(["all", "incoming", "outgoing"] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() => setFilters({ direction: dir })}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs
                            font-medium rounded-lg border transition-colors
                            ${(filters.direction ?? "all") === dir
                              ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                              : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                        >
                          {dir === "incoming" && <ArrowDownLeft size={11} />}
                          {dir === "outgoing" && <ArrowUpRight size={11} />}
                          {dir === "all" ? "All" : dir.charAt(0).toUpperCase() + dir.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Channel */}
                  {/* <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Channel
                    </label>
                    <select
                      value={filters.channelType ?? "all"}
                      onChange={(e) => setFilters({ channelType: e.target.value === "all" ? undefined : e.target.value })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5
                        focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {CHANNEL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div> */}

                  {/* Assignee */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Assigned to
                    </label>
                    <select
                      value={filters.assigneeId ?? ""}
                      onChange={(e) => setFilters({ assigneeId: e.target.value || undefined })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5
                        focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {ASSIGNEE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                      {workspaceUsers?.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2  cursor-pointer ">
                    <div
                      onClick={() => setFilters({ unreplied: !filters.unreplied })}
                      className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5
                        ${filters.unreplied ? "bg-indigo-600" : "bg-gray-200"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform
                        ${filters.unreplied ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Unreplied</span>
                  </label>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      {searchOpen && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone…"
              className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Status tab row ── */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <div className="flex">
          {STATUS_OPTIONS.filter((o) => o.value !== "all").map((opt) => {
            const isActive = (filters.status ?? "open") === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => setFilters({ status: opt.value as ConvStatus })}
                className={`flex-shrink-0 px-3 py-2.5 text-xs font-medium transition-colors
                border-b-2 whitespace-nowrap
                ${isActive
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"}`}
              >
                {opt.label}
              </button>
            );

          })}
        </div>

        {/* Unreplied toggle */}
        <label className="flex items-center gap-2 justify-between cursor-pointer mx-4">
          <div
            onClick={() => setFilters({ unreplied: !filters.unreplied })}
            className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5
                        ${filters.unreplied ? "bg-indigo-600" : "bg-gray-200"}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform
                        ${filters.unreplied ? "translate-x-4" : "translate-x-0"}`} />
          </div>
          <span className="text-xs font-medium text-gray-700">Unreplied</span>
        </label>
      </div>

      {/* ── Active filter chips ── */}
      {activePills.length > 0 && (
        <div className="px-3 py-2 flex flex-wrap gap-1 border-b border-gray-100">
          {activePills.map((p) => (
            <FilterPill key={p.label} label={p.label} onRemove={p.clear} />
          ))}
        </div>
      )}

      {/* ── List ── */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {/* First-load skeleton */}
        {(convLoading || showChannelsLoadingState) && convList.length === 0 && (
          <>
            <ConvSkeleton /><ConvSkeleton /><ConvSkeleton />
            <ConvSkeleton /><ConvSkeleton />
          </>
        )}

        {!convLoading && !showChannelsLoadingState && showNoChannelsState ? (
          <InboxAddChannelPrompt
            compact
            message="Add your first channel and this quiet list turns into your live customer queue."
          />
        ) : null}

        {!convLoading && !showChannelsLoadingState && !showNoChannelsState && convList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Search size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">No conversations found</p>
          </div>
        )}

        {convList.map((conv) => {
          const chType = conv.lastMessage?.channel?.type  ?? "email";
          const cfg = channelConfig[chType] ?? channelConfig["email"];
          const isUnread = conv.unreadCount > 0;
          const isSelected = selectedConversation?.id === conv.id;
          const contact = conv.contact;
          const lastMsg = conv.lastMessage;
          const contactAssignee = contact?.assigneeId ? workspaceUsers?.find((u: any) => u.id === contact.assigneeId) : null;
          const priorityDot = PRIORITY_DOT[conv.priority] ?? PRIORITY_DOT.normal;

          return (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv) }
              className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors
                ${isSelected
                  ? "bg-indigo-50"
                  : isUnread
                    ? "bg-white hover:bg-gray-50"
                    : "hover:bg-gray-50"}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar + channel badge */}
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center
                    text-sm font-semibold ${isUnread ? "bg-gray-400 text-white" : "bg-gray-300"}`}>
                    {contact?.avatarUrl
                      ? <img src={contact.avatarUrl} alt={contact.firstName} className="w-full h-full object-cover" />
                      : <span>{contact?.firstName?.charAt(0)?.toUpperCase() ?? "?"}</span>
                    }
                  </div>
                  {/* Channel icon */}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center
                    border-2 border-white bg-white">
                    <img src={cfg.icon} alt={cfg.label} className="w-3 h-3" />
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: name + time + unread */}
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {/* Priority dot */}
                      <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                        {contact?.firstName} {contact?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span className={`text-xs ${isUnread ? "text-indigo-600 font-semibold" : "text-gray-400"}`}>
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>
                      <UnreadBadge count={conv.unreadCount} />
                    </div>
                  </div>

                  {/* Row 2: direction + last message */}
                  <div className="flex items-center gap-1 mb-1">
                    {lastMsg?.direction === "incoming"
                      ? <ArrowDownLeft size={11} className="text-green-500 flex-shrink-0" />
                      : <ArrowUpRight size={11} className="text-indigo-500 flex-shrink-0" />}
                    <p className={`text-xs truncate ${isUnread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                      {lastMsg?.text ?? conv.subject ?? "…"}
                    </p>
                  </div>

                  {/* Row 3: tag + assignee chip */}
                  <div className="flex items-center justify-end  flex-wrap">
                    {contact?.tag && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px]
                        bg-blue-100 text-blue-700 font-medium">
                        {contact.tag}
                      </span>
                    )}
                   
                    {contact?.assigneeId ? (
                      <>
                      <img src={contactAssignee?.avatarUrl} alt={`${contactAssignee?.firstName} ${contact?.assignee?.lastName}`} className="w-5 h-5 rounded-full object-cover" />
                      </>
                    ) : 
                    (
                      <>
                      <UserCircle2 size={16} className="text-gray-400 w-5 h-5 rounded-full" /><span className="text-gray-500"></span></>
                      
                    )
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Load-more skeleton */}
        {convLoading && convList.length > 0 && (
          <><ConvSkeleton /><ConvSkeleton /></>
        )}

        {!hasMoreConvs && !convLoading && convList.length > 0 && (
          <div className="flex justify-center py-4">
            <span className="text-[11px] text-gray-400">All conversations loaded</span>
          </div>
        )}
      </div>
    </div>
  );
}
