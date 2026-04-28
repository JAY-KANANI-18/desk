import { Globe, Plus, RadioTower } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChannelBadgeStack } from "../../components/channels/ChannelBadges";
import { useAuthorization } from "../../context/AuthorizationContext";
import { Button } from "../../components/ui/Button";

interface InboxAddChannelPromptProps {
  message: string;
  compact?: boolean;
  title?: string;
}

export function InboxAddChannelPrompt({
  message,
  compact = false,
  title = "No channels connected yet",
}: InboxAddChannelPromptProps) {
  const navigate = useNavigate();
  const { canWs } = useAuthorization();
  const canManageChannels = canWs("ws:channels:manage");

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "px-4 py-14" : "mx-auto max-w-md px-6 py-12"
      }`}
    >
      <div
        className={`mb-4 flex items-center justify-center rounded-2xl bg-gray-100 ${
          compact ? "h-14 w-14" : "h-16 w-16"
        }`}
      >
        <RadioTower
          size={compact ? 22 : 26}
          className="text-gray-400"
        />
      </div>

      <p className="text-base font-semibold text-slate-800">{title}</p>

      <p
        className={`mt-1 text-slate-500 ${
          compact ? "max-w-[18rem] text-sm leading-6" : "text-base leading-7"
        }`}
      >
        {message}
      </p>

      <ChannelBadgeStack
        linked={canManageChannels}
        size={compact ? "sm" : "md"}
        className={compact ? "mt-3" : "mt-4"}
      />

      {canManageChannels ? (
        <Button
          type="button"
          onClick={() => navigate("/channels/connect")}
          leftIcon={<Plus size={16} />}
          size={compact ? "sm" : "md"}
          className="mt-4"
        >
          Connect a channel
        </Button>
      ) : null}
    </div>
  );
}
