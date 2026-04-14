import { Plus, Plug } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthorization } from "../../context/AuthorizationContext";

interface InboxAddChannelPromptProps {
  message: string;
  compact?: boolean;
}

export function InboxAddChannelPrompt({
  message,
  compact = false,
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
        className={`mb-4 flex items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 ${
          compact ? "h-14 w-14" : "h-16 w-16"
        }`}
      >
        <Plug
          size={compact ? 22 : 26}
          className="text-indigo-600"
        />
      </div>

      <p
        className={`text-slate-600 ${
          compact ? "max-w-[18rem] text-sm leading-6" : "text-base leading-7"
        }`}
      >
        {message}
      </p>

      {canManageChannels ? (
        <button
          type="button"
          onClick={() => navigate("/channels/connect")}
          className={`mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 font-medium text-white transition hover:bg-indigo-700 ${
            compact ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-sm"
          }`}
        >
          <Plus size={16} />
          Add channel
        </button>
      ) : null}
    </div>
  );
}
