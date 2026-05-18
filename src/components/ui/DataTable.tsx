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
import { ActionMenu, type ActionMenuEntry } from "./menu";

type RowKey = string | number;
type Align = "left" | "center" | "right";
type MobileColumnRole = "primary" | "secondary" | "detail" | "hidden";
type DataTableDensity = "default" | "compact";
type DataTableLayout = "auto" | "fixed";

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
  width?: number | string;
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
  density?: DataTableDensity;
  tableLayout?: DataTableLayout;
  stickyLeadingShadowOffset?: number;
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
  if (!active) return <ArrowUpDown size={13} className="text-[var(--color-gray-400)]" />;
  return direction === "asc" ? (
    <ArrowUp size={13} className="text-[var(--color-primary)]" />
  ) : (
    <ArrowDown size={13} className="text-[var(--color-primary)]" />
  );
}

function getAriaSort(active: boolean, direction: DataTableSortDirection | undefined) {
  if (!active) return "none";
  return direction === "desc" ? "descending" : "ascending";
}

function getColumnWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width === undefined) return undefined;

  return {
    width: typeof width === "number" ? `${width}px` : width,
  };
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
  const menuItems: ActionMenuEntry[] = actions.map((action) => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    tone: action.tone,
    disabled: action.disabled,
    onSelect: () => action.onClick(row),
  }));

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

      <ActionMenu
        isOpen={isOpen}
        onClose={() => setOpenActionKey(null)}
        anchorRef={buttonRef}
        items={menuItems}
        width="sm"
        align="end"
        ariaLabel="Row actions"
      />
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
  density = "default",
  tableLayout = "auto",
  stickyLeadingShadowOffset,
  className = "",
}: DataTableProps<T, SortField>) {
  const [openActionKey, setOpenActionKey] = useState<string | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false,
  );
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [isHorizontallyScrolled, setIsHorizontallyScrolled] = useState(false);
  const hasActions = Boolean(rowActions);
  const cellPaddingClass = density === "compact" ? "px-3 py-2" : "px-3 py-3";
  const headerCellClass =
    "whitespace-nowrap px-3 py-3 text-sm font-semibold text-[var(--color-gray-600)]";
  const tableLayoutClass = tableLayout === "fixed" ? "table-fixed" : "";

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileLayout(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    if (isMobileLayout) {
      setIsHorizontallyScrolled(false);
      return;
    }

    const nextIsScrolled = (desktopScrollRef.current?.scrollLeft ?? 0) > 0;
    setIsHorizontallyScrolled((current) =>
      current === nextIsScrolled ? current : nextIsScrolled,
    );
  }, [columns.length, isMobileLayout, minTableWidth, rows.length]);

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
    }
  };

  const handleDesktopScroll = () => {
    const nextIsScrolled = (desktopScrollRef.current?.scrollLeft ?? 0) > 0;
    setIsHorizontallyScrolled((current) =>
      current === nextIsScrolled ? current : nextIsScrolled,
    );
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
            <div className="relative min-h-0 min-w-0 flex-1">
              <div
                ref={desktopScrollRef}
                onScroll={handleDesktopScroll}
                className={`data-table-scroll-frame h-full min-h-0 min-w-0 overflow-auto ${
                  isHorizontallyScrolled ? "data-table-scrolled-x" : ""
                }`}
              >
                <table className={`w-full ${tableLayoutClass}`} style={{ minWidth: minTableWidth }}>
                  <colgroup>
                    {columns.map((column) => (
                      <col key={column.id} style={getColumnWidthStyle(column.width)} />
                    ))}
                    {hasActions ? <col style={{ width: "48px" }} /> : null}
                  </colgroup>
                  <thead className="sticky top-0 z-50 border-b border-[var(--color-gray-200)] bg-[var(--color-gray-50)]">
                    <tr>
                      {columns.map((column) => {
                        const align = column.align ?? "left";
                        const sortField = getSortField(column);
                        const active = sort?.field === sortField;
                        return (
                          <th
                            key={column.id}
                            aria-sort={
                              column.sortable && sort
                                ? getAriaSort(active, sort.direction)
                                : undefined
                            }
                            className={`${headerCellClass} ${alignClass[align]} ${column.headerClassName ?? ""}`}
                          >
                            {column.sortable && sort ? (
                              <button
                                type="button"
                                onClick={() => sort.onChange(sortField)}
                                className="inline-flex items-center gap-1.5 rounded-md text-inherit transition-colors hover:text-[var(--color-gray-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]"
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
                        <th className={`${headerCellClass} w-12 text-right`}>
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
                          className={`group transition-colors ${
                            onRowClick ? "cursor-pointer hover:bg-gray-50" : "hover:bg-gray-50/70"
                          } ${getRowClassName?.(row) ?? ""}`}
                        >
                          {columns.map((column) => {
                            const align = column.align ?? "left";
                            return (
                              <td
                                key={column.id}
                                className={`${cellPaddingClass} text-sm text-gray-700 ${cellAlignClass[align]} ${column.className ?? ""}`}
                              >
                                {column.cell(row)}
                              </td>
                            );
                          })}
                          {hasActions ? (
                            <td className={`${cellPaddingClass} text-right`}>
                              {makeActions(row)}
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {isHorizontallyScrolled && stickyLeadingShadowOffset !== undefined ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 z-40 w-3 bg-gradient-to-r from-[rgba(15,23,42,0.10)] via-[rgba(15,23,42,0.03)] to-transparent"
                  style={{ left: stickyLeadingShadowOffset }}
                />
              ) : null}
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
