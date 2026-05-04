import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  MoreHorizontal,
  Search,
} from "@/components/ui/icons";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";

type RowKey = string | number;
type Align = "left" | "center" | "right";
type MobileColumnRole = "primary" | "secondary" | "detail" | "hidden";

export type DataTableSortDirection = "asc" | "desc";

export type DataTableSort<SortField extends string = string> = {
  field?: SortField;
  direction: DataTableSortDirection;
  onChange: (field: SortField) => void;
};

export type DataTableColumn<T, SortField extends string = string> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  sortField?: SortField;
  align?: Align;
  className?: string;
  headerClassName?: string;
  mobile?: MobileColumnRole;
  mobileLabel?: ReactNode;
};

export type DataTableRowAction<T> = {
  id: string;
  label: string;
  icon?: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
  onClick: (row: T) => void | Promise<void>;
};

type MobileCardHelpers = {
  actions: ReactNode;
};

type MobileLoadMore = {
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
  loadingLabel?: string;
  endLabel?: string;
};

interface DataTableProps<T, SortField extends string = string> {
  rows: T[];
  columns: Array<DataTableColumn<T, SortField>>;
  getRowId: (row: T) => RowKey;
  loading?: boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  sort?: DataTableSort<SortField>;
  rowActions?: (row: T) => Array<DataTableRowAction<T>>;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string | undefined;
  renderMobileCard?: (row: T, helpers: MobileCardHelpers) => ReactNode;
  mobileLoadMore?: MobileLoadMore;
  footer?: ReactNode;
  minTableWidth?: number;
  className?: string;
}

const alignClass: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const cellAlignClass: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function getSortField<T, SortField extends string>(
  column: DataTableColumn<T, SortField>,
) {
  return column.sortField ?? (column.id as SortField);
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction?: DataTableSortDirection;
}) {
  if (!active) return <ArrowUpDown size={11} className="text-gray-300" />;
  return direction === "asc" ? (
    <ArrowUp size={11} className="text-[var(--color-primary)]" />
  ) : (
    <ArrowDown size={11} className="text-[var(--color-primary)]" />
  );
}

function RowActions<T>({
  row,
  rowKey,
  actions,
  openActionKey,
  setOpenActionKey,
}: {
  row: T;
  rowKey: string;
  actions: Array<DataTableRowAction<T>>;
  openActionKey: string | null;
  setOpenActionKey: (key: string | null) => void;
}) {
  const isOpen = openActionKey === rowKey;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return;
    }

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const margin = 8;
      const gap = 6;
      const menuWidth = menuRef.current?.offsetWidth || 192;
      const menuHeight = menuRef.current?.offsetHeight || Math.min(320, actions.length * 38 + 8);
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      const top =
        spaceBelow >= menuHeight + gap || spaceBelow >= spaceAbove
          ? Math.min(rect.bottom + gap, viewportHeight - menuHeight - margin)
          : Math.max(margin, rect.top - menuHeight - gap);
      const left = Math.min(
        Math.max(margin, rect.right - menuWidth),
        viewportWidth - menuWidth - margin,
      );

      setMenuStyle({
        left,
        top: Math.max(margin, top),
        maxHeight: Math.max(120, viewportHeight - margin * 2),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [actions.length, isOpen]);

  if (actions.length === 0) return null;

  return (
    <div className="relative flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Row actions"
        onClick={(event) => {
          event.stopPropagation();
          setOpenActionKey(isOpen ? null : rowKey);
        }}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 md:h-8 md:w-8 md:bg-transparent md:hover:bg-slate-100"
        style={{ touchAction: "pan-y" }}
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(event) => {
              event.stopPropagation();
              setOpenActionKey(null);
            }}
          />
          <div
            ref={menuRef}
            style={menuStyle ?? { left: -9999, top: -9999 }}
            className="fixed z-[9999] w-48 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
            onClick={(event) => event.stopPropagation()}
          >
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={action.disabled}
                onClick={() => {
                  setOpenActionKey(null);
                  void action.onClick(row);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  action.tone === "danger"
                    ? "text-red-500 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {action.icon ? (
                  <span className="flex h-4 w-4 items-center justify-center">
                    {action.icon}
                  </span>
                ) : null}
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}

