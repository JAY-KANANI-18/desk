import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Loader2,
  Users,
  Radio,
  BarChart3,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useChannel } from "../context/ChannelContext";
import { workspaceApi } from "../lib/workspaceApi";
import {
  broadcastApi,
  type BroadcastAnalytics,
  type BroadcastRunStatus,
  type BroadcastRunRow,
  type BroadcastSendResult,
  type BroadcastTrace,
} from "../lib/broadcastApi";

type TagRow = { id: string; name: string };
type LifecycleRow = { id: string; name: string; type?: string; emoji?: string | null };

function BroadcastTagPicker({
  tags,
  value,
  onChange,
}: {
  tags: TagRow[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(q));
  }, [search, tags]);

  const selectedTags = useMemo(
    () => tags.filter((tag) => value.includes(tag.id)),
    [tags, value],
  );

  const toggleTag = (tagId: string) => {
    onChange(value.includes(tagId) ? value.filter((id) => id !== tagId) : [...value, tagId]);
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:border-gray-400"
      >
        <div className="flex flex-1 flex-wrap gap-1.5">
          {selectedTags.length === 0 ? (
            <span className="text-gray-400">Select tags</span>
          ) : (
            selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              >
                {tag.name}
              </span>
            ))
          )}
        </div>
        <ChevronRight
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-3 py-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags"
              className="w-full border-none p-0 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filteredTags.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">No tags found</div>
            ) : (
              filteredTags.map((tag) => {
                const selected = value.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                      selected ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{tag.name}</span>
                    {selected ? <span className="text-xs font-medium">Selected</span> : null}
                  </button>
                );
              })
            )}
          </div>
          {value.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function templateVariableKeys(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === "string");
  }
  if (typeof raw === "object" && raw !== null && "length" in raw) {
    try {
      return Array.from(raw as string[]).filter((v) => typeof v === "string");
    } catch {
      return [];
    }
  }
  return [];
}

function statusLabel(status: string) {
  if (status === "partial_failure") return "Partial failure";
  if (status === "completed") return "Completed";
  if (status === "scheduled") return "Scheduled";
  if (status === "running") return "Running";
  return status;
}

