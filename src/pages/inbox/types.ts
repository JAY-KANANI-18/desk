import { User } from '../../context/AuthContext';

export type ChatDirection = 'incoming' | 'outgoing';
export type CallDirection = 'incoming' | 'outgoing' | 'missed';

export type Assignee = User
  // | { kind: 'user'; id: string; firstName: string;  lastName:string; initials: string; online: boolean,activityStatus: string }
  // | { kind: 'team'; id: string; name: string; color: string }
  // | null;

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

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
  // For message search results
  template?:any
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
  icon: string;
  bg: string;
  label: string;
};

export interface Contact {
  id: number | string;
  conversationId?: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  lifecycleStage?: string;
  lifecycleId?: string | number | null;
  tags?: string[];
  avatarUrl?: string;
  channel?: string;
  identifier?: string;
  assigneeId: string | null;
  status: 'open' | 'closed' | 'merged' | string;
  contactChannels?: Array<{
    id: string;
    channelId: string;
    channelType: string;
    identifier: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
    lastMessageTime?: string | number | null;
    lastIncomingMessageTime?: string | number | null;
    lastCallInteractionTime?: string | number | null;
    messageWindowExpiry?: string | number | null;
    conversationWindowCategory?: {
      authentication?: number | null;
      marketing?: number | null;
      utility?: number | null;
      service?: number | null;
      referral_conversion?: number | null;
    } | null;
    call_permission?: boolean | null;
    hasPermanentCallPermission?: boolean;
  }>;
  mergedIntoContactId?: string | null;
  mergedIntoContact?: Partial<Contact> | null;
  marketingOptOut?: boolean;
  duplicateSummary?: {
    total: number;
    suggestions: any[];
  };
}
