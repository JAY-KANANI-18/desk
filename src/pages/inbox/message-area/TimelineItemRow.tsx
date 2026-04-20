import React from "react";
import { AlertTriangle, MessageSquare, PhoneCall, Workflow } from "lucide-react";
import type { User } from "../../../context/AuthContext";
import { Tooltip } from "../../../components/ui/Tooltip";
import { channelConfig } from "../data";
import type { Conversation } from "../types";
import { ActivityRow } from "./ActivityRow";
import { highlightText, formatMsgTime, getFailedMessageCopy } from "./helpers";
import { LegacyEventRow } from "./LegacyEventRow";
import { MessageBubble } from "./MessageBubble";
import { MessageStatusIcon } from "./MessageStatusIcon";
import { QuickActions } from "./QuickActions";
import type { Message, RenderItem, ReplyContext } from "./types";

type WorkspaceUser = User;

function getAuthorDisplayName(author: Message["author"]) {
  if (!author) return "";
  return typeof author === "string"
    ? author
    : [author.firstName, author.lastName].filter(Boolean).join(" ");
}

export function TimelineItemRow({
  item,
  currentUser,
  msgSearch,
  highlighted,
  matchRingClass,
  setItemRef,
  selectedConversation,
  channels,
  workspaceUsers,
  hoveredMsgId,
  setHoveredMsgId,
  expanded,
  setExpanded,
  previewLength,
  onReply,
  onOpenEmailModal,
}: {
  item: RenderItem;
  currentUser: User | null;
  msgSearch: string;
  highlighted: boolean;
  matchRingClass: (key: string) => string;
  setItemRef: (key: string, el: HTMLDivElement | null) => void;
  selectedConversation: Conversation;
  channels?: Array<{ id?: string; type?: string } | null>;
  workspaceUsers: WorkspaceUser[] | null;
  hoveredMsgId: string | null;
  setHoveredMsgId: React.Dispatch<React.SetStateAction<string | null>>;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  previewLength: number;
  onReply?: (ctx: ReplyContext) => void;
  onOpenEmailModal: (message: Message) => void;
}) {
  const targetHighlightClass = highlighted
    ? "ring-2 ring-amber-300 bg-amber-50/70 rounded-2xl transition-all duration-500"
    : "";

  if (item.kind === "activity") {
    return (
      <div
        ref={(el) => setItemRef(item.key, el)}
        className={`${matchRingClass(item.key)} ${targetHighlightClass}`}
      >
        <ActivityRow
          activity={item.act}
          searchTerm={msgSearch || undefined}
          currentUser={currentUser}
        />
      </div>
    );
  }

  const msg = item.msg;
  const isOutgoing = msg.direction === "outgoing";
  const isEvent = msg.type === "event" || msg.type === "system";
  const isCallEvent =
    msg.type === "call_event" ||
    (msg.channelType === "exotel_call" && msg.type === "status");
  const isComment = msg.type === "comment";
  const isWaTemplate = msg.type === "template";
  const channelType = channels?.find((c) => c?.id === msg.channelId)?.type;
  const resolvedChannelType =
    (typeof channelType === "string" && channelType) ||
    (typeof msg.channel === "string" && msg.channel) ||
    (typeof selectedConversation?.channel === "string" &&
      selectedConversation.channel) ||
    selectedConversation?.channel?.type ||
    "webchat";
  const channelBadge =
    channelConfig[resolvedChannelType as keyof typeof channelConfig] ??
    channelConfig.email;
  const isEmail = resolvedChannelType === "email";
  const isAiMessage = msg.metadata?.source === "ai_agent";
  const displayTime = formatMsgTime(msg.createdAt, msg.time);
  const hoverKey = `msg-${msg.id}`;
  const isExpanded = !!expanded[msg.id];
  const failedMessageCopy =
    isOutgoing && msg.status === "failed" ? getFailedMessageCopy(msg) : null;
  const outgoingSender = workspaceUsers?.find(
    (user) => user.id === msg.metadata?.sender?.userId,
  );
  const bubbleColor = isAiMessage
    ? "bg-slate-950 text-white rounded-br-sm ring-1 ring-slate-700"
    : isOutgoing
    ? "bg-indigo-500 text-white rounded-br-sm"
    : "bg-gray-100 text-gray-900 rounded-bl-sm";

  if (isEvent) {
    return (
      <div key={msg.id} ref={(el) => setItemRef(item.key, el)}>
        <LegacyEventRow msg={msg} />
      </div>
    );
  }

  if (isCallEvent) {
    return (
      <div key={msg.id} ref={(el) => setItemRef(item.key, el)}>
        <div className="flex justify-center my-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border bg-cyan-50 text-cyan-700 border-cyan-200">
            <PhoneCall size={12} />
            {msg.text || "Call update"}
          </span>
        </div>
      </div>
    );
  }

  if (isComment) {
    return (
      <div
        key={msg.id}
        ref={(el) => setItemRef(item.key, el)}
        className={`${matchRingClass(item.key)} ${targetHighlightClass}`}
      >
        <div className="flex justify-center my-4 px-4">
          <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-200/60">
              <MessageSquare
                size={11}
                className="text-amber-600 flex-shrink-0"
              />
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                Internal Note
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-[9px] font-bold text-amber-800">
                  {msg.initials}
                </div>
                <span className="text-[11px] font-medium text-amber-800">
                  {getAuthorDisplayName(msg.author)}
                </span>
                <span className="text-[10px] text-amber-600/70 ml-1">
                  {displayTime}
                </span>
              </div>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                {msgSearch ? highlightText(msg.text ?? "", msgSearch) : msg.text}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={msg.id}
      ref={(el) => setItemRef(item.key, el)}
      className={`flex items-end gap-3 mb-4 ${isOutgoing ? "justify-end" : "justify-start"} ${matchRingClass(item.key)} ${targetHighlightClass}`}
      onMouseEnter={() => setHoveredMsgId(hoverKey)}
      onMouseLeave={() => setHoveredMsgId(null)}
    >
      {!isOutgoing && (
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs overflow-hidden">
            {selectedConversation?.contact?.avatarUrl ? (
              <img
                src={selectedConversation.contact.avatarUrl}
                alt={selectedConversation.contact.firstName || "C"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {selectedConversation?.contact?.firstName
                  ?.charAt(0)
                  ?.toUpperCase() || "C"}
              </span>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white bg-white">
            <img
              src={channelBadge.icon}
              alt={channelBadge.label}
              className="w-3 h-3"
            />
          </span>
        </div>
      )}

      <div className="relative flex flex-col max-w-sm">
        <QuickActions
          channel={resolvedChannelType}
          isOutgoing={isOutgoing}
          msg={msg}
          visible={hoveredMsgId === hoverKey}
          onReply={(ctx) => onReply?.(ctx)}
        />
        <MessageBubble
          msg={msg}
          isOutgoing={isOutgoing}
          bubbleColor={bubbleColor}
          isEmail={isEmail}
          isWaTemplate={isWaTemplate}
          isExpanded={isExpanded}
          onToggleExpand={() =>
            setExpanded((state) => ({
              ...state,
              [msg.id]: !isExpanded,
            }))
          }
          onOpenEmailModal={() => onOpenEmailModal(msg)}
          previewLength={previewLength}
          searchTerm={msgSearch || undefined}
        />
        <div className="mt-1">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {isAiMessage ? (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                AI
              </span>
            ) : null}
            <span>{displayTime}</span>
            {isOutgoing && !failedMessageCopy && (
              <MessageStatusIcon status={msg.status} />
            )}
            {failedMessageCopy && (
              <Tooltip content={failedMessageCopy} side="left">
                <span className="inline-flex cursor-help items-center">
                  <AlertTriangle
                    size={14}
                    className="text-red-500 flex-shrink-0"
                  />
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {isOutgoing && (
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 border rounded-full flex items-center justify-center text-xs overflow-hidden">
            {typeof msg.author !== "string" && msg.author?.id ? (
              msg.author.avatarUrl ? (
                <img
                  src={msg.author.avatarUrl}
                  alt={msg.author.firstName || "U"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {outgoingSender?.firstName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )
            ) : (
              <Workflow size={18} color="#4f46e5" />
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white bg-white">
            <img
              src={channelBadge.icon}
              alt={channelBadge.label}
              className="w-3 h-3"
            />
          </span>
        </div>
      )}
    </div>
  );
}
