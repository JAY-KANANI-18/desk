import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import {
  RefreshCw,
  GitMerge,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  UserCircle2,
} from "@/components/ui/icons";
import { useMobileHeaderActions } from "../components/mobileHeaderActions";
import { PageLayout } from "../components/ui/PageLayout";
import { Button } from "../components/ui/button/Button";
import { IconButton } from "../components/ui/button/IconButton";
import {
  Avatar,
  AvatarWithBadge,
} from "../components/ui/Avatar";
import { CompactSelectMenu, type CompactSelectMenuGroup } from "../components/ui/Select";
import { CountBadge } from "../components/ui/CountBadge";
import { TruncatedText } from "../components/ui/TruncatedText";
import { getAvatarBadgeTypeForChannel } from "../config/channelMetadata";
import { workspaceApi } from "../lib/workspaceApi";
import {
  CHANNEL_CONNECT_SLUGS,
  getChannelDefinitionByConnectSlug,
} from "./channels/channelRegistry";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContactTab = "open" | "assigned" | "unassigned";

interface LifecycleStage {
  id: string;
  name: string;
  emoji: string;
  count: number;
  percent: number;
}

interface ContactChannel {
  channelType: string;
  identifier?: string;
}

interface DashboardContactIdentity {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  } | null;
  lifecycle?: { id: string; name: string; emoji: string };
  contactChannels: ContactChannel[];
}

interface DashboardLastMessage {
  text?: string;
  type?: string;
  direction?: string;
  sentAt?: string;
  channelType?: string;
  channel?: string | { type?: string };
}

interface ContactRow {
  id: string;
  contact?: DashboardContactIdentity | null;
  updatedAt: string;
  lastMessageAt?: string;
  subject?: string;
  unreadCount?: number;
  lastMessage?: DashboardLastMessage | null;
  conversation?: {
    id: string;
    status: string;
    unreadCount: number;
    lastMessageAt?: string;
    lastMessage?: DashboardLastMessage | null;
  };
}

interface Member {
  id: string;
  userId: string;
  role: string;
  availability: string;
  assignedCount: number;
  joinedAt?: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    email: string;
    activityStatus: string;
    lastSeenAt?: string;
  };
}

interface MergeSuggestion {
  contact1: DashboardContactIdentity;
  contact2: DashboardContactIdentity;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "💬",
  instagram: "📸",
  messenger: "💙",
  email: "✉️",
  webchat: "🌐",
};

const STATUS_COLOR: Record<string, string> = {
  online: "var(--color-success)",
  offline: "var(--color-gray-300)",
  busy: "var(--color-warning)",
  away: "#fb923c",
};

const MEMBER_STATUS_GROUPS: CompactSelectMenuGroup[] = [
  {
    options: [
      { value: "all", label: "All Statuses", tone: "neutral" },
      { value: "online", label: "Online", description: "Available now" },
      { value: "offline", label: "Offline", tone: "neutral" },
      { value: "busy", label: "Busy", tone: "warning" },
      { value: "away", label: "Away", tone: "warning" },
    ],
  },
];

// ── Small components ───────────────────────────────────────────────────────────

function timeAgo(date?: string): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function previewMessage(msg?: ContactRow["conversation"]) {
  if (!msg?.lastMessage) return null;
  const { text, type, direction } = msg.lastMessage;
  const prefix = direction === "outgoing" ? "↗ " : "";
  if (text) return prefix + text;
  const typeLabels: Record<string, string> = {
    image: "📷 Photo",
    video: "🎥 Video",
    audio: "🎵 Audio",
    document: "📎 Document",
  };
  return prefix + (typeLabels[type] ?? type);
}

function getContactName(contact?: DashboardContactIdentity | null) {
  const name = [contact?.firstName, contact?.lastName].filter(Boolean).join(" ");

  return name || contact?.email || contact?.phone || "Contact";
}

function getUserName(user?: { firstName?: string; lastName?: string; email?: string } | null) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return name || user?.email || "Team member";
}

function getChannelSlug(channelType?: string | null) {
  const normalized = channelType?.toLowerCase().trim() ?? "";

  return CHANNEL_CONNECT_SLUGS[normalized] ?? normalized;
}

