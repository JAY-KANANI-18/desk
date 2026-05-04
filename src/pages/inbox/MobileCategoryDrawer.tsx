import { useEffect } from "react";
import { Inbox, UserCircle2, UserMinus } from "@/components/ui/icons";
import { useInbox } from "../../context/InboxContext";
import { MobileSheet } from "../../components/ui/modal";
import { Button } from "../../components/ui/Button";
import { Tag } from "../../components/ui/Tag";

type LifecycleItem = {
  id: string | number;
  name: string;
  emoji: string;
  type: "lifecycle" | "lost";
};

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  filter?: Partial<{
    assigneeId: string;
    unreplied: boolean;
  }>;
};

const SECTIONS: SidebarItem[] = [
  { id: "all", label: "All", icon: Inbox },
  { id: "mine", label: "Mine", icon: UserCircle2, filter: { assigneeId: "me" } },
  {
    id: "unassigned",
    label: "Unassigned",
    icon: UserMinus,
    filter: { assigneeId: "unassigned" },
  },
];

function DrawerRow({
  selected,
  tone = "primary",
  onClick,
  children,
}: {
  selected: boolean;
  tone?: "primary" | "warning";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant={selected ? (tone === "warning" ? "soft-warning" : "soft-primary") : "ghost"}
      size="md"
      radius="lg"
      fullWidth
      contentAlign="start"
    >
      <div className="flex w-full items-center gap-3 text-left">{children}</div>
    </Button>
  );
}

export function getActiveCategoryLabel(
  filters: {
    assigneeId?: string;
    unreplied?: boolean;
    lifecycleId?: string | number | null;
  },
  lifecycles: LifecycleItem[],
) {
  if (filters.unreplied) return "Unreplied";
  if (filters.assigneeId === "me") return "Mine";
  if (filters.assigneeId === "unassigned") return "Unassigned";
  if (filters.lifecycleId != null) {
    return (
      lifecycles.find((item) => String(item.id) === String(filters.lifecycleId))
        ?.name ?? "Lifecycle"
    );
  }
  return "All";
}

interface MobileCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileCategoryDrawer({
  open,
  onClose,
}: MobileCategoryDrawerProps) {
  const { filters, setFilters, convList, lifecycles, fetchLifecycles } = useInbox();

  useEffect(() => {
    if (!open) return;
    void fetchLifecycles();
  }, [fetchLifecycles, open]);

  if (!open) {
    return null;
  }

  const activeId = (() => {
    if (filters.unreplied) return "unreplied";
    if (filters.assigneeId === "me") return "mine";
    if (filters.assigneeId === "unassigned") return "unassigned";
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
  };

  const lifecycleStages = lifecycles.filter(
    (item: LifecycleItem) => item.type === "lifecycle",
  );
  const lostStages = lifecycles.filter(
    (item: LifecycleItem) => item.type === "lost",
  );

  const selectSection = (item: SidebarItem) => {
    setFilters({
      assigneeId: undefined,
      unreplied: undefined,
      lifecycleId: undefined,
      ...item.filter,
    });
    onClose();
  };

  const selectLifecycle = (item: LifecycleItem) => {
    setFilters({
      assigneeId: undefined,
      unreplied: undefined,
      status: undefined,
      lifecycleId: item.id,
    });
    onClose();
  };

  return (
    <MobileSheet
      isOpen={open}
      title={
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Categories
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            {getActiveCategoryLabel(filters, lifecycles as LifecycleItem[])}
          </h2>
        </div>
      }
      onClose={onClose}
    >
      <div className="p-3">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Inbox
        </p>
        <div className="space-y-1">
          {SECTIONS.map((item) => (
            <DrawerRow
              key={item.id}
              selected={activeId === item.id}
              onClick={() => selectSection(item)}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="flex-1 truncate text-sm font-semibold">
                {item.label}
              </span>
              {unreadBySection[item.id] > 0 ? (
                <Tag
                  label={unreadBySection[item.id] > 99 ? "99+" : String(unreadBySection[item.id])}
                  size="sm"
                  bgColor={activeId === item.id ? "primary" : "gray"}
                />
              ) : null}
            </DrawerRow>
          ))}
        </div>

        {lifecycleStages.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Lifecycle
            </p>
            <div className="space-y-1">
              {lifecycleStages.map((item) => (
                <DrawerRow
                  key={item.id}
                  selected={activeId === String(item.id)}
                  onClick={() => selectLifecycle(item)}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="truncate text-sm font-semibold">
                    {item.name}
                  </span>
                </DrawerRow>
              ))}
            </div>
          </div>
        ) : null}

        {lostStages.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Lost
            </p>
            <div className="space-y-1">
              {lostStages.map((item) => (
                <DrawerRow
                  key={item.id}
                  selected={activeId === String(item.id)}
                  tone="warning"
                  onClick={() => selectLifecycle(item)}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="truncate text-sm font-semibold">
                    {item.name}
                  </span>
                </DrawerRow>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </MobileSheet>
  );
}
