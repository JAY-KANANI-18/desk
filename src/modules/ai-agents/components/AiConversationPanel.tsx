import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bot, CheckCircle2, Loader2, Pause, Play, RefreshCw, ShieldCheck, UserRoundCheck } from "lucide-react";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import { useFeatureFlags } from "../../../context/FeatureFlagsContext";
import { useAuthorization } from "../../../context/AuthorizationContext";
import type { AiConversationStatus } from "../types";

export function AiConversationPanel({ conversationId }: { conversationId?: string | number | null }) {
  const { flags } = useFeatureFlags();
  const { canWs } = useAuthorization();
  const [status, setStatus] = useState<AiConversationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const canManage = canWs("ws:ai-agents:manage");

  const load = async () => {
    if (!conversationId || !flags.aiAgents) return;
    setLoading(true);
    try {
      setStatus(await aiAgentsApi.conversationStatus(String(conversationId)));
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [conversationId, flags.aiAgents]);

  if (!flags.aiAgents || !conversationId) return null;

  const run = async (action: () => Promise<any>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const liveState = status?.liveState || "idle";

  return (
    <div className="mx-4 my-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Bot size={16} />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-slate-950">AI Agent</p>
            <p className="text-[11px] text-slate-500">{liveLabel(liveState)}</p>
          </div>
        </div>
        {loading ? <Loader2 size={14} className="animate-spin text-slate-400" /> : <LivePill state={liveState} />}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SmallMetric label="Intent" value={status?.latestRun?.intent || "Unknown"} />
        <SmallMetric label="Confidence" value={status?.latestRun?.confidence ? `${Math.round(Number(status.latestRun.confidence) * 100)}%` : "—"} />
        <SmallMetric label="Approvals" value={status?.pendingApprovals?.length || 0} />
        <SmallMetric label="Memory facts" value={status?.memories?.length || 0} />
      </div>

      {status?.memories?.length ? (
        <div className="mt-3 space-y-1">
          {status.memories.slice(0, 3).map((memory) => (
            <div key={`${memory.scope}-${memory.key}`} className="rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">{memory.key}:</span> {formatMemory(memory.value)}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        {canManage ? (
          <>
            <button
              disabled={busy}
              onClick={() => run(() => aiAgentsApi.pauseConversation(String(conversationId)), "AI paused for this chat")}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-[12px] font-semibold text-slate-700 disabled:opacity-50"
            >
              <Pause size={13} />
              Pause AI
            </button>
            <button
              disabled={busy}
              onClick={() => run(() => aiAgentsApi.resumeConversation(String(conversationId)), "AI resumed")}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-[12px] font-semibold text-slate-700 disabled:opacity-50"
            >
              <Play size={13} />
              Resume
            </button>
            <button
              disabled={busy}
              onClick={() => run(() => aiAgentsApi.enqueueConversationRun(String(conversationId)), "AI retry queued")}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-[12px] font-semibold text-slate-700 disabled:opacity-50"
            >
              <RefreshCw size={13} />
              Regenerate
            </button>
            <button
              disabled={busy}
              onClick={() => run(() => aiAgentsApi.pauseConversation(String(conversationId)), "Human takeover started")}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-950 px-2 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              <UserRoundCheck size={13} />
              Take over
            </button>
          </>
        ) : (
          <p className="col-span-2 text-[11px] text-slate-500">Managers can pause, resume, approve, and regenerate AI actions.</p>
        )}
      </div>

      {status?.pendingApprovals?.length ? (
        <a href="/ai-agents/approvals" className="mt-3 flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-[12px] font-semibold text-sky-700">
          <ShieldCheck size={14} />
          {status.pendingApprovals.length} action needs approval
        </a>
      ) : null}
    </div>
  );
}

function LivePill({ state }: { state: AiConversationStatus["liveState"] | "idle" }) {
  const className =
    state === "waiting_approval"
      ? "bg-sky-50 text-sky-700"
      : state === "human_takeover"
      ? "bg-amber-50 text-amber-700"
      : state === "ai_handling"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-600";
  return <span className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${className}`}>{liveLabel(state)}</span>;
}

function SmallMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function liveLabel(state: string) {
  if (state === "ai_handling") return "AI Handling";
  if (state === "waiting_approval") return "Waiting Approval";
  if (state === "human_takeover") return "Human Takeover";
  return "Idle";
}

function formatMemory(value: Record<string, any>) {
  const text = Object.entries(value || {})
    .filter(([, item]) => item !== null && item !== undefined && item !== "")
    .slice(0, 3)
    .map(([key, item]) => `${key} ${String(item)}`)
    .join(", ");
  return text || "Stored";
}
