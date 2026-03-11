import type { ReactNode } from 'react';
import { User } from '../../context/AuthContext';

export type ChatDirection = 'incoming' | 'outgoing';
export type CallDirection = 'incoming' | 'outgoing' | 'missed';

export type Assignee = User
  // | { kind: 'user'; id: string; firstName: string;  lastName:string; initials: string; online: boolean,activityStatus: string }
  // | { kind: 'team'; id: string; name: string; color: string }
  // | null;

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

export type AttachmentType = 'image' | 'audio' | 'video' | 'doc';

export type MediaAttachment = {
  type: AttachmentType;
  filename: string;
  url: string;
  mimeType?: string;
  size?: number;
};

export type Message = {
  id: number;
  conversationId?: number;
  type: 'reply' | 'comment';
  text: string;
  author: string;
  initials: string;
  time: string;
  status?: MessageStatus;
  direction?: ChatDirection;
  channel?: string;
  attachments?: MediaAttachment[];
};



export type Conversation = {
  id: number;

  lastMessage: Message;
  time: string;
  unreadCount: number;
  tag: string;
  channel: any;
  contact: Contact;
};

export type CallLog = {
  id: number;
  contact: Contact;
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
  conversationId?: number;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  company: string;
  lifecycleStage: string;
  tags: string[];
  avatarUrl: string;
  channel: string;
  assigneeId: string | null;
  status: 'open' | 'closed';
}
