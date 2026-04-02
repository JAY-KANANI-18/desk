/**
 * SubSidebar.tsx
 * ─────────────────────────────────────────────────────────────────
 * Left sub-sidebar: inbox section selector.
 *
 * Features:
 *  ✓ Collapsible (w-48 ↔ w-14)
 *  ✓ Static section items (All, Mine, Unassigned, Unreplied, Teams)
 *  ✓ Dedicated LifecycleItemBtn for server-fetched lifecycle stages
 *  ✓ Unread count badges derived from convList
 *  ✓ Active section drives InboxContext filters
 *  ✓ Keyboard shortcut display
 */

import { useEffect } from "react";
import { useState } from "react";
import {
  ChevronLeft, ChevronRight,
  Inbox, Clock, CheckCircle2, Lock,
  MessageSquareDot, UserCircle2, Users2,
  Bell,
  UserMinus,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useInbox } from "../../context/InboxContext";
import type { ConvStatus } from "../../lib/inboxApi";

// ─── Types ────────────────────────────────────────────────────────

interface SidebarItem {
  id: string;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  dotColor?: string;
  filter?: Partial<{ status: ConvStatus | "all"; assigneeId: string; unreplied: boolean }>;
  shortcut?: string;
}

/** Shape coming back from the server via InboxContext.lifecycles */
interface LifecycleItem {
  id: string | number;
  name: string;
  emoji: string;
  type: "lifecycle" | "lost";
  order: number;
}

// ─── Static section definitions ───────────────────────────────────

const SECTIONS: SidebarItem[] = [
  {
    id: "all",
    label: "All",
    icon: Inbox,
    dotColor: "bg-blue-500",
    shortcut: "1",
  },
  {
    id: "mine",
    label: "Mine",
    icon: UserCircle2,
    dotColor: "bg-emerald-500",
    filter: { assigneeId: "me" },
    shortcut: "2",
  },
  {
    id: "unassigned",
    label: "Unassigned",
    icon: UserMinus,
    dotColor: "bg-orange-400",
    filter: { assigneeId: "unassigned" },
    shortcut: "3",
  },
  
  // {
  //   id: "teams",
  //   label: "Teams",
  //   icon: Users2,
  // },
];


// ─── SidebarItemBtn (static items) ────────────────────────────────

