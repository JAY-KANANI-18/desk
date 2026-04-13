import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  broadcastApi,
  type BroadcastAnalytics,
  type BroadcastRunRow,
  type BroadcastTrace,
} from "../../lib/broadcastApi";
import type { BroadcastDraftState } from "./types";
import { canMutateBroadcast, toDateTimeLocal } from "./utils";

const INITIAL_DRAFT: BroadcastDraftState = { name: "", scheduledAt: "" };

export function useBroadcastDetails({
  reloadRuns,
}: {
  reloadRuns: () => Promise<void>;
}) {
  const [selectedRun, setSelectedRun] = useState<BroadcastRunRow | null>(null);
  const [analytics, setAnalytics] = useState<BroadcastAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [trace, setTrace] = useState<BroadcastTrace | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [broadcastAction, setBroadcastAction] = useState<"edit" | "reschedule" | null>(null);
  const [broadcastActionSaving, setBroadcastActionSaving] = useState(false);
  const [broadcastDraft, setBroadcastDraft] = useState<BroadcastDraftState>(INITIAL_DRAFT);

  const openDetail = useCallback(async (run: BroadcastRunRow) => {
    setSelectedRun(run);
    setAnalytics(null);
    setTrace(null);
    setBroadcastAction(null);
    setBroadcastDraft({ name: run.name, scheduledAt: toDateTimeLocal(run.scheduledAt) });
    setAnalyticsLoading(true);
    setTraceLoading(true);

    try {
      const [analyticsResponse, traceResponse] = await Promise.all([
        broadcastApi.analytics(run.id),
        broadcastApi.trace(run.id),
      ]);
      setAnalytics(analyticsResponse);
      setTrace(traceResponse);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load broadcast details");
    } finally {
      setAnalyticsLoading(false);
      setTraceLoading(false);
    }
  }, []);

  const refreshSelectedBroadcast = useCallback(async (id: string) => {
    const [full, analyticsResponse, traceResponse] = await Promise.all([
      broadcastApi.get(id),
      broadcastApi.analytics(id),
      broadcastApi.trace(id),
    ]);
    setSelectedRun(full);
    setBroadcastDraft({ name: full.name, scheduledAt: toDateTimeLocal(full.scheduledAt) });
    setAnalytics(analyticsResponse);
    setTrace(traceResponse);
    await reloadRuns();
    return full;
  }, [reloadRuns]);

  const openBroadcastAction = useCallback((action: "edit" | "reschedule") => {
    if (!selectedRun) return;
    if (!canMutateBroadcast(selectedRun.status)) {
      toast.error("This broadcast is already running or completed, so it is locked.");
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
      toast.error("Choose a schedule time");
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
      toast.success(broadcastAction === "edit" ? "Broadcast updated" : "Broadcast rescheduled");
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
    if (!window.confirm("Send this scheduled broadcast now? This cannot be edited after it starts.")) {
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
  }, [refreshSelectedBroadcast, selectedRun]);

  const refreshAnalytics = useCallback(async () => {
    if (!selectedRun?.id) return;
    setAnalyticsLoading(true);
    try {
      setAnalytics(await broadcastApi.analytics(selectedRun.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [selectedRun?.id]);

  const refreshTrace = useCallback(async () => {
    if (!selectedRun?.id) return;
    setTraceLoading(true);
    try {
      setTrace(await broadcastApi.trace(selectedRun.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Trace refresh failed");
    } finally {
      setTraceLoading(false);
    }
  }, [selectedRun?.id]);

  return {
    selectedRun,
    analytics,
    analyticsLoading,
    trace,
    traceLoading,
    broadcastAction,
    broadcastActionSaving,
    broadcastDraft,
    setBroadcastDraft,
    setBroadcastAction,
    openDetail,
    openBroadcastAction,
    saveBroadcastAction,
    sendSelectedBroadcastNow,
    refreshAnalytics,
    refreshTrace,
    closeDetails: () => setSelectedRun(null),
  };
}