function getDashboardChannel(channelType?: string | null) {
  const slug = getChannelSlug(channelType);
  const definition = getChannelDefinitionByConnectSlug(slug);

  return {
    label: definition?.name ?? channelType ?? "Channel",
    icon: definition?.icon,
    badgeType: getAvatarBadgeTypeForChannel(slug),
  };
}

function getLastMessageChannelType(row: ContactRow) {
  const messageChannel = row.lastMessage?.channel ?? row.conversation?.lastMessage?.channel;

  if (typeof messageChannel === "string") {
    return messageChannel;
  }

  return (
    messageChannel?.type ??
    row.lastMessage?.channelType ??
    row.conversation?.lastMessage?.channelType ??
    row.contact?.contactChannels?.[0]?.channelType
  );
}

function getLastMessageText(row: ContactRow) {
  const message = row.lastMessage ?? row.conversation?.lastMessage;

  return message?.text ?? row.subject ?? "...";
}

function DashboardContactAvatar({
  contact,
  channelType,
  size = "md",
}: {
  contact?: DashboardContactIdentity | null;
  channelType?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const contactName = getContactName(contact);

  if (!channelType) {
    return (
      <Avatar
        src={contact?.avatarUrl}
        name={contactName}
        size={size}
        fallbackTone="neutral"
      />
    );
  }

  const channel = getDashboardChannel(channelType);

  return (
    <AvatarWithBadge
      src={contact?.avatarUrl}
      name={contactName}
      size={size}
      fallbackTone="neutral"
      badgeType={channel.badgeType}
      badgeSrc={channel.icon}
      badgeAlt={channel.label}
    />
  );
}

function SectionCard({
  title,
  rightSlot,
  children,
  className = "",
}: {
  title: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl bg-white  md:border-slate-200 ${className}`}
    >
      <div className="flex flex-shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const Dashboard = () => {
  const navigate = useNavigate();

  // Lifecycle
  const [lifecycle, setLifecycle] = useState<{
    stages: LifecycleStage[];
    total: number;
  } | null>(null);

  // Contacts
  const [contactTab, setContactTab] = useState<ContactTab>("open");
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [contactCounts, setContactCounts] = useState({
    open: 0,
    assigned: 0,
    unassigned: 0,
  });
  const [contactCursor, setContactCursor] = useState<string | undefined>();
  const [contactNextCursor, setContactNextCursor] = useState<
    string | undefined
  >();
  const [contactLoading, setContactLoading] = useState(false);
  const cursorStackRef = useRef<string[]>([]); // stack for prev pages

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);
  const [memberFilter, setMemberFilter] = useState("all");
  const [memberLoading, setMemberLoading] = useState(false);

  // Merge
  const [suggestions, setSuggestions] = useState<MergeSuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Global
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // ── Loaders ──────────────────────────────────────────────────────────────────

  const loadLifecycle = useCallback(async () => {
    try {
      const res = await workspaceApi.getDashboardLifecycle();
      setLifecycle(res);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadContacts = useCallback(
    async (tab: ContactTab, cursor?: string, replace = true) => {
      setContactLoading(true);
      try {
        const res = await workspaceApi.getDashboardContacts({
          tab,
          cursor,
          limit: 10,
        });
        if (replace) setContacts(res.data);
        setContactCounts(res.counts);
        setContactNextCursor(res.nextCursor);
        setContactCursor(cursor);
      } catch (e) {
        console.error(e);
      } finally {
        setContactLoading(false);
      }
    },
    [],
  );

  const loadMembers = useCallback(async (page: number, status: string) => {
    setMemberLoading(true);
    try {
      const res = await workspaceApi.getDashboardMembers({
        page,
        limit: 10,
        status,
      });
      setMembers(res.data);
      setMemberTotalPages(res.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setMemberLoading(false);
    }
  }, []);

  const loadMerge = useCallback(async () => {
    try {
      const res = await workspaceApi.getDashboardMergeSuggestions();
      setSuggestions(res);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadLifecycle();
    loadContacts("open");
    loadMembers(1, "all");
    loadMerge();
  }, []);

  // Re-fetch contacts when tab changes
  useEffect(() => {
    cursorStackRef.current = [];
    setContactCursor(undefined);
    setContactNextCursor(undefined);
    loadContacts(contactTab);
  }, [contactTab]);

  // Re-fetch members when filter / page changes
  useEffect(() => {
    loadMembers(memberPage, memberFilter);
  }, [memberPage, memberFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadLifecycle(),
      loadContacts(contactTab),
      loadMembers(memberPage, memberFilter),
      loadMerge(),
    ]);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, [contactTab, loadContacts, loadLifecycle, loadMembers, loadMerge, memberFilter, memberPage]);

  useMobileHeaderActions(
    {
      actions: [
        {
          id: "dashboard-refresh",
          label: "Refresh dashboard",
          icon: (
            <RefreshCw
              className={refreshing ? "animate-spin" : ""}
              size={18}
            />
          ),
          disabled: refreshing,
          onClick: () => void handleRefresh(),
        },
      ],
    },
    [handleRefresh, refreshing],
  );

  // Contact pagination
  const contactNextPage = () => {
    if (!contactNextCursor) return;
    cursorStackRef.current.push(contactCursor ?? "");
    loadContacts(contactTab, contactNextCursor);
  };

  const contactPrevPage = () => {
    const prev = cursorStackRef.current.pop();
    loadContacts(contactTab, prev === "" ? undefined : prev);
  };

  const hasPrevContact = cursorStackRef.current.length > 0;

  // Merge actions
  const handleMerge = async (s: MergeSuggestion) => {
    try {
      await workspaceApi.mergeContacts(s.contact1.id, s.contact2.id);
      setSuggestions((p) => p.filter((x) => x.contact1.id !== s.contact1.id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismiss = (s: MergeSuggestion) => {
    const key = [s.contact1.id, s.contact2.id].sort().join("-");
    setDismissed((p) => new Set([...p, key]));
  };

  const visibleSuggestions = suggestions.filter((s) => {
    const key = [s.contact1.id, s.contact2.id].sort().join("-");
    return !dismissed.has(key);
  });

  const updatedLabel = timeAgo(lastUpdated.toISOString());
  const lastUpdatedLabel =
    updatedLabel === "now"
      ? "Last updated just now"
      : `Last updated ${updatedLabel} ago`;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <PageLayout
      title="Dashboard"
      actions={
        <>
          <span className="text-xs text-gray-400">{lastUpdatedLabel}</span>
          <Button
            onClick={handleRefresh}
            loading={refreshing}
            loadingMode="inline"
            loadingLabel="Refresh"
       
            leftIcon={<RefreshCw size={18} />}
          >
            Refresh
          </Button>
        </>
      }
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-y-auto bg-white px-0 py-0"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 sm:p-4 md:flex-none md:overflow-visible">
        {/* ── Lifecycle — single horizontal row ────────────────────── */}
        <SectionCard title="Lifecycle">
          <div className="overflow-x-auto px-3 py-3 scrollbar-thin scrollbar-thumb-gray-200 sm:px-4">
            <div className="flex min-w-max gap-3">
              {(lifecycle?.stages ?? []).length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  No lifecycle stages configured
                </p>
              ) : (
                (lifecycle?.stages ?? []).map((stage) => (
                  <Button
                    key={stage.id}
                    onClick={() => navigate(`/contacts?lifecycle=${stage.id}`)}
                    variant="select-card"
                    size="lg"
                    radius="lg"
                    contentAlign="start"
                    preserveChildLayout
                    className="w-[13rem] flex-shrink-0 sm:w-56"
                  >
                    <div className="flex w-full flex-col gap-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{stage.emoji}</span>
                        <span className="text-[10px] font-medium text-gray-400">
                          {stage.percent}%
                        </span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold leading-none text-gray-900">
                          {stage.count}
                        </p>
                        <TruncatedText
                          text={stage.name}
                          maxLines={1}
                          className="mt-0.5 text-xs text-gray-500"
                        />
                      </div>
                    </div>
                    
                  </Button>
                ))
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Middle row: Contacts + Members ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Contacts */}
          <SectionCard title="Contacts" className="min-h-[360px] lg:h-[420px]">
            {/* Tabs */}
            <div className="flex flex-shrink-0 overflow-x-auto border-b border-gray-100">
              {(
                [
                  { key: "open", label: "Open", count: contactCounts.open },
                  {
                    key: "assigned",
                    label: "Assigned",
                    count: contactCounts.assigned,
                  },
                  {
                    key: "unassigned",
                    label: "Unassigned",
                    count: contactCounts.unassigned,
                  },
                ] as const
              ).map((t) => (
                <Button
                  key={t.key}
                  onClick={() => setContactTab(t.key)}
                  variant="tab"
                  selected={contactTab === t.key}
                  size="sm"
                  radius="none"
                  className="shrink-0"
                  aria-pressed={contactTab === t.key}
                  preserveChildLayout
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>{t.label}</span>
                    <CountBadge
                      count={t.count}
                      showZero
                      tone={contactTab === t.key ? "primary" : "neutral"}
                    />
                  </span>
                </Button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 min-h-0">
              {contactLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw size={14} className="animate-spin text-gray-300" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-gray-400">No contacts</p>
                </div>
              ) : (
                contacts.map((conv) => {
                  const contact = conv.contact;
                  const lastMsg = conv.lastMessage ?? conv.conversation?.lastMessage;
                  const channelType = getLastMessageChannelType(conv);
                  const contactAssignee =
                    contact?.assignee ??
                    members.find(
                      (member) =>
                        member.userId === contact?.assigneeId ||
                        member.user.id === contact?.assigneeId,
                    )?.user ??
                    null;
                  const contactName = getContactName(contact);
                  const assigneeName = getUserName(contactAssignee);
                  return (
                    <Button
                      key={conv.id}
                      onClick={() => navigate(`/contacts/${conv.id}`)}
                      variant="list-row"
                      fullWidth
                      contentAlign="start"
                      preserveChildLayout
                      aria-label={`Open ${contactName}`}
                    >
                      <div className="flex w-full items-start gap-3 text-left">
                        <DashboardContactAvatar
                          contact={contact}
                          channelType={channelType}
                          size="sm"
                        />

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          {/* Row 1: name + time + unread */}
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="min-w-0 flex items-center gap-1.5">
                              <TruncatedText
                                text={contactName}
                                maxLines={1}
                                className="text-sm text-gray-800"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span className={`text-xs text-gray-400`}>
                                {conv.lastMessageAt
                                  ? new Date(
                                      conv.lastMessageAt,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                          </div>

                          {/* Row 2: direction + last message */}
                          <div className="flex items-center gap-1 mb-1">
                            {lastMsg?.direction === "incoming" ? (
                              <ArrowDownLeft
                                size={11}
                                className="text-green-500 flex-shrink-0"
                              />
                            ) : (
                              <ArrowUpRight
                                size={11}
                                className="text-[var(--color-primary)] flex-shrink-0"
                              />
                            )}
                            <p className={`text-xs truncate  text-gray-500`}>
                              {lastMsg?.text ?? conv?.subject ?? "…"}
                            </p>
                          </div>

                          {/* Row 3: tag + assignee chip */}
                          <div className="flex flex-wrap items-center justify-end">
                            {contact?.assigneeId && contactAssignee ? (
                              <Avatar
                                src={contactAssignee.avatarUrl}
                                name={assigneeName}
                                size="2xs"
                                fallbackTone="neutral"
                              />
                            ) : (
                              <>
                                <UserCircle2
                                  size={16}
                                  className="h-5 w-5 rounded-full text-gray-400"
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 px-3 py-2 sm:px-4">
              <Button
                onClick={contactPrevPage}
                disabled={!hasPrevContact || contactLoading}
                variant="secondary"
                size="xs"
                leftIcon={<ChevronLeft size={12} />}
              >
                Prev
              </Button>
              <Button
                onClick={contactNextPage}
                disabled={!contactNextCursor || contactLoading}
                variant="secondary"
                size="xs"
                rightIcon={<ChevronRight size={12} />}
              >
                Next
              </Button>
            </div>
          </SectionCard>

          {/* Team Members */}
          <SectionCard
            title="Team Members"
            className="min-h-[360px] lg:h-[420px]"
            rightSlot={
              <CompactSelectMenu
                value={memberFilter}
                groups={MEMBER_STATUS_GROUPS}
                onChange={(value) => {
                  setMemberFilter(value);
                  setMemberPage(1);
                }}
                triggerAppearance="field"
                dropdownWidth="sm"
                dropdownAlign="end"
                size="xs"
              />
            }
          >
            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 min-h-0">
              {memberLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw size={14} className="animate-spin text-gray-300" />
                </div>
              ) : members.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-gray-400">No members found</p>
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <Avatar
                      src={member.user.avatarUrl}
                      name={getUserName(member.user)}
                      size="sm"
                      fallbackTone="neutral"
                      showStatus
                      statusColor={
                        STATUS_COLOR[member.user.activityStatus] ??
                        "var(--color-gray-300)"
                      }
                    />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <TruncatedText
                        text={getUserName(member.user)}
                        maxLines={1}
                        className="text-xs font-semibold text-gray-800"
                      />
                      <p className="text-[10px] text-gray-400 truncate">
                        {member.role} · {member.assignedCount} assigned
                      </p>
                    </div>

                    {/* Last seen */}
                    {member.user.lastSeenAt && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
                        <Clock size={10} />
                        {new Date(member.user.lastSeenAt).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 px-3 py-2 sm:px-4">
              <Button
                onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                disabled={memberPage <= 1 || memberLoading}
                variant="secondary"
                size="xs"
                leftIcon={<ChevronLeft size={12} />}
              >
                Prev
              </Button>
              <span className="text-[10px] text-gray-400">
                {memberPage} / {memberTotalPages}
              </span>
              <Button
                onClick={() =>
                  setMemberPage((p) => Math.min(memberTotalPages, p + 1))
                }
                disabled={memberPage >= memberTotalPages || memberLoading}
                variant="secondary"
                size="xs"
                rightIcon={<ChevronRight size={12} />}
              >
                Next
              </Button>
            </div>
          </SectionCard>
        </div>

        {/* ── Merge Suggestions ─────────────────────────────────────── */}
        {visibleSuggestions.length > 0 && (
          <SectionCard title="Merge Suggestions">
            <div className="divide-y divide-gray-50">
              {visibleSuggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                >
                  {/* Contact 1 */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative">
                      <Avatar
                        src={s.contact1.avatarUrl}
                        name={getContactName(s.contact1)}
                        size="md"
                        fallbackTone="neutral"
                      />
                      {s.contact1.contactChannels[0] && (
                        <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">
                          {CHANNEL_ICONS[
                            s.contact1.contactChannels[0].channelType
                          ] ?? "💬"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {s.contact1.firstName} {s.contact1.lastName}
                    </p>
                  </div>

                  {/* Arrow */}
                  <GitMerge size={14} className="text-gray-300 flex-shrink-0" />

                  {/* Contact 2 */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative">
                      <Avatar
                        src={s.contact2.avatarUrl}
                        name={getContactName(s.contact2)}
                        size="md"
                        fallbackTone="neutral"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {s.contact2.firstName} {s.contact2.lastName}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {s.contact2.contactChannels.length > 0
                          ? s.contact2.contactChannels
                              .map((c) => c.channelType)
                              .join(", ")
                          : "No channels"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 sm:ml-auto">
                    <Button
                      onClick={() => handleMerge(s)}
                      variant="secondary"
                      size="xs"
                      leftIcon={<GitMerge size={11} />}
                    >
                      Merge
                    </Button>
                    <IconButton
                      onClick={() => handleDismiss(s)}
                      variant="danger-ghost"
                      size="xs"
                      icon={<X size={12} />}
                      aria-label="Dismiss merge suggestion"
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </PageLayout>
  );
};

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="flex-shrink-0 min-w-[18px] h-[18px] bg-[var(--color-primary)] text-white
      text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
