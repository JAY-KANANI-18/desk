import type { ReactNode } from 'react';

export type ChatDirection = 'incoming' | 'outgoing';
export type CallDirection = 'incoming' | 'outgoing' | 'missed';

export type Assignee =
  | { kind: 'user'; id: string; name: string; initials: string; online: boolean }
  | { kind: 'team'; id: string; name: string; color: string }
  | null;

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

export type AttachmentType = 'image' | 'audio' | 'video' | 'doc';

export type MediaAttachment = {
  type: AttachmentType;
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
};

export type Message = {
  id: number;
  conversationId: number;
  type: 'reply' | 'comment';
  text: string;
  author: string;
  initials: string;
  time: string;
  status?: MessageStatus;
  channel?: string;
  attachments?: MediaAttachment[];
};

export type Conversation = {
  id: number;
  name: string;
  message: string;
  time: string;
  unreadCount: number;
  tag: string;
  avatar: string;
  channel: string;
  direction: ChatDirection;
};

export type CallLog = {
  id: number;
  name: string;
  avatar: string;
  direction: CallDirection;
  duration: string;
  time: string;
  tag: string;
};

export type ChannelConfig = {
  icon: ReactNode;
  bg: string;
  label: string;
};

export interface Contact {
  id: number;
  conversationId: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  lifecycleStage: string;
  tags: string[];
  avatar: string;
  channel: string;
}
