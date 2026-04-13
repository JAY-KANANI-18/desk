import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { broadcastApi, type BroadcastRunRow } from "../../lib/broadcastApi";
import { BROADCAST_PAGE_SIZE } from "./constants";
import type { BroadcastSortableField, BroadcastViewMode } from "./types";
import { addMonths, formatDateKey, startOfMonth, statusFilterToApiStatus } from "./utils";

export function useBroadcastRuns() {
  const [runs, setRuns] = useState<BroadcastRunRow[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<BroadcastViewMode>("table");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<BroadcastSortableField>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [nextCursor, setNextCursor] = useState<string>();
  const [hasMoreRuns, setHasMoreRuns] = useState(false);
  const [runsLoadingMore, setRunsLoadingMore] = useState(false);
  const [runsTotal, setRunsTotal] = useState(0);

  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();
  const runStatus = useMemo(() => statusFilterToApiStatus(selectedStatus), [selectedStatus]);

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery]);

  const loadRuns = useCallback(async (replace = true, cursor?: string) => {
    if (replace) setRunsLoading(true);
    else setRunsLoadingMore(true);

    try {
      const result = await broadcastApi.list({
        take: BROADCAST_PAGE_SIZE,
        cursor,
        search: debouncedSearchQuery || undefined,
        status: runStatus,
        sortBy,
        sortOrder: sortBy ? sortOrder : undefined,
      });
      const rows = Array.isArray(result?.data) ? result.data : [];
      setRuns((prev) => {
        if (replace) return rows;
        const seen = new Set(prev.map((row) => row.id));
        return [...prev, ...rows.filter((row) => !seen.has(row.id))];
      });
      setNextCursor(result?.nextCursor);
      setHasMoreRuns(Boolean(result?.nextCursor));
      setRunsTotal(typeof result?.total === "number" ? result.total : rows.length);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to load broadcasts");
      if (replace) {
        setRuns([]);
        setRunsTotal(0);
      }
      setNextCursor(undefined);
      setHasMoreRuns(false);
    } finally {
      if (replace) setRunsLoading(false);
      else setRunsLoadingMore(false);
    }
  }, [debouncedSearchQuery, runStatus, sortBy, sortOrder]);

  useEffect(() => {
    void loadRuns(true);
  }, [loadRuns]);

  const calendarDays = useMemo(() => {
    const first = startOfMonth(calendarMonth);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      return day;
    });
  }, [calendarMonth]);

  const calendarEventsByDate = useMemo(
    () =>
      runs.filter((run) => run.scheduledAt).reduce<Record<string, BroadcastRunRow[]>>((acc, run) => {
        const key = formatDateKey(new Date(run.scheduledAt as string));
        acc[key] = [...(acc[key] ?? []), run].sort(
          (a, b) =>
            new Date(a.scheduledAt ?? a.createdAt).getTime() -
            new Date(b.scheduledAt ?? b.createdAt).getTime(),
        );
        return acc;
      }, {}),
    [runs],
  );

  const monthLabel = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayKey = formatDateKey(new Date());
  const activeRunLabel = debouncedSearchQuery
    ? `${runsTotal} result${runsTotal === 1 ? "" : "s"}`
    : `${runs.length} loaded${runsTotal > runs.length ? ` of ${runsTotal}` : ""}`;

  const toggleSort = useCallback((field: BroadcastSortableField) => {
    const nextOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(nextOrder);
  }, [sortBy, sortOrder]);

  return {
    runs,
    runsLoading,
    viewMode,
    selectedStatus,
    searchQuery,
    debouncedSearchQuery,
    sortBy,
    sortOrder,
    calendarMonth,
    nextCursor,
    hasMoreRuns,
    runsLoadingMore,
    activeRunLabel,
    calendarDays,
    calendarEventsByDate,
    monthLabel,
    todayKey,
    setViewMode,
    setSelectedStatus,
    setSearchQuery,
    loadRuns,
    loadMoreRuns: (cursor?: string) => void loadRuns(false, cursor),
    toggleSort,
    goToToday: () => setCalendarMonth(startOfMonth(new Date())),
    goToPreviousMonth: () => setCalendarMonth((month) => addMonths(month, -1)),
    goToNextMonth: () => setCalendarMonth((month) => addMonths(month, 1)),
  };
}
