import { useEffect, useState, type ComponentType } from "react";
import {
  Inbox,
  PanelLeftOpen,
  PanelRightOpen,
  UserCircle2,
  UserMinus,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CountBadge } from "../../components/ui/CountBadge";
import { Tooltip } from "../../components/ui/Tooltip";
import { IconButton } from "../../components/ui/button/IconButton";
import { useInbox } from "../../context/InboxContext";
import type { ConvStatus } from "../../lib/inboxApi";

interface SidebarItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  filter?: Partial<{
    status: ConvStatus | "all";
    assigneeId: string;
    unreplied: boolean;
  }>;
  shortcut?: string;
}

interface LifecycleItem {
  id: string | number;
  name: string;
  emoji: string;
  type: "lifecycle" | "lost";
  order: number;
}

const SECTIONS: SidebarItem[] = [
  {
    id: "all",
    label: "All",
    icon: Inbox,
    shortcut: "1",
  },
  {
    id: "mine",
    label: "Mine",
    icon: UserCircle2,
    filter: { assigneeId: "me" },
    shortcut: "2",
  },
  {
    id: "unassigned",
    label: "Unassigned",
    icon: UserMinus,
    filter: { assigneeId: "unassigned" },
    shortcut: "3",
  },
];

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

  const button = collapsed ? (
    <Button
      type="button"
      onClick={onClick}
      variant={isActive ? "soft-primary" : "ghost"}
      size="sm"
      radius="lg"
      iconOnly
      aria-label={item.label}
      leftIcon={
        <span className="relative inline-flex">
          <Icon size={18} className={isActive ? "text-[var(--color-primary)]" : "text-gray-500"} />
          <CountBadge count={count} compact />
        </span>
      }
    />
  ) : (
    <Button
      type="button"
      onClick={onClick}
      variant={isActive ? "soft-primary" : "ghost"}
      size="sm"
      radius="lg"
      fullWidth
      contentAlign="start"
      preserveChildLayout
      className="group"
    >
      <span className="flex w-full items-center gap-2.5">
        <Icon size={18} className={isActive ? "text-[var(--color-primary)]" : "text-gray-500"} />
        <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
          {item.label}
        </span>
        <span className="flex items-center gap-1.5">
          {item.shortcut ? (
            <kbd className="hidden items-center rounded bg-gray-100 px-1 py-0.5 font-mono text-[9px] text-gray-400 group-hover:inline-flex">
              {item.shortcut}
            </kbd>
          ) : null}
          <CountBadge count={count} />
        </span>
      </span>
    </Button>
  );

  return collapsed ? (
    <Tooltip content={item.label} position="right">
      {button}
    </Tooltip>
  ) : (
    button
  );
}

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
  const activeVariant = isLost ? "soft-warning" : "soft-primary";

  const button = collapsed ? (
    <Button
      type="button"
      onClick={onClick}
      variant={isActive ? activeVariant : "ghost"}
      size="sm"
      radius="lg"
      iconOnly
      aria-label={item.name}
      leftIcon={
        <span className="relative inline-flex">
          <span className="text-base leading-none">{item.emoji}</span>
          <CountBadge count={count} compact />
        </span>
      }
    />
  ) : (
    <Button
      type="button"
      onClick={onClick}
      variant={isActive ? activeVariant : "ghost"}
      size="sm"
      radius="lg"
      fullWidth
      contentAlign="start"
      preserveChildLayout
    >
      <span className="flex w-full items-center gap-2.5">
        <span className="flex-shrink-0 text-sm leading-none">{item.emoji}</span>
        <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
          {item.name}
        </span>
        <CountBadge count={count} tone={isLost ? "warning" : "primary"} />
      </span>
    </Button>
  );

  return collapsed ? (
    <Tooltip content={item.name} position="right">
      {button}
    </Tooltip>
  ) : (
    button
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="my-2 px-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">
      {label}
    </p>
  );
}

export function SubSidebar() {
  const { filters, setFilters, convList, lifecycles, fetchLifecycles } = useInbox();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchLifecycles();
  }, []);

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

  const unreadBySection: Record<string, number> = {
    all: convList.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    mine: convList
      .filter((conversation) => conversation.contact?.assigneeId != null)
      .reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    unassigned: convList
      .filter((conversation) => conversation.contact?.assigneeId == null)
      .reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    unreplied: convList.filter((conversation) => conversation.unreadCount > 0).length,
    pending: convList.filter((conversation) => conversation.status === "pending").length,
    resolved: convList.filter((conversation) => conversation.status === "resolved").length,
    closed: convList.filter((conversation) => conversation.status === "closed").length,
  };

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

  const lifecycleStages = lifecycles.filter(
    (item: LifecycleItem) => item.type === "lifecycle",
  );
  const lostStages = lifecycles.filter((item: LifecycleItem) => item.type === "lost");

  return (
    <div
      className={`flex flex-shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-all duration-200 ${
        collapsed ? "w-14" : "w-48"
      }`}
    >
      <div
        className={`flex h-14 items-center border-b border-gray-200 ${
          collapsed ? "justify-center" : "justify-end px-3"
        }`}
      >
        <IconButton
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          icon={collapsed ? <PanelLeftOpen size={18} /> : <PanelRightOpen size={18} />}
          variant="ghost"
          size="md"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        />
      </div>

      <div className="flex flex-col overflow-y-auto px-2 py-3">
        {!collapsed ? <SectionLabel label="Inbox" /> : null}
        {SECTIONS.map((item) => (
          <SidebarItemBtn
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            count={unreadBySection[item.id]}
            collapsed={collapsed}
            onClick={() => handleSelectSection(item)}
          />
        ))}

        {lifecycleStages.length > 0 ? (
          <>
            {!collapsed ? <SectionLabel label="Lifecycle" /> : null}
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
        ) : null}

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
      </div>
    </div>
  );
}
