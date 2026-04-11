// ─────────────────────────────────────────────────────────────────────────────
// WORKSPACE SETTINGS — SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkspaceInfo {
  id: string;
  name: string;
  organizationId: string;
  timezone: string;
  language: string;
  dateFormat: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl?: string;
}

export interface NotificationPrefs {
  email: boolean;
  browser: boolean;
  mobile: boolean;
  mentions: boolean;
  assignments: boolean;
  newConversations: boolean;
}

export type AvailabilityStatus = 'online' | 'busy' | 'dnd';

export interface TeamMember {
  id: string  ;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Invited';
  avatar: string;
}

export type ChannelType = 'whatsapp' | 'instagram' | 'messenger' | 'gmail' | 'email';

export interface Channel {
  id: string;
  name: string;
  identifier: string;
  status: 'Connected' | 'Error';
  icon: string;
  color: string;
  msgs: number;
  channelType?: ChannelType;
}

export interface Integration {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: string;
  connected: boolean;
  routingChannelId?: string | null;
  summary?: {
    accountName?: string;
    accountId?: string;
    accountStatus?: string;
    currency?: string;
    campaignCount?: number;
  } | null;
}

export interface WidgetConfig {
  color: string;
  position: string;
  greeting: string;
  showOnMobile: boolean;
  autoOpen: boolean;
  delay: string;
}

export interface ContactField {
  id: number;
  name: string;
  type: string;
  required: boolean;
  system: boolean;
}

export interface LifecycleStage {
  id: number;
  name: string;
  color: string;
  count: number;
}

export interface ClosingNoteTemplate {
  id: number;
  title: string;
  text: string;
}

export interface ClosingNoteSettings {
  required: boolean;
  templates: ClosingNoteTemplate[];
}

export interface Snippet {
  id: number;
  shortcut: string;
  title: string;
  content: string;
}

export interface ConversationTag {
  id: string | number;
  name: string;
  color: string;
  emoji?: string;
  description?: string | null;
  workspaceId?: string;
  spaceId?: string | number;
  createdBy?: string;
  createdById?: string | null;
  updatedById?: string | null;
  updatedAt?: string;
  bundle?: {
    color: string;
    emoji?: string;
    description?: string | null;
  };
  count: number;
}

export interface AISettings {
  enabled: boolean;
  autoSuggest: boolean;
  provider: string;
  model: string;
  defaultLanguage: string;
  tone?: string;
  language?: string;
  summarize: boolean;
  sentiment: boolean;
  translate: boolean;
  smartReply: boolean;
}

export interface AIPromptOption {
  label: string;
  value: string;
  instruction?: string;
}

export interface AIPrompt {
  id: string | number;
  key?: string | null;
  name: string;
  description?: string | null;
  kind: 'rewrite' | 'assist' | 'summarize' | string;
  prompt: string;
  options?: AIPromptOption[] | null;
  isDefault: boolean;
  isEnabled: boolean;
  isActive: boolean;
  active?: boolean;
  sortOrder: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
}

export interface CallSettings {
  enabled: boolean;
  recording: boolean;
  voicemail: boolean;
  transcription: boolean;
  holdMusic: boolean;
  callerId: string;
  maxDuration: string;
  voicemailGreeting: string;
}
