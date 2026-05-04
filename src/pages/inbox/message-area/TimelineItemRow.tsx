import React from "react";
import { MessageSquare, PhoneCall, Workflow } from "@/components/ui/icons";
import { Avatar, AvatarWithBadge } from "../../../components/ui/Avatar";
import { Tag } from "../../../components/ui/Tag";
import type { User } from "../../../context/AuthContext";
import { getChannelBadgeType } from "../channelUtils";
import { channelConfig } from "../data";
import type { Conversation } from "../types";
import { ActivityRow } from "./ActivityRow";
import { highlightText, formatMsgTime, getFailedMessageCopy } from "./helpers";
import { LegacyEventRow } from "./LegacyEventRow";
import { MessageBubble } from "./MessageBubble";
import { QuickActions } from "./QuickActions";
import type {
  Message,
  MessageGroupPosition,
  RenderItem,
  ReplyContext,
} from "./types";

type WorkspaceUser = User;

function getAuthorDisplayName(author: Message["author"]) {
  if (!author) return "";
  return typeof author === "string"
    ? author
    : [author.firstName, author.lastName].filter(Boolean).join(" ");
}

function getContactDisplayName(selectedConversation: Conversation) {
  return (
    [
      selectedConversation?.contact?.firstName,
      selectedConversation?.contact?.lastName,
    ]
      .filter(Boolean)
      .join(" ") || selectedConversation?.contact?.firstName || "Contact"
  );
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
  groupPosition,
  animateIn,
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
  groupPosition: MessageGroupPosition;
  animateIn?: boolean;
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
          workspaceUsers={workspaceUsers}
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
  const badgeType = getChannelBadgeType(resolvedChannelType);
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
  const outgoingAuthor =
    typeof msg.author !== "string" && msg.author?.id ? msg.author : null;
  const isLastInGroup = groupPosition === "single" || groupPosition === "last";
  const rowSpacingClass =
    groupPosition === "single" || groupPosition === "last" ? "mb-5" : "mb-1";
  const avatarOffsetClass = isLastInGroup ? "translate-y-4" : "";
  const avatarVisibilityClass = isLastInGroup
    ? "visible opacity-100 scale-100 transition-transform duration-200 ease-out motion-reduce:transition-none"
    : "invisible opacity-0 scale-100 pointer-events-none";
  const bubbleColor = isAiMessage
    ? "bg-[var(--appearance-surface-raised)] text-[var(--appearance-text)] ring-1 ring-[var(--appearance-border)]"
    : isOutgoing
    ? "bg-[var(--message-outgoing-bg)] text-[var(--message-outgoing-text)]"
    : "bg-[var(--message-incoming-bg)] text-[var(--message-incoming-text)]";

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
          <Tag
            label={msg.text || "Call update"}
            icon={<PhoneCall size={12} />}
            size="sm"
            bgColor="#0891b2"
          />
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
                <Avatar
                  src={typeof msg.author === "string" ? undefined : msg.author?.avatarUrl}
                  name={getAuthorDisplayName(msg.author) || msg.initials || "User"}
                  size="xs"
                />
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
      className={`flex items-end gap-2 ${rowSpacingClass} ${isOutgoing ? "justify-end" : "justify-start"} ${matchRingClass(item.key)} ${targetHighlightClass}`}
      onMouseEnter={() => setHoveredMsgId(hoverKey)}
      onMouseLeave={() => setHoveredMsgId(null)}
    >
      {!isOutgoing && (
        <div
          className={`flex w-8 shrink-0 justify-center ${avatarOffsetClass} ${avatarVisibilityClass}`}
          aria-hidden={!isLastInGroup}
        >
          <AvatarWithBadge
            src={selectedConversation?.contact?.avatarUrl}
            name={getContactDisplayName(selectedConversation)}
            size="sm"
            fallbackTone="neutral"
            badgeType={badgeType}
            badgeSrc={channelBadge.icon}
            badgeAlt={channelBadge.label}
            badgePlacement="overlap"
          />
        </div>
      )}

      <div
        className={`relative flex max-w-[78%] flex-col sm:max-w-md ${isOutgoing ? "items-end" : "items-start"}`}
      >
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
          displayTime={displayTime}
          groupPosition={groupPosition}
          isAiMessage={isAiMessage}
          failedMessageCopy={failedMessageCopy}
          animateIn={animateIn}
        />
      </div>

      {isOutgoing && (
        <div
          className={`relative flex w-8 shrink-0 justify-center ${avatarOffsetClass} ${avatarVisibilityClass}`}
          aria-hidden={!isLastInGroup}
        >
          <div className="flex items-center justify-center text-xs">
            {outgoingAuthor ? (
              <AvatarWithBadge
                src={outgoingAuthor.avatarUrl}
                name={
                  [outgoingSender?.firstName, outgoingSender?.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                  getAuthorDisplayName(outgoingAuthor) ||
                  msg.initials ||
                  "User"
                }
                size="sm"
                badgeType={badgeType}
                badgeSrc={channelBadge.icon}
                badgeAlt={channelBadge.label}
                badgePlacement="overlap"
              />
            ) : (
              <div className="w-8 h-8 border rounded-full flex items-center justify-center">
                <Workflow size={18} color="#4f46e5" />
              </div>
            )}
          </div>
          {!outgoingAuthor ? (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white bg-white">
              <img
                src={channelBadge.icon}
                alt={channelBadge.label}
                className="w-3 h-3"
              />
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
