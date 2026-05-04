import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Bot, Loader2, Pause, Play, RefreshCw, ShieldCheck, UserRoundCheck } from "@/components/ui/icons";
import { Button } from "../../../components/ui/Button";
import { Tag } from "../../../components/ui/Tag";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import { useFeatureFlags } from "../../../context/FeatureFlagsContext";
import { useAuthorization } from "../../../context/AuthorizationContext";
import type { AiConversationStatus } from "../types";

export function AiConversationPanel({ conversationId }: { conversationId?: string | number | null }) {
  const navigate = useNavigate();
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

  const run = async (action: () => Promise<unknown>, success: string) => {
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
        <SmallMetric label="Confidence" value={status?.latestRun?.confidence ? `${Math.round(Number(status.latestRun.confidence) * 100)}%` : "-"} />
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
            <Button
              type="button"
              variant="secondary"
              size="xs"
              fullWidth
              leftIcon={<Pause size={13} />}
              disabled={busy}
              onClick={() => run(() => aiAgentsApi.pauseConversation(String(conversationId)), "AI paused for this chat")}
            >
              Pause AI
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              fullWidth
              leftIcon={<Play size={13} />}
              disabled={busy}
              onClick={() => run(() => aiAgentsApi.resumeConversation(String(conversationId)), "AI resumed")}
            >
              Resume
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              fullWidth
              leftIcon={<RefreshCw size={13} />}
              disabled={busy}
              onClick={() => run(() => aiAgentsApi.enqueueConversationRun(String(conversationId)), "AI retry queued")}
            >
              Regenerate
            </Button>
            <Button
              type="button"
              variant="dark"
              size="xs"
              fullWidth
              leftIcon={<UserRoundCheck size={13} />}
              disabled={busy}
              onClick={() => run(() => aiAgentsApi.pauseConversation(String(conversationId)), "Human takeover started")}
            >
              Take over
            </Button>
          </>
        ) : (
          <p className="col-span-2 text-[11px] text-slate-500">Managers can pause, resume, approve, and regenerate AI actions.</p>
        )}
      </div>

      {status?.pendingApprovals?.length ? (
        <div className="mt-3">
          <Button
            type="button"
            variant="soft-primary"
            size="xs"
            fullWidth
            contentAlign="start"
            leftIcon={<ShieldCheck size={14} />}
            onClick={() => navigate("/ai-agents/approvals")}
          >
            {status.pendingApprovals.length} action needs approval
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function LivePill({ state }: { state: AiConversationStatus["liveState"] | "idle" }) {
  const color =
    state === "waiting_approval"
      ? "info"
      : state === "human_takeover"
        ? "warning"
        : state === "ai_handling"
          ? "success"
          : "gray";

  return <Tag label={liveLabel(state)} bgColor={color} size="sm" />;
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

function formatMemory(value: Record<string, unknown>) {
  const text = Object.entries(value || {})
    .filter(([, item]) => item !== null && item !== undefined && item !== "")
    .slice(0, 3)
    .map(([key, item]) => `${key} ${String(item)}`)
    .join(", ");
  return text || "Stored";
}