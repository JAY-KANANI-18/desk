import { useEffect } from "react";
import { Inbox, UserCircle2, UserMinus } from "lucide-react";
import { useInbox } from "../../context/InboxContext";
import { MobileSheet } from "../../components/topbar/MobileSheet";

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
      open={open}
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
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSection(item)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                    activeId === item.id
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  <span className="flex-1 truncate text-sm font-semibold">
                    {item.label}
                  </span>
                  {unreadBySection[item.id] > 0 ? (
                    <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-indigo-100 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-600">
                      {unreadBySection[item.id] > 99 ? "99+" : unreadBySection[item.id]}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {lifecycleStages.length > 0 ? (
              <div className="mt-5">
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Lifecycle
                </p>
                <div className="space-y-1">
                  {lifecycleStages.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectLifecycle(item)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                        activeId === String(item.id)
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-base">{item.emoji}</span>
                      <span className="truncate text-sm font-semibold">
                        {item.name}
                      </span>
                    </button>
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
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectLifecycle(item)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                        activeId === String(item.id)
                          ? "bg-orange-50 text-orange-700"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-base">{item.emoji}</span>
                      <span className="truncate text-sm font-semibold">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
      </div>
    </MobileSheet>
  );
}
