import { useEffect, useState } from "react";
import { Bot, ShieldCheck, UserRoundCheck } from "@/components/ui/icons";
import { Tag } from "../../../components/ui/Tag";
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
      <Tag
        label="Waiting Approval"
        icon={<ShieldCheck size={12} />}
        bgColor="info"
        size="sm"
      />
    );
  }

  if (status.liveState === "human_takeover") {
    return (
      <Tag
        label="Human Takeover"
        icon={<UserRoundCheck size={12} />}
        bgColor="warning"
        size="sm"
      />
    );
  }

  return (
    <Tag
      label="AI Handling"
      icon={<Bot size={12} />}
      bgColor="success"
      size="sm"
    />
  );
}