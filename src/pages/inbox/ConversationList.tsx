import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  PanelLeftOpen,
  Search,
  UserCircle2,
  X,
} from "@/components/ui/icons";
import {
  Avatar,
  AvatarWithBadge,
} from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/button/IconButton";
import { BaseInput } from "../../components/ui/inputs/BaseInput";
import { Select } from "../../components/ui/Select";
import { Tag } from "../../components/ui/Tag";
import { Toggle } from "../../components/ui/Toggle";
import { TruncatedText } from "../../components/ui/TruncatedText";
import { useChannel } from "../../context/ChannelContext";
import { useInbox } from "../../context/InboxContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import type { ApiConversation, ConvStatus } from "../../lib/inboxApi";
import { InboxAddChannelPrompt } from "./InboxAddChannelPrompt";
import { getActiveCategoryLabel } from "./MobileCategoryDrawer";
import { getChannelBadgeType } from "./channelUtils";
import { channelConfig } from "./data";
import { useIsMobile } from "../../hooks/useIsMobile";

function ConvSkeleton() {
  return (
    <div className="mb-2 animate-pulse rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="flex justify-between">
            <div className="h-3 w-28 rounded bg-gray-200" />
            <div className="h-3 w-10 rounded bg-gray-100" />
          </div>
          <div className="h-3 w-40 rounded bg-gray-200" />
          <div className="flex gap-1.5">
            <div className="h-4 w-16 rounded bg-gray-100" />
            <div className="h-4 w-20 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const STATUS_OPTIONS: Array<{ value: ConvStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const ASSIGNEE_OPTIONS = [
  { value: "", label: "All agents" },
  { value: "me", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function getLocalDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatConversationListTimestamp(value?: string | number | null) {
  if (value == null) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffDays = Math.round((getLocalDayStart(now) - getLocalDayStart(date)) / DAY_MS);

  if (diffDays <= 0) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (diffDays === 1) return "Yesterday";

  if (diffDays < 7) {
    return date.toLocaleDateString("en-GB", { weekday: "long" });
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Tag
      label={label}
      size="sm"
      bgColor="primary"
      onRemove={onRemove}
    />
  );
}

interface ConversationListProps {
  onSelectConversation: (conversation: ApiConversation) => void;
  onOpenCategories?: () => void;
}

export function ConversationList({
  onSelectConversation,
  onOpenCategories,
}: ConversationListProps) {
  const {
    convList,
    convLoading,
    hasMoreConvs,
    loadMoreConversations,
    filters,
    setFilters,
    resetFilters,
    convSearch,
    setConvSearch,
    selectedConversation,
    lifecycles,
    fetchLifecycles,
  } = useInbox();
  const { channels, loading: channelsLoading } = useChannel();
  const { workspaceUsers } = useWorkspace();

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(convSearch);

  const filterRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

    const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
const [isScrolling, setIsScrolling] = useState(false);
const scrollTimer = useRef<ReturnType<typeof setTimeout>>();

const handleScroll = useCallback(() => {
  // existing scroll pagination logic...
  if (!listRef.current || convLoading || !hasMoreConvs) return;
  const { scrollTop, scrollHeight, clientHeight } = listRef.current;
  if (scrollTop + clientHeight >= scrollHeight - 80) {
    loadMoreConversations();
  }

  // show scrollbar while scrolling, hide 1s after stop
  setIsScrolling(true);
  clearTimeout(scrollTimer.current);
  scrollTimer.current = setTimeout(() => setIsScrolling(false), 1000);
}, [convLoading, hasMoreConvs, loadMoreConversations]);

useEffect(() => {
  return () => clearTimeout(scrollTimer.current);
}, []);
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setConvSearch(searchInput);
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [searchInput, setConvSearch]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // const handleScroll = useCallback(() => {
  //   if (!listRef.current || convLoading || !hasMoreConvs) return;
  //   const { scrollTop, scrollHeight, clientHeight } = listRef.current;
  //   if (scrollTop + clientHeight >= scrollHeight - 80) {
  //     loadMoreConversations();
  //   }
  // }, [convLoading, hasMoreConvs, loadMoreConversations]);

  useEffect(() => {
    if (filters.lifecycleId == null || lifecycles.length > 0) return;
    void fetchLifecycles();
  }, [fetchLifecycles, filters.lifecycleId, lifecycles.length]);

  const totalUnread = convList.reduce(
    (sum, conversation) => sum + (conversation.unreadCount ?? 0),
    0,
  );
  const activeCategoryLabel = getActiveCategoryLabel(filters, lifecycles as any);
  const showChannelsLoadingState = channelsLoading && convList.length === 0;
  const showNoChannelsState =
    !channelsLoading && channels.length === 0 && convList.length === 0;

  const activePills: Array<{ label: string; clear: () => void }> = [];
  if (filters.status && filters.status !== "open" && filters.status !== "all") {
    activePills.push({
      label: filters.status,
      clear: () => setFilters({ status: "open" }),
    });
  }
  if (filters.assigneeId) {
    activePills.push({
      label:
        filters.assigneeId === "me"
          ? "Mine"
          : filters.assigneeId === "unassigned"
            ? "Unassigned"
            : "Assigned",
      clear: () => setFilters({ assigneeId: undefined }),
    });
  }
  if (filters.unreplied) {
    activePills.push({
      label: "Unreplied",
      clear: () => setFilters({ unreplied: false }),
    });
  }
  if (filters.direction && filters.direction !== "all") {
    activePills.push({
      label: filters.direction,
      clear: () => setFilters({ direction: "all" }),
    });
  }

  const assigneeOptions = [
    ...ASSIGNEE_OPTIONS,
    ...(workspaceUsers?.map((user: any) => ({
      value: String(user.id),
      label: `${user.firstName} ${user.lastName}`.trim(),
    })) ?? []),
  ];

  return (
    <div className="flex min-h-0 w-full flex-col bg-white md:w-80 md:flex-shrink-0 md:border-r md:border-gray-200">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          {onOpenCategories ? (
            <Button
              type="button"
              onClick={onOpenCategories}
              variant="soft"
              size="sm"
              radius="full"
              preserveChildLayout
              className="min-w-0 md:hidden"
            >
              <span className="flex min-w-0 items-center gap-2">
                <PanelLeftOpen size={16} className="flex-shrink-0 text-slate-500" />
                <span className="max-w-[7.5rem] truncate text-sm font-semibold">
                  {activeCategoryLabel}
                </span>
                {totalUnread > 0 ? (
                  <span className="inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                ) : null}
              </span>
            </Button>
          ) : null}

          <div className={`${onOpenCategories ? "hidden md:flex" : "flex"} min-w-0 items-center gap-2`}>
            <span className="text-sm font-bold text-gray-800">Inbox</span>
            {totalUnread > 0 ? (
              <span className="inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-[var(--color-primary-light)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => {
              setSearchOpen((open) => !open);
              if (searchOpen) setSearchInput("");
            }}
            icon={<Search size={18} />}
            variant={searchOpen ? "soft-primary" : "ghost"}
            size="sm"
            aria-label={searchOpen ? "Close conversation search" : "Search conversations"}
          />
          <div className="relative" ref={filterRef}>
            <IconButton
              onClick={() => setFilterOpen((open) => !open)}
              icon={<Filter size={18} />}
              variant={activePills.length > 0 || filterOpen ? "soft-primary" : "ghost"}
              size="sm"
              aria-label="Open conversation filters"
            />
            {activePills.length > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[8px] font-bold text-white">
                {activePills.length}
              </span>
            ) : null}

            {filterOpen ? (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-700">Filters</span>
                  <Button onClick={resetFilters} variant="link" size="xs">
                    Reset all
                  </Button>
                </div>

                <div className="space-y-3 p-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          onClick={() => setFilters({ status: option.value as any })}
                          variant={(filters?.status ?? "all") === option.value ? "primary" : "soft"}
                          size="xs"
                          radius="full"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Direction
                    </label>
                    <div className="flex gap-1">
                      {(["all", "incoming", "outgoing"] as const).map((direction) => (
                        <Button
                          key={direction}
                          onClick={() => setFilters({ direction })}
                          variant={(filters.direction ?? "all") === direction ? "soft-primary" : "secondary"}
                          size="xs"
                          leftIcon={
                            direction === "incoming" ? (
                              <ArrowDownLeft size={11} />
                            ) : direction === "outgoing" ? (
                              <ArrowUpRight size={11} />
                            ) : undefined
                          }
                        >
                          {direction === "all"
                            ? "All"
                            : direction.charAt(0).toUpperCase() + direction.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Select
                    label="Assigned to"
                    labelVariant="sidebar"
                    value={filters.assigneeId ?? ""}
                    onChange={(event) => setFilters({ assigneeId: event.target.value || undefined })}
                    options={assigneeOptions}
                    size="sm"
                  />

                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={Boolean(filters.unreplied)}
                      onChange={(value) => setFilters({ unreplied: value })}
                      ariaLabel={filters.unreplied ? "Show all conversations" : "Show unreplied conversations only"}
                    />
                    <span className="text-xs font-medium text-gray-700">Unreplied</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-b border-gray-100 px-3 py-2">
          <BaseInput
            autoFocus
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, email, phone..."
            size="sm"
            appearance="toolbar"
            leftIcon={<Search size={13} />}
            rightIcon={
              searchInput ? (
                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<X size={12} />}
                  onClick={() => setSearchInput("")}
                  aria-label="Clear conversation search"
                />
              ) : undefined
            }
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 overflow-x-auto border-b border-gray-200 scrollbar-hide">
        <div className="flex">
          {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => {
            const isActive = (filters.status ?? "open") === option.value;

            return (
              <Button
                key={option.value}
                onClick={() => setFilters({ status: option.value as ConvStatus })}
                variant="tab"
                selected={isActive}
                size="sm"
                radius="none"
                className="flex-shrink-0 whitespace-nowrap"
              >
                {option.label}
              </Button>
            );
          })}
        </div>

        <div className="mx-4 flex items-center justify-between gap-2">
          <Toggle
            checked={Boolean(filters.unreplied)}
            onChange={(value) => setFilters({ unreplied: value })}
            ariaLabel={filters.unreplied ? "Show all conversations" : "Show unreplied conversations only"}
          />
          <span className="text-xs font-medium text-gray-700">Unreplied</span>
        </div>
      </div>

      {/* {activePills.length > 0 ? (
        <div className="flex flex-wrap gap-1 border-b border-gray-100 px-3 py-2">
          {activePills.map((pill) => (
            <FilterPill key={pill.label} label={pill.label} onRemove={pill.clear} />
          ))}
        </div>
      ) : null} */}

    <div
  ref={listRef}
  onScroll={handleScroll}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  className={`flex-1 bg-[var(--color-gray-50)] px-2 py-2 ${
    isHovered || isScrolling ? "conv-list-scroll--visible" : "conv-list-scroll"
  }`}
>
        {(convLoading || showChannelsLoadingState) && convList.length === 0 ? (
          <>
            <ConvSkeleton />
            <ConvSkeleton />
            <ConvSkeleton />
            <ConvSkeleton />
            <ConvSkeleton />
          </>
        ) : null}

        {!convLoading && !showChannelsLoadingState && showNoChannelsState ? (
          <InboxAddChannelPrompt
            compact
            message="Add your first channel and this quiet list turns into your live customer queue."
          />
        ) : null}

        {!convLoading && !showChannelsLoadingState && !showNoChannelsState && convList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Search size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">No conversations found</p>
          </div>
        ) : null}

        {convList.map((conversation) => {
          const channelType = conversation.lastMessage?.channel?.type ?? "email";
          const channel = channelConfig[channelType] ?? channelConfig.email;
          const contact = conversation.contact;
          const lastMessage = conversation.lastMessage;
          const timestampLabel = formatConversationListTimestamp(
            conversation.lastMessageAt ?? lastMessage?.createdAt ?? conversation.lastMessageTime,
          );
          const isUnread = conversation.unreadCount > 0;
          const isSelected = selectedConversation?.id === conversation.id;
          const contactName = `${contact?.firstName ?? ""} ${contact?.lastName ?? ""}`.trim() || "Unknown contact";
          const contactAssignee = contact?.assigneeId
            ? workspaceUsers?.find((user: any) => String(user.id) === String(contact.assigneeId))
            : null;
          const assigneeName = contactAssignee
            ? `${contactAssignee.firstName ?? ""} ${contactAssignee.lastName ?? ""}`.trim()
            : "Unassigned";

          return (
            <Button
              key={conversation.id}
              type="button"
              onClick={() => onSelectConversation(conversation)}
              variant="list-row"
              selected={isSelected}
              fullWidth
              contentAlign="start"
              preserveChildLayout
              size="md"
              radius="lg"
              className="mb-1 text-left shadow-sm transition-shadow"
            >
              {isSelected ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-[var(--color-primary)]"
                />
              ) : null}
              <span className="flex min-w-0 flex-1 items-start gap-3 pr-2">
                <span className="flex-shrink-0">
                  <AvatarWithBadge
                    src={contact?.avatarUrl}
                    name={contactName}
                    size={isMobile ? "md" : "base"}
                    alt={contactName}
                    fallbackTone="neutral"
                    badgeType={getChannelBadgeType(channelType)}
                    badgeSrc={channel.icon}
                    badgeAlt={channel.label}
                    badgePlacement="overlap"
                  />
                </span>

                <span className="min-w-0 flex-1 overflow-hidden">
                  <span className="mb-0.5 flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1">
                      <TruncatedText
                        as="span"
                        text={contactName}
                        maxLines={1}
                        maxLength={15}
                        className={`block min-w-0 w-full text-lg  md:text-base text-gray-900 font-medium  md:font-normal ${
                          isUnread ? "font-medium md:font-medium" : "font-medium md:font-normal" 
                          
                        }
                        `}
                      />
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-1.5">
                      <span className={`whitespace-nowrap text-xs ${isUnread ? "font-semibold text-[var(--color-primary)]" :  "text-gray-400"}`}>
                        {timestampLabel}
                      </span>
                    </span>
                  </span>

                  <span className="mb-1 flex min-w-0 items-center gap-1">
                    {lastMessage?.direction === "incoming" ? (
                      <ArrowDownLeft size={11} className="flex-shrink-0 text-green-500" />
                    ) : (
                      <ArrowUpRight size={11} className="flex-shrink-0 text-[var(--color-primary)]" />
                    )}
                    <span className="min-w-0 flex-1">
                      <TruncatedText
                        as="span"
                        text={lastMessage?.text ?? conversation.subject ?? "..."}
                        maxLines={1}
                        className={`block min-w-0 w-full truncate text-sm ${
                          isUnread ? "font-medium text-gray-800" : "font-normal text-gray-500"
                        }`}
                      />
                    </span>
                                          <UnreadBadge count={conversation.unreadCount} />

                     {contactAssignee ? (
                      <Avatar
                        src={contactAssignee.avatarUrl}
                        name={assigneeName}
                        alt={assigneeName}
                        size="2xs"
                      />
                    ) : (
                      <UserCircle2 size={16} className="h-5 w-5 rounded-full text-gray-400" />
                    )}
                  </span>

                  <span className="flex flex-wrap items-center justify-end gap-1.5">
                    {contact?.tag ? (
                      <Tag
                        label={contact.tag}
                        size="sm"
                        bgColor="tag-blue"
                        maxWidth={120}
                      />
                    ) : null}

                    {/* {contactAssignee ? (
                      <Avatar
                        src={contactAssignee.avatarUrl}
                        name={assigneeName}
                        alt={assigneeName}
                        size="2xs"
                      />
                    ) : (
                      <UserCircle2 size={16} className="h-5 w-5 rounded-full text-gray-400" />
                    )} */}
                  </span>
                </span>
              </span>
            </Button>
          );
        })}

        {convLoading && convList.length > 0 ? (
          <>
            <ConvSkeleton />
            <ConvSkeleton />
          </>
        ) : null}

        {!hasMoreConvs && !convLoading && convList.length > 0 ? (
          <div className="flex justify-center py-4">
            <span className="text-[11px] text-gray-400">All conversations loaded</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
