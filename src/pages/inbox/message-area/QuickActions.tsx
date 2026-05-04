import { type ElementType } from "react";
import {
  CornerUpLeft,
  CornerUpRight,
  Smile,
  Copy,
  Star,
  Trash2,
  Users,
  ExternalLink,
} from "@/components/ui/icons";
import { Button } from "../../../components/ui/Button";
import { Tooltip } from "../../../components/ui/Tooltip";
import type { Message, ReplyContext } from "./types";

type ActionDef = {
  id: string;
  icon: ElementType;
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
  const actions = CHANNEL_ACTIONS[channel] ?? CHANNEL_ACTIONS.webchat;

  const copyToClipboard = (value: string) => {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value);
    }
  };

  const handleAction = (id: string) => {
    if (id === "copy") {
      copyToClipboard(msg.text ?? "");
      return;
    }
    if (id === "link") {
      const origin = window.location.origin;
      const link = `${origin}/inbox/${msg.conversationId}?targetMessageId=${msg.id}`;
      copyToClipboard(link);
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
        <Tooltip
          key={action.id}
          content={action.label}
          position={isOutgoing ? "left" : "right"}
        >
          <Button
            onClick={() => handleAction(action.id)}
            leftIcon={<action.icon size={14} />}
            aria-label={action.label}
            iconOnly
            size="xs"
            radius="full"
            variant={action.danger ? "danger-ghost" : "ghost"}
          />
        </Tooltip>
      ))}
    </div>
  );
}
