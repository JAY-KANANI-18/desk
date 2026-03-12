import type { ChannelType } from '../types';
export type { ChannelType };

export interface WhatsAppConfig {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  webhookSecret: string;
}

export interface EmailConfig {
  email: string;
  smtpHost: string;
  smtpPort: string;
  imapHost: string;
  imapPort: string;
  username: string;
  password: string;
}

export interface FBAuthResponse {
  accessToken: string;
  userID: string;
  status?: string;
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

// ─── Channel Management Types ─────────────────────────────────────────────────

export interface ChannelDetails {
  id: number;
  name: string;
  type: string;
  identifier: string;
  status: 'Connected' | 'Error' | 'Disconnected';
  icon: string;
  color: string;
  msgs: number;
  connectedAt: string;
  connectedBy: { name: string; id: number };
  // WhatsApp-specific
  phoneNumberId?: string;
  wabaId?: string;
  wabaName?: string;
  verifiedName?: string;
  callbackUrl?: string;
  verifyToken?: string;
  chatLink?: string;
}

export interface ChannelUpdatePayload {
  name?: string;
  webhookSecret?: string;
}

export interface WhatsAppProfile {
  businessName: string;
  about: string;
  website: string;
  email: string;
  address: string;
  category: string;
  profilePictureUrl?: string;
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  text?: string;
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  buttons?: TemplateButton[];
}

export interface MessageTemplate {
  id: number;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  language: string;
  components: TemplateComponent[];
  createdAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  components: TemplateComponent[];
}

export interface DiagnosticResult {
  label: string;
  status: 'ok' | 'error' | 'warning';
  value: string;
  detail?: string;
}

export interface ChannelStats {
  totalMessages: number;
  messagesThisMonth: number;
  avgResponseTime: string;
  activeConversations: number;
  resolvedToday: number;
}

export interface QRCodeData {
  url: string;
  expiresAt: string;
}

export interface ProductCatalog {
  id: string;
  name: string;
  productCount: number;
  status: 'active' | 'inactive';
  connectedAt?: string;
}


// src/pages/workspace/channels/types.ts
// Shared channel-related types used across the workspace channel components.

export type ChannelType =
  | 'whatsapp'
  | 'instagram'
  | 'messenger'
  | 'email'
  | 'gmail'
  | 'website_chat';

export type ChannelStatus = 'Connected' | 'Error' | 'Disconnected';

export interface Channel {
  id: number | string;
  name: string;
  type: ChannelType | string;
  identifier: string;
  status: ChannelStatus;
  icon?: string;
  color?: string;
  msgs?: number;
  connectedAt?: string;
  config?: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface ChannelNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export interface ChannelMeta {
  label: string;
  icon: string;
  color: string;
  navItems: ChannelNavItem[];
  additionalResources: { label: string; href: string }[];
}