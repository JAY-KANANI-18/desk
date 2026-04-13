import React, { useState } from "react";
import {
  CornerUpLeft,
  CornerUpRight,
  Smile,
  Copy,
  Star,
  Trash2,
  Users,
  ExternalLink,
} from "lucide-react";
import type { Message, ReplyContext } from "./types";

type ActionDef = {
  id: string;
  icon: React.ElementType;
  label: string;
  danger?: boolean;
};

const CHANNEL_ACTIONS: Record<string, ActionDef[]> = {
  whatsapp: [
    { id: "reply", icon: CornerUpLeft, label: "Reply" },
    { id: "react", icon: Smile, label: "React" },
    { id: "forward", icon: CornerUpRight, label: "Forward" },
    { id: "copy", icon: Copy, label: "Copy" },
    { id: "link", icon: ExternalLink, label: "Link" },
    { id: "star", icon: Star, label: "Star" },
    { id: "delete", icon: Trash2, label: "Delete", danger: true },
  ],
  email: [
    { id: "reply", icon: CornerUpLeft, label: "Reply" },
    { id: "replyall", icon: Users, label: "Reply All" },
    { id: "forward", icon: CornerUpRight, label: "Forward" },
    { id: "copy", icon: Copy, label: "Copy" },
    { id: "link", icon: ExternalLink, label: "Link" },
    { id: "delete", icon: Trash2, label: "Delete", danger: true },
  ],
  webchat: [
    { id: "reply", icon: CornerUpLeft, label: "Reply" },
    { id: "copy", icon: Copy, label: "Copy" },
    { id: "link", icon: ExternalLink, label: "Link" },
    { id: "delete", icon: Trash2, label: "Delete", danger: true },
  ],
  instagram: [
    { id: "reply", icon: CornerUpLeft, label: "Reply" },
    { id: "react", icon: Smile, label: "React" },
    { id: "copy", icon: Copy, label: "Copy" },
    { id: "link", icon: ExternalLink, label: "Link" },
    { id: "delete", icon: Trash2, label: "Delete", danger: true },
  ],
  messenger: [
    { id: "reply", icon: CornerUpLeft, label: "Reply" },
    { id: "react", icon: Smile, label: "React" },
    { id: "copy", icon: Copy, label: "Copy" },
    { id: "link", icon: ExternalLink, label: "Link" },
    { id: "delete", icon: Trash2, label: "Delete", danger: true },
  ],
  comment: [
    { id: "copy", icon: Copy, label: "Copy" },
    { id: "link", icon: ExternalLink, label: "Link" },
    { id: "delete", icon: Trash2, label: "Delete", danger: true },
  ],
};

export function QuickActions({
  channel,
  isOutgoing,
  msg,
  visible,
  onReply,
}: {
  channel: string;
  isOutgoing: boolean;
  msg: Message;
  visible: boolean;
  onReply: (ctx: ReplyContext) => void;
}) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const actions = CHANNEL_ACTIONS[channel] ?? CHANNEL_ACTIONS.webchat;

  const handleAction = (id: string) => {
    if (id === "copy") {
      navigator.clipboard.writeText(msg.text ?? "");
      return;
    }
    if (id === "link") {
      const origin = window.location.origin;
      const link = `${origin}/inbox/${msg.conversationId}?targetMessageId=${msg.id}`;
      navigator.clipboard.writeText(link);
      return;
    }
    if (id === "reply") {
      if (channel === "email") {
        onReply({
          type: "email",
          emailReply: {
            to: msg.metadata?.email?.from ?? msg.metadata?.email?.to ?? "",
            subject: msg.metadata?.email?.subject
              ? `Re: ${msg.metadata.email.subject.replace(/^Re:\\s*/i, "")}`
              : "Re:",
            threadId: msg.metadata?.email?.threadId,
            messageId: msg.metadata?.email?.messageId,
            cc: msg.metadata?.email?.cc,
          },
        });
      } else {
        const atts = msg.messageAttachments ?? msg.attachments ?? [];
        const firstAtt = atts[0];
        onReply({
          type: "chat",
          quotedMessage: {
            id: msg.id,
            text: msg.text,
            author: msg.author,
            attachmentType: firstAtt?.type,
            attachmentUrl: firstAtt?.url,
          },
        });
      }
    }
  };

  const posClass = isOutgoing ? "right-full mr-2" : "left-full ml-2";
  return (
    <div
      className={`absolute ${posClass} top-1/2 -translate-y-1/2 flex items-center gap-0.5
      bg-white border border-gray-200 rounded-full shadow-lg px-1.5 py-1 z-20
      transition-all duration-150
      ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
    >
      {actions.map((action) => (
        <div key={action.id} className="relative">
          <button
            onClick={() => handleAction(action.id)}
            onMouseEnter={() => setTooltip(action.label)}
            onMouseLeave={() => setTooltip(null)}
            className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100
              ${action.danger ? "text-red-500" : "text-gray-500"}`}
          >
            <action.icon size={14} />
          </button>
          {tooltip === action.label && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow">
              {action.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
