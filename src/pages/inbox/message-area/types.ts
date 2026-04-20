export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export interface MediaAttachment {
  type: "image" | "video" | "audio" | "file";
  url: string;
  name: string;
  size?: number;
}

export type ConversationEventType =
  | "assigned"
  | "unassigned"
  | "contact_changed"
  | "opened"
  | "closed"
  | "snoozed"
  | "unsnoozed"
  | "label_added"
  | "label_removed"
  | "channel_changed"
  | "call_started"
  | "call_ended"
  | "bot_handoff";

export type ActivityEventType =
  | "open"
  | "close"
  | "reopen"
  | "pending"
  | "assign_user"
  | "unassign_user"
  | "assign_team"
  | "unassign_team"
  | "merge_contact"
  | "channel_added"
  | "note"
  | "label_added"
  | "label_removed"
  | "priority_changed"
  | "sla_breached";

export interface ActivityResponse {
  id: string;
  conversationId: string;
  eventType: ActivityEventType;
  actorType: "user" | "system" | "automation" | "bot";
  actor?: { id: string; name: string; avatarUrl?: string; type?: string };
  subjectUser?: { id: string; name: string; avatarUrl?: string };
  subjectTeam?: { id: string; name: string };
  metadata?: Record<string, any>;
  createdAt: string;
  description: string;
}

export type TimelineItemType = "message" | "activity";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  timestamp: string;
  message?: Message;
  activity?: ActivityResponse;
}

export type RenderItem =
  | { kind: "message"; key: string; timestamp: Date; msg: Message }
  | { kind: "activity"; key: string; timestamp: Date; act: ActivityResponse };

export interface Message {
  id: number;
  conversationId: string;
  channelId: string;
  type:
    | "reply"
    | "comment"
    | "system"
    | "event"
    | "template"
    | "call_event"
    | "status";
  text?: string;
  author?:
    | string
    | {
        id?: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
      };
  initials: string;
  time: string;
  createdAt?: string | Date;
  channel?: string;
  status?: MessageStatus;
  direction?: "incoming" | "outgoing";
  metadata?: {
    email?: {
      subject?: string;
      htmlBody?: string;
      from?: string;
      to?: string;
      cc?: string;
      messageId?: string;
      threadId?: string;
    };
    whatsapp?: {
      templateName?: string;
      headerType?: "image" | "video" | "document" | "text";
      headerUrl?: string;
      footer?: string;
      buttons?: Array<{
        type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
        text: string;
      }>;
    };
    sender?: { userId?: string };
    source?: string;
    agentId?: string;
    agentVersionId?: string;
    runId?: string;
    event?: {
      type: ConversationEventType;
      actorName?: string;
      targetName?: string;
      detail?: string;
    };
    quotedMessage?: {
      id?: string | number;
      text?: string;
      author?: string;
      attachmentType?: MediaAttachment["type"];
      attachmentUrl?: string;
    };
    error?: string;
    providerError?: string;
    lastError?: string;
  };
  attachments?: MediaAttachment[];
  messageAttachments?: MediaAttachment[];
  channelType?: string;
}

export interface ReplyContext {
  type: "chat" | "email";
  quotedMessage?: {
    id: string | number;
    text: string;
    author: string;
    attachmentType?: "image" | "video" | "audio" | "file";
    attachmentUrl?: string;
  };
  emailReply?: {
    to: string;
    subject: string;
    threadId?: string;
    messageId?: string;
    cc?: string;
  };
}
