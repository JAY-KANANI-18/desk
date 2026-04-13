import React from "react";
import {
  AlertTriangle,
  Archive,
  BellOff,
  GitMerge,
  Hash,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Tag,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Workflow,
  Zap,
  ArrowRightLeft,
} from "lucide-react";
import type { ActivityResponse } from "./types";
import { extractMentionLabels, renderCommentText } from "../utils";
import { formatMsgTime, highlightText } from "./helpers";

const ACTIVITY_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    pill: string;
    label?: (a: ActivityResponse, currentUser: any) => string;
    noteCard?: boolean;
  }
> = {
  open: {
    icon: RefreshCw,
    pill: "text-emerald-700 bg-emerald-50 border-emerald-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} opened this conversation`,
  },
  close: {
    icon: Archive,
    pill: "text-gray-600 bg-gray-50 border-gray-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} closed this conversation`,
  },
  reopen: {
    icon: RefreshCw,
    pill: "text-indigo-700 bg-indigo-50 border-indigo-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} reopened this conversation`,
  },
  pending: {
    icon: BellOff,
    pill: "text-amber-700 bg-amber-50 border-amber-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} marked this conversation as pending`,
  },
  assign_user: {
    icon: UserCheck,
    pill: "text-indigo-700 bg-indigo-50 border-indigo-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} assigned this conversation to ${a.subjectUser?.name ?? "a teammate"}`,
  },
  unassign_user: {
    icon: UserMinus,
    pill: "text-gray-600 bg-gray-50 border-gray-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} unassigned ${a.subjectUser?.name ?? "a teammate"}`,
  },
  assign_team: {
    icon: UserPlus,
    pill: "text-indigo-700 bg-indigo-50 border-indigo-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} assigned this conversation to ${a.subjectTeam?.name ?? "a team"}`,
  },
  unassign_team: {
    icon: UserMinus,
    pill: "text-gray-600 bg-gray-50 border-gray-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} unassigned ${a.subjectTeam?.name ?? "a team"}`,
  },
  merge_contact: {
    icon: GitMerge,
    pill: "text-indigo-700 bg-indigo-50 border-indigo-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} merged this contact`,
  },
  channel_added: {
    icon: Hash,
    pill: "text-teal-700 bg-teal-50 border-teal-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} added channel ${a.metadata?.channel ?? ""}`,
  },
  note: {
    icon: MessageSquare,
    pill: "text-amber-700 bg-amber-50 border-amber-200",
    noteCard: true,
  },
  label_added: {
    icon: Tag,
    pill: "text-indigo-700 bg-indigo-50 border-indigo-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} added label ${a.metadata?.label ?? ""}`,
  },
  label_removed: {
    icon: Tag,
    pill: "text-gray-600 bg-gray-50 border-gray-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} removed label ${a.metadata?.label ?? ""}`,
  },
  priority_changed: {
    icon: TrendingUp,
    pill: "text-indigo-700 bg-indigo-50 border-indigo-200",
    label: (a, currentUser) =>
      `${currentUser.id === a.actor?.id ? "You" : (a.actor?.name ?? "System")} set priority to ${a.metadata?.priority ?? ""}`,
  },
  sla_breached: {
    icon: AlertTriangle,
    pill: "text-red-700 bg-red-50 border-red-200",
    label: (a) => `SLA breached`,
  },
  assign_user_automation: {
    icon: Workflow,
    pill: "text-indigo-700 bg-indigo-50 border-indigo-200",
    label: (a) => `Automation assigned this conversation`,
  },
  call_started: {
    icon: PhoneCall,
    pill: "text-indigo-700 bg-indigo-50 border-indigo-200",
    label: (a) => `Call started`,
  },
  call_ended: {
    icon: PhoneCall,
    pill: "text-indigo-700 bg-indigo-50 border-indigo-200",
    label: (a) => `Call ended`,
  },
  bot_handoff: {
    icon: ArrowRightLeft,
    pill: "text-indigo-700 bg-indigo-50 border-indigo-200",
    label: (a) => `Bot handoff`,
  },
};

function ActorAvatar({
  actor,
  size = "sm",
}: {
  actor?: ActivityResponse["actor"];
  size?: "sm" | "xs";
}) {
  const dim = size === "xs" ? "w-5 h-5 text-[9px]" : "w-7 h-7 text-[11px]";
  if (!actor) {
    return (
      <div
        className={`${dim} bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0`}
      >
        <Zap size={size === "xs" ? 9 : 11} className="text-gray-500" />
      </div>
    );
  }
  if (actor.avatarUrl) {
    return (
      <img
        src={actor.avatarUrl}
        alt={actor.name}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dim} bg-indigo-100 text-indigo-700 font-semibold rounded-full flex items-center justify-center flex-shrink-0`}
    >
      {actor.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function ActivityRow({
  activity,
  searchTerm,
  currentUser,
}: {
  activity: ActivityResponse;
  searchTerm?: string;
  currentUser: any;
}) {
  const cfg = ACTIVITY_CONFIG[activity.eventType] ?? {
    icon: RefreshCw,
    pill: "text-gray-500 bg-gray-50 border-gray-200",
  };
  const Icon = cfg.icon;
  const time = formatMsgTime(activity.createdAt);

  if (cfg.noteCard) {
    const text = activity.metadata?.text as string | undefined;
    const mentionIds = (activity.metadata?.mentionedUserIds ?? []) as string[];
    const mentionLabels = extractMentionLabels(text ?? "");
    return (
      <div className="flex justify-center my-4 px-4">
        <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-200/60">
            <MessageSquare size={11} className="text-amber-600 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
              Internal Note
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              {activity.actor && (
                <span className="text-[11px] font-medium text-amber-800">
                  {currentUser.id === activity.actor.id
                    ? "You"
                    : activity.actor.name}
                </span>
              )}
              <span className="text-[10px] text-amber-600/70 ml-1">{time}</span>
            </div>
          </div>
          {text && (
            <div className="px-3 py-2.5">
              <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                {searchTerm ? highlightText(text, searchTerm) : renderCommentText(text)}
              </p>
            </div>
          )}
          {(mentionLabels.length > 0 || mentionIds.length > 0) && (
            <div className="px-3 pb-2 flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-amber-600/70">Mentioned:</span>
              {(mentionLabels.length > 0
                ? mentionLabels.map((mention) => ({
                    key: mention.userId,
                    label: mention.displayName,
                  }))
                : mentionIds.map((uid) => ({ key: uid, label: uid }))).map(
                (mention) => (
                  <span
                    key={mention.key}
                    className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full"
                  >
                    @{mention.label}
                  </span>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const generatedDescription =
    cfg.label?.(activity, currentUser) ?? activity.description;

  const descNode = searchTerm
    ? highlightText(generatedDescription, searchTerm)
    : generatedDescription;

  return (
    <div className="flex items-center justify-center my-3 px-4">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium
        ${cfg.pill} max-w-[90%]`}
      >
        <span className="truncate">{descNode}</span>
        {time && (
          <span className="opacity-50 font-normal ml-1 flex-shrink-0">
            {time}
          </span>
        )}
      </div>
    </div>
  );
}
