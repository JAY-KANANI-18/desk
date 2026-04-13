import React from "react";
import {
  AlarmClock,
  Archive,
  ArrowRightLeft,
  BellOff,
  PhoneCall,
  RefreshCw,
  Tag,
  UserCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import type { ConversationEventType, Message } from "./types";
import { formatMsgTime } from "./helpers";

const LEGACY_EVENT_CONFIG: Record<
  ConversationEventType,
  {
    icon: React.ElementType;
    color: string;
    label: (e?: Message["metadata"]["event"]) => string;
  }
> = {
  assigned: {
    icon: UserCheck,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    label: (e) =>
      `Assigned to ${e?.targetName ?? "agent"}${e?.actorName ? ` by ${e.actorName}` : ""}`,
  },
  unassigned: {
    icon: UserMinus,
    color: "text-gray-500 bg-gray-50 border-gray-200",
    label: (e) => `Unassigned${e?.actorName ? ` by ${e.actorName}` : ""}`,
  },
  contact_changed: {
    icon: ArrowRightLeft,
    color: "text-violet-600 bg-violet-50 border-violet-200",
    label: (e) => `Contact changed to ${e?.targetName ?? "unknown"}`,
  },
  opened: {
    icon: RefreshCw,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    label: (e) =>
      `Conversation reopened${e?.actorName ? ` by ${e.actorName}` : ""}`,
  },
  closed: {
    icon: Archive,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    label: (e) =>
      `Conversation closed${e?.actorName ? ` by ${e.actorName}` : ""}`,
  },
  snoozed: {
    icon: BellOff,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    label: (e) => `Snoozed${e?.detail ? ` until ${e.detail}` : ""}`,
  },
  unsnoozed: {
    icon: AlarmClock,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    label: () => "Snooze removed",
  },
  label_added: {
    icon: Tag,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    label: (e) => `Label "${e?.detail ?? ""}" added`,
  },
  label_removed: {
    icon: Tag,
    color: "text-gray-500 bg-gray-50 border-gray-200",
    label: (e) => `Label "${e?.detail ?? ""}" removed`,
  },
  channel_changed: {
    icon: RefreshCw,
    color: "text-teal-600 bg-teal-50 border-teal-200",
    label: (e) => `Channel changed to ${e?.detail ?? "unknown"}`,
  },
  call_started: {
    icon: PhoneCall,
    color: "text-green-600 bg-green-50 border-green-200",
    label: () => "Call started",
  },
  call_ended: {
    icon: PhoneCall,
    color: "text-red-500 bg-red-50 border-red-200",
    label: (e) => `Call ended${e?.detail ? ` - ${e.detail}` : ""}`,
  },
  bot_handoff: {
    icon: UserPlus,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    label: () => "Handed off to agent",
  },
};

export function LegacyEventRow({ msg }: { msg: Message }) {
  const ev = msg.metadata?.event;
  const cfg = ev?.type ? LEGACY_EVENT_CONFIG[ev.type] : null;
  const time = formatMsgTime(msg.createdAt, msg.time);

  if (!cfg) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
          {msg.text}
          {time && <span className="ml-1.5 opacity-60">{time}</span>}
        </span>
      </div>
    );
  }
  const Icon = cfg.icon;
  return (
    <div className="flex items-center justify-center my-3 px-4">
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium ${cfg.color}`}
      >
        <Icon size={11} />
        <span>{cfg.label(ev)}</span>
        {time && <span className="opacity-50 font-normal ml-1">{time}</span>}
      </div>
    </div>
  );
}
