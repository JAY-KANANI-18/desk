import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  broadcastApi,
  type BroadcastAnalytics,
  type BroadcastRunRow,
  type BroadcastTrace,
  type BroadcastTraceFilter,
} from "../../lib/broadcastApi";
import type { BroadcastDraftState } from "./types";
import { canMutateBroadcast, toDateTimeLocal } from "./utils";

const INITIAL_DRAFT: BroadcastDraftState = { name: "", scheduledAt: "" };
const TRACE_PAGE_SIZE = 20;

export function useBroadcastDetails({
  reloadRuns,
}: {
  reloadRuns: () => Promise<void>;
}) {
  const [selectedRun, setSelectedRun] = useState<BroadcastRunRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<BroadcastAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [trace, setTrace] = useState<BroadcastTrace | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceFilter, setTraceFilter] = useState<BroadcastTraceFilter>("all");
  const [tracePage, setTracePage] = useState(1);
  const [broadcastAction, setBroadcastAction] = useState<"edit" | "reschedule" | null>(null);
  const [broadcastActionSaving, setBroadcastActionSaving] = useState(false);
  const [broadcastDraft, setBroadcastDraft] = useState<BroadcastDraftState>(INITIAL_DRAFT);

  const loadTrace = useCallback(
    async (
      runId: string,
      params: { filter?: BroadcastTraceFilter; page?: number } = {},
    ) => {
      const nextFilter = params.filter ?? traceFilter;
      const nextPage = params.page ?? tracePage;
      if (nextFilter !== traceFilter || nextPage !== tracePage) {
        setTrace(null);
      }
      setTraceFilter(nextFilter);
      setTracePage(nextPage);
      setTraceLoading(true);
      try {
        const response = await broadcastApi.trace(runId, {
          status: nextFilter,
          page: nextPage,
          take: TRACE_PAGE_SIZE,
        });
        setTrace(response);
        return response;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not refresh people");
        return null;
      } finally {
        setTraceLoading(false);
      }
    },
    [traceFilter, tracePage],
  );

  const openDetail = useCallback(async (run: BroadcastRunRow) => {
    setSelectedRun(run);
    setAnalytics(null);
    setTrace(null);
    setBroadcastAction(null);
    setTraceFilter("all");
    setTracePage(1);
    setBroadcastDraft({ name: run.name, scheduledAt: toDateTimeLocal(run.scheduledAt) });
    setAnalyticsLoading(true);
    setTraceLoading(true);

    try {
      const [analyticsResponse, traceResponse] = await Promise.all([
        broadcastApi.analytics(run.id),
        broadcastApi.trace(run.id, { status: "all", page: 1, take: TRACE_PAGE_SIZE }),
      ]);
      setAnalytics(analyticsResponse);
      setTrace(traceResponse);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load broadcast details");
    } finally {
      setAnalyticsLoading(false);
      setTraceLoading(false);
    }
  }, []);

  const openDetailById = useCallback(async (id: string) => {
    setSelectedRun(null);
    setAnalytics(null);
    setTrace(null);
    setBroadcastAction(null);
    setTraceFilter("all");
    setTracePage(1);
    setDetailsLoading(true);
    setAnalyticsLoading(true);
    setTraceLoading(true);

    try {
      const [full, analyticsResponse, traceResponse] = await Promise.all([
        broadcastApi.get(id),
        broadcastApi.analytics(id),
        broadcastApi.trace(id, { status: "all", page: 1, take: TRACE_PAGE_SIZE }),
      ]);
      setSelectedRun(full);
      setBroadcastDraft({ name: full.name, scheduledAt: toDateTimeLocal(full.scheduledAt) });
      setAnalytics(analyticsResponse);
      setTrace(traceResponse);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load broadcast details");
    } finally {
      setDetailsLoading(false);
      setAnalyticsLoading(false);
      setTraceLoading(false);
    }
  }, []);

  const refreshSelectedBroadcast = useCallback(async (id: string) => {
    const [full, analyticsResponse, traceResponse] = await Promise.all([
      broadcastApi.get(id),
      broadcastApi.analytics(id),
      broadcastApi.trace(id, { status: traceFilter, page: tracePage, take: TRACE_PAGE_SIZE }),
    ]);
    setSelectedRun(full);
    setBroadcastDraft({ name: full.name, scheduledAt: toDateTimeLocal(full.scheduledAt) });
    setAnalytics(analyticsResponse);
    setTrace(traceResponse);
    await reloadRuns();
    return full;
  }, [reloadRuns, traceFilter, tracePage]);

  const openBroadcastAction = useCallback((action: "edit" | "reschedule") => {
    if (!selectedRun) return;
    if (!canMutateBroadcast(selectedRun.status)) {
      toast.error("This broadcast is already sending or finished.");
      return;
    }
    setBroadcastDraft({ name: selectedRun.name, scheduledAt: toDateTimeLocal(selectedRun.scheduledAt) });
    setBroadcastAction(action);
  }, [selectedRun]);

  const saveBroadcastAction = useCallback(async () => {
    if (!selectedRun || !broadcastAction) return;
    if (!canMutateBroadcast(selectedRun.status)) {
      toast.error("Only scheduled broadcasts can be changed.");
      return;
    }
    if (broadcastAction === "edit" && !broadcastDraft.name.trim()) {
      toast.error("Broadcast name cannot be empty");
      return;
    }
    if (!broadcastDraft.scheduledAt) {
      toast.error("Choose when to send");
      return;
    }
    if (new Date(broadcastDraft.scheduledAt).getTime() <= Date.now() + 30_000) {
      toast.error("Choose a time at least 1 minute from now");
      return;
    }

    setBroadcastActionSaving(true);
    try {
      const updated = await broadcastApi.update(selectedRun.id, {
        name: broadcastAction === "edit" ? broadcastDraft.name.trim() : undefined,
        scheduledAt: new Date(broadcastDraft.scheduledAt).toISOString(),
      });
      setSelectedRun(updated);
      await refreshSelectedBroadcast(updated.id);
      setBroadcastAction(null);
      toast.success(broadcastAction === "edit" ? "Broadcast updated" : "Schedule time changed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update broadcast");
    } finally {
      setBroadcastActionSaving(false);
    }
  }, [broadcastAction, broadcastDraft, refreshSelectedBroadcast, selectedRun]);

  const sendSelectedBroadcastNow = useCallback(async () => {
    if (!selectedRun) return;
    if (!canMutateBroadcast(selectedRun.status)) {
      toast.error("Only scheduled broadcasts can be sent now.");
      return;
    }
    if (broadcastAction) {
      toast.error("Save or cancel the current change before sending now.");
      return;
    }
    if (!window.confirm("Send this scheduled broadcast now? You cannot edit it after it starts.")) {
      return;
    }

    setBroadcastActionSaving(true);
    try {
      const updated = await broadcastApi.sendNow(selectedRun.id);
      setSelectedRun(updated);
      await refreshSelectedBroadcast(updated.id);
      setBroadcastAction(null);
      toast.success("Broadcast started");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send broadcast now");
    } finally {
      setBroadcastActionSaving(false);
    }
  }, [broadcastAction, refreshSelectedBroadcast, selectedRun]);

  const refreshAnalytics = useCallback(async () => {
    if (!selectedRun?.id) return;
    setAnalyticsLoading(true);
    try {
      setAnalytics(await broadcastApi.analytics(selectedRun.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not refresh delivery summary");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [selectedRun?.id]);

  const refreshTrace = useCallback(async () => {
    if (!selectedRun?.id) return;
    await loadTrace(selectedRun.id);
  }, [loadTrace, selectedRun?.id]);

  const changeTraceFilter = useCallback(
    async (filter: BroadcastTraceFilter) => {
      if (!selectedRun?.id) {
        setTraceFilter(filter);
        setTracePage(1);
        return;
      }
      await loadTrace(selectedRun.id, { filter, page: 1 });
    },
    [loadTrace, selectedRun?.id],
  );

  const changeTracePage = useCallback(
    async (page: number) => {
      const nextPage = Math.max(1, page);
      if (!selectedRun?.id) {
        setTracePage(nextPage);
        return;
      }
      await loadTrace(selectedRun.id, { page: nextPage });
    },
    [loadTrace, selectedRun?.id],
  );

  const closeDetails = useCallback(() => {
    setSelectedRun(null);
    setAnalytics(null);
    setTrace(null);
    setBroadcastAction(null);
    setTraceFilter("all");
    setTracePage(1);
  }, []);

  return {
    selectedRun,
    detailsLoading,
    analytics,
    analyticsLoading,
    trace,
    traceLoading,
    traceFilter,
    tracePage,
    traceLimit: TRACE_PAGE_SIZE,
    broadcastAction,
    broadcastActionSaving,
    broadcastDraft,
    setBroadcastDraft,
    setBroadcastAction,
    openDetail,
    openDetailById,
    openBroadcastAction,
    saveBroadcastAction,
    sendSelectedBroadcastNow,
    refreshAnalytics,
    refreshTrace,
    changeTraceFilter,
    changeTracePage,
    closeDetails,
  };
}
