import { useEffect, useState } from "react";
import { Bot, ShieldCheck, UserRoundCheck } from "lucide-react";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import { useFeatureFlags } from "../../../context/FeatureFlagsContext";
import type { AiConversationStatus } from "../types";

export function AiConversationBadges({ conversationId }: { conversationId?: string | number | null }) {
  const { flags } = useFeatureFlags();
  const [status, setStatus] = useState<AiConversationStatus | null>(null);

  useEffect(() => {
    if (!flags.aiAgents || !conversationId) return;
    let active = true;
    aiAgentsApi
      .conversationStatus(String(conversationId))
      .then((result) => {
        if (active) setStatus(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [conversationId, flags.aiAgents]);

  if (!flags.aiAgents || !status || status.liveState === "idle") return null;

  if (status.liveState === "waiting_approval") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">
        <ShieldCheck size={12} />
        Waiting Approval
      </span>
    );
  }

  if (status.liveState === "human_takeover") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
        <UserRoundCheck size={12} />
        Human Takeover
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
      <Bot size={12} />
      AI Handling
    </span>
  );
}