function MobileLoadMoreSentinel({
  hasMore,
  loading = false,
  onLoadMore,
  loadingLabel = "Loading more...",
  endLabel,
}: MobileLoadMore) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "180px 0px", threshold: 0.01 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore && !endLabel) {
    return <div ref={sentinelRef} className="h-1" />;
  }

  return (
    <div ref={sentinelRef} className="flex min-h-10 items-center justify-center px-4 py-3">
      {loading ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-primary)]" />
          {loadingLabel}
        </span>
      ) : hasMore ? (
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-400 shadow-sm">
          Scroll for more
        </span>
      ) : endLabel ? (
        <span className="text-xs text-slate-400">{endLabel}</span>
      ) : null}
    </div>
  );
}

export function DataTable<T, SortField extends string = string>({
  rows,
  columns,
  getRowId,
  loading = false,
  loadingLabel = "Loading...",
  emptyTitle = "No records found",
  emptyDescription,
  sort,
  rowActions,
  onRowClick,
  getRowClassName,
  renderMobileCard,
  mobileLoadMore,
  footer,
  minTableWidth = 800,
  className = "",
}: DataTableProps<T, SortField>) {
  const [openActionKey, setOpenActionKey] = useState<string | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false,
  );
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const hasActions = Boolean(rowActions);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileLayout(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const makeActions = (row: T) => {
    const rowKey = String(getRowId(row));
    return (
      <RowActions
        actions={rowActions?.(row) ?? []}
        openActionKey={openActionKey}
        row={row}
        rowKey={rowKey}
        setOpenActionKey={setOpenActionKey}
      />
    );
  };

  const handleKeyOpen = (event: KeyboardEvent<HTMLElement>, row: T) => {
    if (!onRowClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(row);
    }
  };

  const handleMobileWheelCapture = (
    event: ReactWheelEvent<HTMLDivElement>,
  ) => {
    const container = mobileScrollRef.current;
    if (
      !container ||
      event.defaultPrevented ||
      Math.abs(event.deltaY) <= Math.abs(event.deltaX)
    ) {
      return;
    }

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    if (maxScrollTop <= 0) {
      return;
    }

    const previousScrollTop = container.scrollTop;
    const nextScrollTop = Math.min(
      maxScrollTop,
      Math.max(0, previousScrollTop + event.deltaY),
    );

    if (nextScrollTop !== previousScrollTop) {
      container.scrollTop = nextScrollTop;
      event.preventDefault();
    }
  };

  const renderDefaultMobileCard = (row: T, actions: ReactNode) => {
    const visibleColumns = columns.filter((column) => column.mobile !== "hidden");
    const primary =
      visibleColumns.find((column) => column.mobile === "primary") ??
      visibleColumns[0];
    const secondary = visibleColumns.find(
      (column) => column.mobile === "secondary",
    );
    const details = visibleColumns.filter(
      (column) => column.id !== primary?.id && column.id !== secondary?.id,
    );

    return (
      <article
        key={String(getRowId(row))}
        role={onRowClick ? "button" : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onClick={() => onRowClick?.(row)}
        onKeyDown={(event) => handleKeyOpen(event, row)}
        className={`relative min-w-0 max-w-full flex-shrink-0 overflow-visible rounded-[28px] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] transition-colors ${
          onRowClick ? "cursor-pointer hover:bg-slate-50" : ""
        }`}
        style={{ touchAction: "pan-y" }}
      >
        {onRowClick ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-300"
          >
            <ChevronRight size={16} />
          </span>
        ) : null}

        <div className={`${onRowClick ? "pr-7" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {primary ? (
                <div className="min-w-0 text-[17px] font-semibold leading-tight text-slate-900">
                  {primary.cell(row)}
                </div>
              ) : null}
              {secondary ? (
                <div className="mt-1 min-w-0 text-sm font-medium text-slate-500">
                  {secondary.cell(row)}
                </div>
              ) : null}
            </div>
            {actions ? <div className="flex-shrink-0">{actions}</div> : null}
          </div>

          {details.length > 0 ? (
            <div className="mt-4 grid min-w-0 gap-3 rounded-[22px] bg-white p-3 sm:grid-cols-2">
              {details.map((column) => (
                <div key={column.id} className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {column.mobileLabel ?? column.header}
                  </p>
                  <div className="mt-1 min-w-0 text-sm font-medium text-slate-700">
                    {column.cell(row)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--color-primary)]" />
          {loadingLabel}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-sm text-gray-400">
          <Search size={28} className="text-gray-300" />
          <span className="mt-2 font-medium text-gray-500">{emptyTitle}</span>
          {emptyDescription ? (
            <span className="mt-1 text-xs text-gray-400">{emptyDescription}</span>
          ) : null}
        </div>
      ) : (
        <>
          {!isMobileLayout ? (
            <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
              <table className="w-full" style={{ minWidth: minTableWidth }}>
                <thead className="sticky top-0 z-10 border-b border-gray-100 bg-white">
                  <tr>
                    {columns.map((column) => {
                      const align = column.align ?? "left";
                      const sortField = getSortField(column);
                      const active = sort?.field === sortField;
                      return (
                        <th
                          key={column.id}
                          className={`whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 ${alignClass[align]} ${column.headerClassName ?? ""}`}
                        >
                          {column.sortable && sort ? (
                            <button
                              type="button"
                              onClick={() => sort.onChange(sortField)}
                              className="inline-flex items-center gap-1 transition-colors hover:text-gray-700"
                            >
                              {column.header}
                              <SortIcon active={active} direction={sort.direction} />
                            </button>
                          ) : (
                            column.header
                          )}
                        </th>
                      );
                    })}
                    {hasActions ? (
                      <th className="w-12 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        Actions
                      </th>
                    ) : null}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {rows.map((row) => {
                    const rowKey = String(getRowId(row));
                    return (
                      <tr
                        key={rowKey}
                        onClick={() => onRowClick?.(row)}
                        className={`transition-colors ${
                          onRowClick ? "cursor-pointer hover:bg-gray-50" : "hover:bg-gray-50/70"
                        } ${getRowClassName?.(row) ?? ""}`}
                      >
                        {columns.map((column) => {
                          const align = column.align ?? "left";
                          return (
                            <td
                              key={column.id}
                              className={`px-3 py-3 text-sm text-gray-700 ${cellAlignClass[align]} ${column.className ?? ""}`}
                            >
                              {column.cell(row)}
                            </td>
                          );
                        })}
                        {hasActions ? (
                          <td className="px-3 py-3 text-right">
                            {makeActions(row)}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              ref={mobileScrollRef}
              onWheelCapture={handleMobileWheelCapture}
              className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden  p-3 pb-24"
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
            >
              {rows.map((row) => {
                const actions = makeActions(row);
                return (
                  <div
                    key={String(getRowId(row))}
                    className="min-w-0 flex-shrink-0"
                    style={{ touchAction: "pan-y" }}
                  >
                    {renderMobileCard
                      ? renderMobileCard(row, { actions })
                      : renderDefaultMobileCard(row, actions)}
                  </div>
                );
              })}
              {mobileLoadMore?.loading ? (
                <div className="sticky bottom-4 z-10 flex justify-center px-2">
                  <span
                    aria-live="polite"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-lg"
                  >
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-primary)]" />
                    {mobileLoadMore.loadingLabel ?? "Loading more..."}
                  </span>
                </div>
              ) : null}
              {mobileLoadMore ? <MobileLoadMoreSentinel {...mobileLoadMore} /> : null}
            </div>
          )}
        </>
      )}

      {footer ? <div className="hidden flex-shrink-0 md:block">{footer}</div> : null}
    </div>
  );
}
