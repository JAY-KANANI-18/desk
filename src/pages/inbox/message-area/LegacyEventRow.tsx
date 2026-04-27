import { type ElementType } from "react";
import {
  AlarmClock,
  Archive,
  ArrowRightLeft,
  BellOff,
  PhoneCall,
  RefreshCw,
  Tag as TagIcon,
  UserCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Tag } from "../../../components/ui/Tag";
import type { ConversationEventType, Message } from "./types";
import { formatMsgTime } from "./helpers";

const LEGACY_EVENT_CONFIG: Record<
  ConversationEventType,
  {
    icon: ElementType;
    bgColor: string;
    label: (e?: Message["metadata"]["event"]) => string;
  }
> = {
  assigned: {
    icon: UserCheck,
    bgColor: "#059669",
    label: (e) =>
      `Assigned to ${e?.targetName ?? "agent"}${e?.actorName ? ` by ${e.actorName}` : ""}`,
  },
  unassigned: {
    icon: UserMinus,
    bgColor: "gray",
    label: (e) => `Unassigned${e?.actorName ? ` by ${e.actorName}` : ""}`,
  },
  contact_changed: {
    icon: ArrowRightLeft,
    bgColor: "#7c3aed",
    label: (e) => `Contact changed to ${e?.targetName ?? "unknown"}`,
  },
  opened: {
    icon: RefreshCw,
    bgColor: "#4f46e5",
    label: (e) =>
      `Conversation reopened${e?.actorName ? ` by ${e.actorName}` : ""}`,
  },
  closed: {
    icon: Archive,
    bgColor: "gray",
    label: (e) =>
      `Conversation closed${e?.actorName ? ` by ${e.actorName}` : ""}`,
  },
  snoozed: {
    icon: BellOff,
    bgColor: "#d97706",
    label: (e) => `Snoozed${e?.detail ? ` until ${e.detail}` : ""}`,
  },
  unsnoozed: {
    icon: AlarmClock,
    bgColor: "#d97706",
    label: () => "Snooze removed",
  },
  label_added: {
    icon: TagIcon,
    bgColor: "#4f46e5",
    label: (e) => `Label "${e?.detail ?? ""}" added`,
  },
  label_removed: {
    icon: TagIcon,
    bgColor: "gray",
    label: (e) => `Label "${e?.detail ?? ""}" removed`,
  },
  channel_changed: {
    icon: RefreshCw,
    bgColor: "#0d9488",
    label: (e) => `Channel changed to ${e?.detail ?? "unknown"}`,
  },
  call_started: {
    icon: PhoneCall,
    bgColor: "#16a34a",
    label: () => "Call started",
  },
  call_ended: {
    icon: PhoneCall,
    bgColor: "#ef4444",
    label: (e) => `Call ended${e?.detail ? ` - ${e.detail}` : ""}`,
  },
  bot_handoff: {
    icon: UserPlus,
    bgColor: "#9333ea",
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
        <Tag
          label={`${msg.text ?? "Event"}${time ? ` - ${time}` : ""}`}
          size="sm"
          bgColor="gray"
          maxWidth="90%"
        />
      </div>
    );
  }

  const Icon = cfg.icon;

  return (
    <div className="flex items-center justify-center my-3 px-4">
      <Tag
        label={`${cfg.label(ev)}${time ? ` - ${time}` : ""}`}
        icon={<Icon size={11} />}
        size="sm"
        bgColor={cfg.bgColor}
        maxWidth="90%"
      />
    </div>
  );
}