function SidebarItemBtn({
  item,
  isActive,
  count,
  collapsed,
  onClick,
}: {
  item: SidebarItem;
  isActive: boolean;
  count?: number;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-2.5 rounded-lg transition-colors
        ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"}
        ${isActive
          ? "bg-indigo-50 text-indigo-600"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
    >
      

      {/* Icon with badge overlay — collapsed only */}
      
        <div className="relative">
          <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-500"} />
          {count != null && count > 0 && collapsed && (
            <span className={`absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px]
              bg-indigo-600 text-white text-[8px] font-bold rounded-full
              flex items-center justify-center px-0.5 leading-none`}>
              {count > 99 ? "99" : count}
            </span>
            
          )}
        </div>
      

      {/* Label + shortcut + count badge — expanded only */}
      {!collapsed && (
        <>
          <span className="flex-1 text-xs font-medium text-left truncate">
            {item.label}
          </span>
          <div className="flex items-center gap-1.5">
            {item.shortcut && (
              <kbd className="hidden group-hover:inline-flex items-center px-1 py-0.5
                rounded bg-gray-100 text-gray-400 text-[9px] font-mono">
                {item.shortcut}
              </kbd>
            )}
            {count != null && count > 0 && (
              <span className={`min-w-[18px] h-[18px] ${!isActive && "bg-indigo-100"} text-indigo-700
                text-[10px] font-bold rounded-full flex items-center justify-center px-1`}>
                {count > 99 ? "99+" : count}
              </span>
            )}
          </div>
        </>
      )}
    </button>
  );
}

// ─── LifecycleItemBtn (server-fetched lifecycle stages) ────────────

function LifecycleItemBtn({
  item,
  isActive,
  count,
  collapsed,
  onClick,
}: {
  item: LifecycleItem;
  isActive: boolean;
  count?: number;
  collapsed: boolean;
  onClick: () => void;
}) {
  const isLost = item.type === "lost";

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.name : undefined}
      className={`w-full flex items-center gap-2.5 rounded-lg transition-colors
        ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"}
        ${isActive
          ? isLost
            ? "bg-orange-50 text-orange-700"
            : "bg-indigo-50 text-indigo-600"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
    >
      {/* Emoji dot / indicator — collapsed */}
      {collapsed ? (
        <div className="relative">
          <span className="text-base leading-none">{item.emoji}</span>
          {count != null && count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px]
              bg-blue-600 text-white text-[8px] font-bold rounded-full
              flex items-center justify-center px-0.5 leading-none">
              {count > 99 ? "99" : count}
            </span>
          )}
        </div>
      ) : (
        // Expanded: emoji + name + badge
        <>
          <span className="text-sm leading-none flex-shrink-0">{item.emoji}</span>
          <span className="flex-1 text-xs font-medium text-left truncate">
            {item.name}
          </span>
          {count != null && count > 0 && (
            <span className={`min-w-[18px] h-[18px] text-[10px] font-bold rounded-full
              flex items-center justify-center px-1
              ${isLost
                ? "bg-orange-100 text-orange-700"
                : "bg-blue-100 text-blue-700"
              }`}>
              {count > 99 ? "99+" : count}
            </span>
          )}
        </>
      )}
    </button>
  );
}

// ─── Section label ────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest my-2">
      {label}
    </p>
  );
}

function Divider({ collapsed }: { collapsed: boolean }) {
  return <div className={`border-b border-gray-200 my-3 ${collapsed ? "mx-1" : "mx-2"}`} />;
}

// ─── Main ─────────────────────────────────────────────────────────

export function SubSidebar() {
  const { filters, setFilters, convList, lifecycles, fetchLifecycles } = useInbox();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchLifecycles();
  }, []);

  // ── Derive active id from current filters ──────────────────────

  const activeId = (() => {
    if (filters.unreplied) return "unreplied";
    if (filters.assigneeId === "me") return "mine";
    if (filters.assigneeId === "unassigned") return "unassigned";
    if (filters.status === "pending") return "pending";
    if (filters.status === "resolved") return "resolved";
    if (filters.status === "closed") return "closed";
    if (filters.lifecycleId) return String(filters.lifecycleId);
    return "all";
  })();

  // ── Unread counts derived from convList ───────────────────────

  const unreadBySection: Record<string, number> = {
    all: convList.reduce((s, c) => s + c.unreadCount, 0),
    mine: convList
      .filter(c => c.contact?.assigneeId != null)
      .reduce((s, c) => s + c.unreadCount, 0),
    unassigned: convList
      .filter(c => c.contact?.assigneeId == null)
      .reduce((s, c) => s + c.unreadCount, 0),
    unreplied: convList.filter(c => c.unreadCount > 0).length,
    pending: convList.filter(c => c.status === "pending").length,
    resolved: convList.filter(c => c.status === "resolved").length,
    closed: convList.filter(c => c.status === "closed").length,
  };

  // ── Handlers ──────────────────────────────────────────────────

  const handleSelectSection = (item: SidebarItem) => {
    setFilters({
      assigneeId: undefined,
      unreplied: undefined,
      lifecycleId: undefined,
      ...item.filter,
    });
  };

  const handleSelectLifecycle = (item: LifecycleItem) => {
    setFilters({
      assigneeId: undefined,
      unreplied: undefined,
      status: undefined,
      lifecycleId: item.id,
    });
  };

  // ── Split lifecycle items by type ─────────────────────────────

  const lifecycleStages = lifecycles.filter((l: LifecycleItem) => l.type === "lifecycle");
  const lostStages = lifecycles.filter((l: LifecycleItem) => l.type === "lost");

  // ── Render ────────────────────────────────────────────────────

  return (
    <div
      className={`flex-shrink-0 flex flex-col border-r border-gray-200 bg-white
        transition-all duration-200 overflow-hidden
        ${collapsed ? "w-14" : "w-48"}`}
    >
      {/* Collapse toggle */}
      <div className={`flex items-center h-14 border-b border-gray-200
        ${collapsed ? "justify-center" : "justify-end px-3"}`}>
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="w-10 h-10 flex items-center justify-center rounded-md
            text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <  PanelLeftOpen size={18} /> : <PanelRightOpen size={18} />}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex flex-col overflow-y-auto px-2 py-3 ">

        {/* ── Inbox sections ── */}
        {!collapsed && <SectionLabel label="Inbox" />}
        {SECTIONS.map(item => (
          <SidebarItemBtn
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            count={unreadBySection[item.id]}
            collapsed={collapsed}
            onClick={() => handleSelectSection(item)}
          />
        ))}


       

        {/* ── Lifecycle stages (from server) ── */}
        {lifecycleStages.length > 0 && (
          <>
            {/* <Divider collapsed={collapsed} /> */}
            {!collapsed && <SectionLabel label="Lifecycle" />}
            {lifecycleStages.map((item: LifecycleItem) => (
              <LifecycleItemBtn
                key={item.id}
                item={item}
                isActive={activeId === String(item.id)}
                count={unreadBySection[String(item.id)]}
                collapsed={collapsed}
                onClick={() => handleSelectLifecycle(item)}
              />
            ))}
          </>
        )}

        {/* ── Lost stages (from server) ── */}
        {lostStages.length > 0 && (
          <>
            {/* <Divider collapsed={collapsed} />
            {!collapsed && <SectionLabel label="Lost" />} */}
            {lostStages.map((item: LifecycleItem) => (
              <LifecycleItemBtn
                key={item.id}
                item={item}
                isActive={activeId === String(item.id)}
                count={unreadBySection[String(item.id)]}
                collapsed={collapsed}
                onClick={() => handleSelectLifecycle(item)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}