import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  RefreshCw,
  GitMerge,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  UserCircle2,
} from "lucide-react";
import { workspaceApi } from "../lib/workspaceApi";
import { channelConfig } from "./inbox/data";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContactTab = "open" | "assigned" | "unassigned";

interface LifecycleStage {
  id: string;
  name: string;
  emoji: string;
  count: number;
  percent: number;
}

interface ContactRow {
  id: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  updatedAt: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
  };
  lifecycle?: { id: string; name: string; emoji: string };
  contactChannels: { channelType: string }[];
  conversation?: {
    id: string;
    status: string;
    unreadCount: number;
    lastMessageAt?: string;
    lastMessage?: {
      text?: string;
      type: string;
      direction: string;
      sentAt?: string;
    };
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
  contact1: ContactRow & { contactChannels: { channelType: string }[] };
  contact2: ContactRow & { contactChannels: { channelType: string }[] };
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
  online: "bg-green-500",
  offline: "bg-gray-300",
  busy: "bg-yellow-400",
  away: "bg-orange-400",
};

// ── Small components ───────────────────────────────────────────────────────────

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sz = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-9 h-9 text-xs",
  }[size];
  const initials = name
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (src)
    return (
      <img
        src={src}
        alt={name}
        className={`${sz} rounded-full object-cover flex-shrink-0`}
      />
    );
  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {initials || "?"}
    </div>
  );
}

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

function SectionCard({
  title,
  rightSlot,
  children,
  className = "",
}: {
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border  flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-3  flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadLifecycle(),
      loadContacts(contactTab),
      loadMembers(memberPage, memberFilter),
      loadMerge(),
    ]);
    setLastUpdated(new Date());
    setRefreshing(false);
  };

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

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Last updated {timeAgo(lastUpdated.toISOString())} ago
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Lifecycle — single horizontal row ────────────────────── */}
        <SectionCard title="Lifecycle">
          <div className="overflow-x-auto px-4 py-3 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="flex gap-3" style={{ minWidth: "max-content" }}>
              {(lifecycle?.stages ?? []).length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  No lifecycle stages configured
                </p>
              ) : (
                (lifecycle?.stages ?? []).map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => navigate(`/contacts?lifecycle=${stage.id}`)}
                    className="w-56 flex-shrink-0 flex flex-col gap-2 p-3.5 rounded-xl border   hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{stage.emoji}</span>
                      <span className="text-[10px] font-medium text-gray-400 group-hover:text-indigo-500">
                        {stage.percent}%
                      </span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 leading-none">
                        {stage.count}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {stage.name}
                      </p>
                    </div>
                    
                  </button>
                ))
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Middle row: Contacts + Members ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Contacts */}
          <SectionCard title="Contacts" className="h-[420px]">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
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
                <button
                  key={t.key}
                  onClick={() => setContactTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                    contactTab === t.key
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      contactTab === t.key
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
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
                  const lastMsg = conv?.lastMessage;
                  const channel = conv?.contact?.contactChannels?.[0]?.channelType;
                  const contactAssignee = conv?.contact.assigneeId
                    ? members?.find(
                        (u: any) => u.id === conv.assigneeId,
                      )
                    : null;
                    console.log({conv});
                    
                  const preview = previewMessage(conv.conversation);
                  return (
                    <div
                      key={conv.id}
                      onClick={() => navigate(`/contacts/${conv.id}`)}
                      className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors
               `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar + channel badge */}
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center
                    text-sm font-semibold `}
                          >
                            {conv?.contact?.avatarUrl ? (
                              <img
                                src={conv.contact.avatarUrl}
                                alt={conv.contact.firstName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>
                                {conv?.contact?.firstName?.charAt(0)?.toUpperCase() ??
                                  "?"}
                              </span>
                            )}
                          </div>
                          {/* Channel icon */}
                          <span
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center
                    border-2 border-white bg-white"
                          >
                            <img
                              src={channelConfig[lastMsg?.channel?.type || channel]?.icon}
                              alt={channelConfig[lastMsg?.channel?.type || channel]?.label}
                              className="w-3 h-3"
                            />
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Row 1: name + time + unread */}
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {/* Priority dot */}
                              <span className={`text-sm truncate `}>
                                {conv?.contact?.firstName} {conv?.contact?.lastName}
                              </span>
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
                                className="text-indigo-500 flex-shrink-0"
                              />
                            )}
                            <p className={`text-xs truncate  text-gray-500`}>
                              {lastMsg?.text ?? conv?.subject ?? "…"}
                            </p>
                          </div>

                          {/* Row 3: tag + assignee chip */}
                          <div className="flex items-center justify-end  flex-wrap">
                            {conv?.contact?.assigneeId ? (
                              <>
                                <img
                                  src={contactAssignee?.avatarUrl}
                                  alt={`${contactAssignee?.firstName} ${contactAssignee?.lastName}`}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              </>
                            ) : (
                              <>
                                <UserCircle2
                                  size={16}
                                  className="text-gray-400 w-5 h-5 rounded-full"
                                />
                                <span className="text-gray-500"></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={contactPrevPage}
                disabled={!hasPrevContact || contactLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <button
                onClick={contactNextPage}
                disabled={!contactNextCursor || contactLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          </SectionCard>

          {/* Team Members */}
          <SectionCard
            title="Team Members"
            className="h-[420px]"
            rightSlot={
              <select
                value={memberFilter}
                onChange={(e) => {
                  setMemberFilter(e.target.value);
                  setMemberPage(1);
                }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                <option value="all">All Statuses</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="busy">Busy</option>
                <option value="away">Away</option>
              </select>
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
                    {/* Avatar + status dot */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={member.user.avatarUrl}
                        name={`${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`}
                        size="lg"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          STATUS_COLOR[member.user.activityStatus] ??
                          "bg-gray-300"
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {member.user.firstName} {member.user.lastName}
                      </p>
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
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                disabled={memberPage <= 1 || memberLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <span className="text-[10px] text-gray-400">
                {memberPage} / {memberTotalPages}
              </span>
              <button
                onClick={() =>
                  setMemberPage((p) => Math.min(memberTotalPages, p + 1))
                }
                disabled={memberPage >= memberTotalPages || memberLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          </SectionCard>
        </div>

        {/* ── Merge Suggestions ─────────────────────────────────────── */}
        {visibleSuggestions.length > 0 && (
          <SectionCard title="Merge Suggestions">
            <div className="divide-y divide-gray-50">
              {visibleSuggestions.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  {/* Contact 1 */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative">
                      <Avatar
                        src={s.contact1.avatarUrl}
                        name={`${s.contact1.firstName} ${s.contact1.lastName ?? ""}`}
                        size="md"
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
                        name={`${s.contact2.firstName} ${s.contact2.lastName ?? ""}`}
                        size="md"
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
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleMerge(s)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <GitMerge size={11} /> Merge
                    </button>
                    <button
                      onClick={() => handleDismiss(s)}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="flex-shrink-0 min-w-[18px] h-[18px] bg-indigo-600 text-white
      text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