function statusBadgeClass(status: string) {
  if (status === "partial_failure") return "bg-amber-100 text-amber-800";
  if (status === "completed") return "bg-emerald-100 text-emerald-800";
  if (status === "scheduled") return "bg-indigo-100 text-indigo-800";
  if (status === "running") return "bg-indigo-100 text-indigo-800";
  return "bg-gray-100 text-gray-700";
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function calendarEventClass(status: string) {
  if (status === "completed" || status === "sent") {
    return "border-l-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100";
  }
  if (status === "partial_failure" || status === "failed") {
    return "border-l-red-500 bg-red-50 text-red-900 hover:bg-red-100";
  }
  if (status === "scheduled") {
    return "border-l-indigo-500 bg-indigo-50 text-indigo-900 hover:bg-indigo-100";
  }
  return "border-l-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100";
}

function calendarStatusLabel(status: string) {
  if (status === "completed") return "Sent";
  if (status === "partial_failure") return "Failed";
  return statusLabel(status);
}

function canMutateBroadcast(status?: string) {
  return status === "scheduled";
}

const BROADCAST_PAGE_SIZE = 25;

function statusFilterToApiStatus(value: string): BroadcastRunStatus | undefined {
  if (value === "Scheduled") return "scheduled";
  if (value === "Running") return "running";
  if (value === "Completed") return "completed";
  if (value === "Partial failure") return "partial_failure";
  return undefined;
}

export const Broadcast = () => {
  const { channels, loading: channelsLoading, refreshChannels } = useChannel();

  const [runs, setRuns] = useState<BroadcastRunRow[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<BroadcastRunRow | null>(null);
  const [analytics, setAnalytics] = useState<BroadcastAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [trace, setTrace] = useState<BroadcastTrace | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [broadcastAction, setBroadcastAction] = useState<"edit" | "reschedule" | null>(null);
  const [broadcastActionSaving, setBroadcastActionSaving] = useState(false);
  const [broadcastDraft, setBroadcastDraft] = useState({ name: "", scheduledAt: "" });

  const [tags, setTags] = useState<TagRow[]>([]);
  const [lifecycles, setLifecycles] = useState<LifecycleRow[]>([]);

  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "scheduledAt" | "status" | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [nextCursor, setNextCursor] = useState<string>();
  const [hasMoreRuns, setHasMoreRuns] = useState(false);
  const [runsLoadingMore, setRunsLoadingMore] = useState(false);
  const [runsTotal, setRunsTotal] = useState(0);

  const [showComposer, setShowComposer] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [lastSendResult, setLastSendResult] = useState<BroadcastSendResult | null>(null);

  const [form, setForm] = useState({
    name: "",
    channelId: "",
    text: "",
    tagIds: [] as string[],
    lifecycleId: "",
    respectMarketingOptOut: true,
    limit: 200,
    scheduleMode: "now" as "now" | "later",
    scheduledAt: "",
  });

  const [audiencePreview, setAudiencePreview] = useState<{
    totalMatching: number;
    sample: Array<{ name: string; identifier: string }>;
  } | null>(null);

  const [waTemplates, setWaTemplates] = useState<
    Array<{
      id: string;
      name: string;
      language: string;
      category: string;
      variables: unknown;
    }>
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
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
    if (replace) {
      setRunsLoading(true);
    } else {
      setRunsLoadingMore(true);
    }
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
      setHasMoreRuns(!!result?.nextCursor);
      setRunsTotal(typeof result?.total === "number" ? result.total : rows.length);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to load broadcasts");
      if (replace) {
        setRuns([]);
        setRunsTotal(0);
      }
      setNextCursor(undefined);
      setHasMoreRuns(false);
    } finally {
      if (replace) {
        setRunsLoading(false);
      } else {
        setRunsLoadingMore(false);
      }
    }
  }, [debouncedSearchQuery, runStatus, sortBy, sortOrder]);

  const loadMeta = useCallback(async () => {
    try {
      const [t, l] = await Promise.all([
        workspaceApi.getTags(),
        workspaceApi.getLifecycleStages(),
      ]);
      const tagList = Array.isArray(t) ? t : (t as { data?: TagRow[] })?.data ?? [];
      const rawLifecycleList = Array.isArray(l) ? l : (l as { data?: LifecycleRow[] })?.data ?? [];
      const lifeList = rawLifecycleList.filter((stage) => !stage.type || stage.type === "lifecycle");
      setTags(tagList);
      setLifecycles(lifeList);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    void loadRuns(true);
  }, [loadRuns]);

  const selectedChannel = useMemo(
    () => channels.find((c) => String(c.id) === form.channelId),
    [channels, form.channelId],
  );

  const isWhatsApp = selectedChannel?.type === "whatsapp";

  useEffect(() => {
    setAudiencePreview(null);
    setSelectedTemplateId("");
    setTemplateVars({});
    setWaTemplates([]);
    if (!form.channelId || !isWhatsApp) return;
    (async () => {
      try {
        const list = await broadcastApi.whatsappTemplates(form.channelId);
        setWaTemplates(Array.isArray(list) ? list : []);
      } catch {
        setWaTemplates([]);
      }
    })();
  }, [form.channelId, isWhatsApp]);

  useEffect(() => {
    setAudiencePreview(null);
  }, [form.channelId, form.lifecycleId, form.respectMarketingOptOut, form.tagIds]);

  const selectedTemplate = useMemo(
    () => waTemplates.find((t) => t.id === selectedTemplateId),
    [waTemplates, selectedTemplateId],
  );

  useEffect(() => {
    if (!selectedTemplateId) {
      setTemplateVars({});
      return;
    }
    const t = waTemplates.find((x) => x.id === selectedTemplateId);
    if (!t) {
      setTemplateVars({});
      return;
    }
    const keys = templateVariableKeys(t.variables);
    setTemplateVars((prev) => {
      const next: Record<string, string> = {};
      keys.forEach((k) => {
        next[k] = prev[k] ?? "";
      });
      return next;
    });
  }, [selectedTemplateId, waTemplates]);

  const runAudiencePreview = async () => {
    if (!form.channelId) {
      toast.error("Select a channel");
      return;
    }
    setPreviewLoading(true);
    try {
      const r = await broadcastApi.audiencePreview({
        channelId: form.channelId,
        tagIds: form.tagIds.length ? form.tagIds : undefined,
        lifecycleId: form.lifecycleId || undefined,
        respectMarketingOptOut: form.respectMarketingOptOut,
        limit: 200,
      });
      setAudiencePreview({
        totalMatching: r.totalMatching,
        sample: r.sample ?? [],
      });
      toast.success(`Audience: ${r.totalMatching} contact(s) on this channel`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const openDetail = async (run: BroadcastRunRow) => {
    setSelectedRun(run);
    setAnalytics(null);
    setTrace(null);
    setBroadcastAction(null);
    setBroadcastDraft({
      name: run.name,
      scheduledAt: toDateTimeLocal(run.scheduledAt),
    });
    setAnalyticsLoading(true);
    setTraceLoading(true);
    try {
      const [a, t] = await Promise.all([broadcastApi.analytics(run.id), broadcastApi.trace(run.id)]);
      setAnalytics(a);
      setTrace(t);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load broadcast details");
    } finally {
      setAnalyticsLoading(false);
      setTraceLoading(false);
    }
  };

  const handleSend = async () => {
    if (!form.name.trim()) {
      toast.error("Name this broadcast");
      return;
    }
    if (!form.channelId) {
      toast.error("Select a channel");
      return;
    }
    if (isWhatsApp) {
      if (!selectedTemplate) {
        toast.error("Choose an approved WhatsApp template");
        return;
      }
      const keys = templateVariableKeys(selectedTemplate.variables);
      for (const k of keys) {
        if (!(templateVars[k] ?? "").trim()) {
          toast.error(`Fill template variable {{${k}}}`);
          return;
        }
      }
    } else {
      if (!form.text.trim()) {
        toast.error("Enter message text");
        return;
      }
    }
    if (form.scheduleMode === "later") {
      if (!form.scheduledAt) {
        toast.error("Choose a schedule time");
        return;
      }
      if (new Date(form.scheduledAt).getTime() <= Date.now() + 30_000) {
        toast.error("Choose a time at least 1 minute from now");
        return;
      }
    }

    setSending(true);
    setLastSendResult(null);
    try {
      const result = await broadcastApi.send({
        name: form.name.trim(),
        channelId: form.channelId,
        text: isWhatsApp ? undefined : form.text.trim(),
        template: isWhatsApp && selectedTemplate
          ? {
              name: selectedTemplate.name,
              language: selectedTemplate.language,
              variables: templateVars,
            }
          : undefined,
        tagIds: form.tagIds.length ? form.tagIds : undefined,
        lifecycleId: form.lifecycleId || undefined,
        respectMarketingOptOut: form.respectMarketingOptOut,
        limit: Math.min(500, Math.max(1, form.limit)),
        scheduledAt:
          form.scheduleMode === "later" && form.scheduledAt
            ? new Date(form.scheduledAt).toISOString()
            : undefined,
      });
      setLastSendResult(result);
      toast.success(
        result.status === "scheduled"
          ? `Scheduled ${result.totalAudience} recipient(s) for ${formatDateTime(result.scheduledAt)}`
          : `Queued ${result.queued} message(s)${
              result.failed ? `, ${result.failed} failed to enqueue` : ""
            }`,
      );
      if (result.whatsAppComplianceNote) {
        toast(result.whatsAppComplianceNote, { icon: "ℹ️" });
      }
      setShowComposer(false);
      setForm({
        name: "",
        channelId: "",
        text: "",
        tagIds: [],
        lifecycleId: "",
        respectMarketingOptOut: true,
        limit: 200,
        scheduleMode: "now",
        scheduledAt: "",
      });
      setAudiencePreview(null);
      await loadRuns(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const refreshSelectedBroadcast = async (id: string) => {
    const [full, a, t] = await Promise.all([
      broadcastApi.get(id),
      broadcastApi.analytics(id),
      broadcastApi.trace(id),
    ]);
    setSelectedRun(full);
    setBroadcastDraft({
      name: full.name,
      scheduledAt: toDateTimeLocal(full.scheduledAt),
    });
    setAnalytics(a);
    setTrace(t);
    await loadRuns(true);
    return full;
  };

  const openBroadcastAction = (action: "edit" | "reschedule") => {
    if (!selectedRun) return;
    if (!canMutateBroadcast(selectedRun.status)) {
      toast.error("This broadcast is already running or completed, so it is locked.");
      return;
    }
    setBroadcastDraft({
      name: selectedRun.name,
      scheduledAt: toDateTimeLocal(selectedRun.scheduledAt),
    });
    setBroadcastAction(action);
  };

  const saveBroadcastAction = async () => {
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update broadcast");
    } finally {
      setBroadcastActionSaving(false);
    }
  };

  const sendSelectedBroadcastNow = async () => {
    if (!selectedRun) return;
    if (!canMutateBroadcast(selectedRun.status)) {
      toast.error("Only scheduled broadcasts can be sent now.");
      return;
    }
    const ok = window.confirm("Send this scheduled broadcast now? This cannot be edited after it starts.");
    if (!ok) return;

    setBroadcastActionSaving(true);
    try {
      const updated = await broadcastApi.sendNow(selectedRun.id);
      setSelectedRun(updated);
      await refreshSelectedBroadcast(updated.id);
      setBroadcastAction(null);
      toast.success("Broadcast started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send broadcast now");
    } finally {
      setBroadcastActionSaving(false);
    }
  };

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

  const calendarEventsByDate = useMemo(() => {
    return runs
      .filter((run) => run.scheduledAt)
      .reduce<Record<string, BroadcastRunRow[]>>((acc, run) => {
        const key = formatDateKey(new Date(run.scheduledAt as string));
        acc[key] = [...(acc[key] ?? []), run].sort(
          (a, b) => new Date(a.scheduledAt ?? a.createdAt).getTime() - new Date(b.scheduledAt ?? b.createdAt).getTime(),
        );
        return acc;
      }, {});
  }, [runs]);

  const monthLabel = calendarMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const todayKey = formatDateKey(new Date());
  const activeRunLabel = debouncedSearchQuery
    ? `${runsTotal} result${runsTotal === 1 ? "" : "s"}`
    : `${runs.length} loaded${runsTotal > runs.length ? ` of ${runsTotal}` : ""}`;

  const statusFilters = [
    { name: "All", color: "bg-indigo-500" },
    { name: "Scheduled", color: "bg-indigo-400" },
    { name: "Running", color: "bg-indigo-500" },
    { name: "Completed", color: "bg-emerald-500" },
    { name: "Partial failure", color: "bg-amber-500" },
  ];

  const toggleSort = (field: "name" | "scheduledAt" | "status") => {
    const nextOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(nextOrder);
  };

  const sortIndicator = (field: "name" | "scheduledAt" | "status") => {
    if (sortBy !== field) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <div className="flex h-full bg-gray-50 flex-col md:flex-row">
      <div className="hidden md:flex w-full md:w-64 bg-white border-r border-gray-200 flex-col p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Radio size={20} />
          Broadcasts
        </h2>
        <div className="space-y-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.name}
              type="button"
              onClick={() => setSelectedStatus(filter.name)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                selectedStatus === filter.name ? "bg-indigo-50 text-indigo-600" : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              <div className={`w-3 h-3 ${filter.color} rounded-full`} />
              <span>{filter.name}</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-xs text-gray-500 leading-relaxed">
          WhatsApp broadcasts use only approved templates. Messages are queued through the outbound pipeline with
          retries and rate limits.
        </p>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search broadcasts"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  void refreshChannels(false);
                  void loadRuns(true);
                }}
                disabled={channelsLoading || runsLoading}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw size={16} className={channelsLoading || runsLoading ? "animate-spin" : ""} />
                Channels
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">{activeRunLabel}</span>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg text-sm ${viewMode === "table" ? "bg-gray-100" : "hover:bg-gray-50"}`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  viewMode === "calendar" ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <Calendar size={18} />
                Calendar
              </button>
              <button
                type="button"
                onClick={() => {
                  setLastSendResult(null);
                  setShowComposer(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
              >
                <Plus size={18} />
                New broadcast
              </button>
              <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {viewMode === "calendar" ? (
            <div className="p-4 sm:p-6">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{monthLabel}</h3>
                    <p className="text-xs text-gray-500">Scheduled broadcasts by send date</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(startOfMonth(new Date()))}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      Today
                    </button>
                    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((month) => addMonths(month, -1))}
                        className="p-1.5 hover:bg-gray-50 border-r border-gray-200"
                        aria-label="Previous month"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((month) => addMonths(month, 1))}
                        className="p-1.5 hover:bg-gray-50"
                        aria-label="Next month"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="px-2 py-2 text-xs font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((day) => {
                    const key = formatDateKey(day);
                    const dayEvents = calendarEventsByDate[key] ?? [];
                    const visibleEvents = dayEvents.slice(0, 3);
                    const overflow = dayEvents.length - visibleEvents.length;
                    const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                    const isToday = key === todayKey;

                    return (
                      <div
                        key={key}
                        className={`min-h-[132px] border-r border-b border-gray-200 p-2 ${
                          isCurrentMonth ? "bg-white" : "bg-gray-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs ${
                              isToday
                                ? "bg-gray-900 text-white"
                                : isCurrentMonth
                                  ? "text-gray-700"
                                  : "text-gray-400"
                            }`}
                          >
                            {day.getDate()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {visibleEvents.map((event) => (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => openDetail(event)}
                              className={`w-full border-l-2 rounded-md px-2 py-1 text-left text-xs transition hover:scale-[1.01] ${calendarEventClass(
                                event.status,
                              )}`}
                            >
                              <span className="block truncate font-medium">{event.name}</span>
                              <span className="block text-[11px] opacity-75">
                                {formatTime(event.scheduledAt)} · {calendarStatusLabel(event.status)}
                              </span>
                            </button>
                          ))}
                          {overflow > 0 && (
                            <button
                              type="button"
                              onClick={() => openDetail(dayEvents[3])}
                              className="w-full rounded-md px-2 py-1 text-left text-xs text-gray-500 hover:bg-gray-100"
                            >
                              +{overflow} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {(hasMoreRuns || runsLoadingMore) && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => void loadRuns(false, nextCursor)}
                    disabled={runsLoadingMore || !nextCursor}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runsLoadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
                    Load more broadcasts
                  </button>
                </div>
              )}
            </div>
          ) : runsLoading ? (
            <div className="flex justify-center py-20 text-gray-500 gap-2 items-center">
              <Loader2 className="animate-spin" size={22} />
              Loading broadcasts…
            </div>
          ) : (
            <div className="pb-6">
              <table className="w-full min-w-[960px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      <button
                        type="button"
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center gap-1 hover:text-gray-900"
                      >
                        Status
                        <span className="text-[11px]">{sortIndicator("status")}</span>
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      <button
                        type="button"
                        onClick={() => toggleSort("scheduledAt")}
                        className="inline-flex items-center gap-1 hover:text-gray-900"
                      >
                        Schedule
                        <span className="text-[11px]">{sortIndicator("scheduledAt")}</span>
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="inline-flex items-center gap-1 hover:text-gray-900"
                      >
                        Name
                        <span className="text-[11px]">{sortIndicator("name")}</span>
                      </button>
                    </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Channel
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Mode
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Audience
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Queued
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Failed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">
                      {debouncedSearchQuery || selectedStatus !== "All"
                        ? "No broadcasts matched this search or filter."
                        : "No broadcasts yet. Create one to reach opted-in contacts on a connected channel."}
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(run)}>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${statusBadgeClass(run.status)}`}
                        >
                          {statusLabel(run.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {run.scheduledAt ? formatDateTime(run.scheduledAt) : formatDateTime(run.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-indigo-600">{run.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {run.channel?.name ?? "—"}{" "}
                        <span className="text-gray-400">({run.channel?.type ?? "?"})</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{run.contentMode}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{run.totalAudience}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{run.queuedCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{run.failedEnqueue}</td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
              {(hasMoreRuns || runsLoadingMore) && (
                <div className="flex justify-center px-6 pt-4">
                  <button
                    type="button"
                    onClick={() => void loadRuns(false, nextCursor)}
                    disabled={runsLoadingMore || !nextCursor}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runsLoadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
                    Load more broadcasts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {lastSendResult && (
          <div className="bg-white border-t border-gray-200 px-6 py-3 text-sm text-gray-700">
            Last run:{" "}
            <span className="font-medium text-gray-900">
              {lastSendResult.status === "scheduled"
                ? `scheduled for ${formatDateTime(lastSendResult.scheduledAt)}`
                : `${lastSendResult.queued} queued`}
            </span>
            {lastSendResult.failed > 0 && (
              <span className="text-red-600 ml-2">{lastSendResult.failed} enqueue errors</span>
            )}
            <button
              type="button"
                          className="ml-3 text-indigo-600 hover:underline"
              onClick={async () => {
                try {
                  const full = await broadcastApi.get(lastSendResult.broadcastRunId);
                  openDetail(full);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not load run");
                }
              }}
            >
              View run
            </button>
          </div>
        )}
      </div>

      {showComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users size={20} />
                New broadcast
              </h2>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={22} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal name</label>
                <input
                  type="text"
                  placeholder="Q1 promo — WhatsApp"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select
                  value={form.channelId}
                  onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select channel</option>
                  {channels
                    .filter((c) => c.status === "connected" || !c.status)
                    .map((c) => (
                      <option key={String(c.id)} value={String(c.id)}>
                        {c.name ?? c.type} ({c.type})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lifecycle</label>
                <select
                  value={form.lifecycleId}
                  onChange={(e) => setForm({ ...form, lifecycleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Any stage</option>
                  {lifecycles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {`${s.emoji ?? ""} ${s.name}`.trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (any match)</label>
                <BroadcastTagPicker
                  tags={tags}
                  value={form.tagIds}
                  onChange={(tagIds) => setForm({ ...form, tagIds })}
                />
                <p className="text-xs text-gray-500 mt-1">Recipients match if they have at least one selected tag.</p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.respectMarketingOptOut}
                  onChange={(e) => setForm({ ...form, respectMarketingOptOut: e.target.checked })}
                  className="mt-1 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Exclude marketing opt-outs
                  </span>
                  <span className="block text-gray-500 text-xs mt-0.5">
                    Recommended for promotional use. Contacts with marketing opt-out are skipped.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={runAudiencePreview}
                  disabled={previewLoading || !form.channelId}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                  {previewLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Preview audience
                </button>
                {audiencePreview && (
                  <span className="text-sm text-gray-600">
                    ~{audiencePreview.totalMatching} recipients
                  </span>
                )}
              </div>
              {audiencePreview && audiencePreview.sample.length > 0 && (
                <ul className="text-xs text-gray-500 border border-gray-100 rounded-lg p-2 max-h-24 overflow-y-auto bg-gray-50">
                  {audiencePreview.sample.slice(0, 8).map((s, i) => (
                    <li key={i}>
                      {s.name} · {s.identifier}
                    </li>
                  ))}
                </ul>
              )}

              {isWhatsApp ? (
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-800">WhatsApp template</p>
                  <p className="text-xs text-gray-500">
                    Meta requires an approved template for most outbound WhatsApp broadcasts. Messages are queued and
                    sent with delivery receipts when the channel supports them.
                  </p>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select template</option>
                    {waTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.language}) · {t.category}
                      </option>
                    ))}
                  </select>
                  {selectedTemplate &&
                    templateVariableKeys(selectedTemplate.variables).map((key) => (
                      <div key={key}>
                        <label className="text-xs text-gray-600">{`{{${key}}}`}</label>
                        <input
                          value={templateVars[key] ?? ""}
                          onChange={(e) => setTemplateVars((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-0.5"
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                    rows={4}
                    placeholder="Write the message for this channel…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-800">Send time</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, scheduleMode: "now", scheduledAt: "" })}
                    className={`px-3 py-2 border rounded-lg text-sm ${
                      form.scheduleMode === "now" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-300"
                    }`}
                  >
                    Send now
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, scheduleMode: "later" })}
                    className={`px-3 py-2 border rounded-lg text-sm ${
                      form.scheduleMode === "later" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-300"
                    }`}
                  >
                    Schedule
                  </button>
                </div>
                {form.scheduleMode === "later" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date and time</label>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The server will pick it up when the scheduled time is due.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch limit</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={form.limit}
                  onChange={(e) => setForm({ ...form, limit: parseInt(e.target.value, 10) || 200 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Max 500 per run. Larger campaigns should be split.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : null}
                {form.scheduleMode === "later" ? "Schedule broadcast" : "Send broadcast"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRun && (
        <div className="fixed inset-y-0 right-0 z-50 flex justify-end pointer-events-none">
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto border-l border-gray-200 pointer-events-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 size={18} />
                Broadcast details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRun(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={22} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Name</p>
                <p className="text-gray-900 font-medium">{selectedRun.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${statusBadgeClass(selectedRun.status)}`}>
                  {statusLabel(selectedRun.status)}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Channel</p>
                <p className="text-gray-900 mt-1">
                  {selectedRun.channel?.name ?? "-"}{" "}
                  <span className="text-gray-400">({selectedRun.channel?.type ?? "?"})</span>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={!canMutateBroadcast(selectedRun.status) || broadcastActionSaving}
                  onClick={() => openBroadcastAction("edit")}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={!canMutateBroadcast(selectedRun.status) || broadcastActionSaving}
                  onClick={() => openBroadcastAction("reschedule")}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  disabled={!canMutateBroadcast(selectedRun.status) || broadcastActionSaving}
                  onClick={sendSelectedBroadcastNow}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  Send Now
                </button>
              </div>
              {!canMutateBroadcast(selectedRun.status) && (
                <p className="text-xs text-gray-500">
                  Running, sent, and failed broadcasts are locked to preserve delivery audit history.
                </p>
              )}
              {broadcastAction && (
                <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-700 uppercase">
                    {broadcastAction === "edit" ? "Edit scheduled broadcast" : "Reschedule broadcast"}
                  </p>
                  {broadcastAction === "edit" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Broadcast name</label>
                      <input
                        type="text"
                        value={broadcastDraft.name}
                        onChange={(e) => setBroadcastDraft((draft) => ({ ...draft, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Schedule time</label>
                    <input
                      type="datetime-local"
                      value={broadcastDraft.scheduledAt}
                      onChange={(e) => setBroadcastDraft((draft) => ({ ...draft, scheduledAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setBroadcastAction(null)}
                      disabled={broadcastActionSaving}
                      className="px-3 py-2 text-xs border border-gray-200 rounded-md hover:bg-white disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveBroadcastAction}
                      disabled={broadcastActionSaving}
                      className="px-3 py-2 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {broadcastActionSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                      Save
                    </button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Scheduled</p>
                  <p className="text-gray-900">{formatDateTime(selectedRun.scheduledAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Completed</p>
                  <p className="text-gray-900">{formatDateTime(selectedRun.completedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Audience</p>
                  <p className="text-gray-900">{selectedRun.totalAudience}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Queued</p>
                  <p className="text-gray-900">{selectedRun.queuedCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Enqueue failed</p>
                  <p className="text-gray-900">{selectedRun.failedEnqueue}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Mode</p>
                  <p className="text-gray-900 capitalize">{selectedRun.contentMode}</p>
                </div>
              </div>
              {(selectedRun.templateName || selectedRun.textPreview) && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Content</p>
                  <p className="text-gray-800 mt-1">
                    {selectedRun.templateName
                      ? `${selectedRun.templateName} (${selectedRun.templateLanguage})`
                      : selectedRun.textPreview}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                    Delivery analytics
                  </p>
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:underline"
                    onClick={async () => {
                      if (!selectedRun?.id) return;
                      setAnalyticsLoading(true);
                      try {
                        const a = await broadcastApi.analytics(selectedRun.id);
                        setAnalytics(a);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Refresh failed");
                      } finally {
                        setAnalyticsLoading(false);
                      }
                    }}
                  >
                    Refresh
                  </button>
                </div>
                {analyticsLoading ? (
                  <div className="flex items-center gap-2 text-gray-500 py-4">
                    <Loader2 size={18} className="animate-spin" />
                    Loading…
                  </div>
                ) : analytics ? (
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      Total tracked messages:{" "}
                      <span className="font-semibold">{analytics.totalMessages}</span>
                    </p>
                    <ul className="space-y-1">
                      {Object.entries(analytics.byStatus).map(([st, n]) => (
                        <li key={st} className="flex justify-between text-gray-700">
                          <span className="capitalize">{st}</span>
                          <span className="font-medium">{n}</span>
                        </li>
                      ))}
                    </ul>
                    {analytics.byQueueStatus && Object.keys(analytics.byQueueStatus).length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-gray-500 uppercase font-medium mb-1">Queue</p>
                        <ul className="space-y-1">
                          {Object.entries(analytics.byQueueStatus).map(([st, n]) => (
                            <li key={st} className="flex justify-between text-gray-700">
                              <span className="capitalize">{st}</span>
                              <span className="font-medium">{n}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 leading-relaxed mt-2">{analytics.queueNote}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs">No analytics yet.</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 uppercase font-medium">Recipient trace</p>
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:underline"
                    onClick={async () => {
                      if (!selectedRun?.id) return;
                      setTraceLoading(true);
                      try {
                        const t = await broadcastApi.trace(selectedRun.id);
                        setTrace(t);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Trace refresh failed");
                      } finally {
                        setTraceLoading(false);
                      }
                    }}
                  >
                    Refresh trace
                  </button>
                </div>
                {traceLoading ? (
                  <div className="flex items-center gap-2 text-gray-500 py-4">
                    <Loader2 size={18} className="animate-spin" />
                    Loading trace...
                  </div>
                ) : trace && trace.rows.length > 0 ? (
                  <div className="space-y-2">
                    {trace.rows.slice(0, 12).map((row) => (
                      <div key={row.messageId} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{row.recipient}</p>
                            <p className="text-xs text-gray-500 truncate">{row.identifier ?? row.channelMsgId ?? "-"}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${statusBadgeClass(row.messageStatus)}`}>
                            {statusLabel(row.messageStatus)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          <p>Created: {formatDateTime(row.createdAt)}</p>
                          <p>Sent: {formatDateTime(row.sentAt)}</p>
                          {row.queueStatus && <p>Queue: {row.queueStatus}</p>}
                          {row.attempts > 0 && <p>Attempts: {row.attempts}/{row.maxRetries}</p>}
                          {row.lastError && <p className="text-red-600">Error: {row.lastError}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs">
                    No recipient trace yet. Scheduled broadcasts will show rows after they start.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
