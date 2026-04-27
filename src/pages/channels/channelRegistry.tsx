import type { ComponentType } from 'react';

import { FacebookChannelSidebar } from '../workspace/channels/FacebookChannel';
import { InstagramChannelSidebar } from '../workspace/channels/InstagramChannel';
import { EmailChannelSidebar } from '../workspace/channels/EmailChannelV2';
import { WhatsAppChannelSidebar } from '../workspace/channels/WhatsAppCloudChannel';
import { WebsiteChatChannelSidebar } from '../workspace/channels/WebsiteChatChannel';

export type ChannelCatalogCategory =
  | 'business'
  | 'calls'
  | 'sms'
  | 'email'
  | 'livechat';

export interface ChannelRegistryItem {
  catalogId: string;
  connectSlug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: ChannelCatalogCategory;
  badge?: string;
  badgeColor?: string;
  SidebarContent?: ComponentType;
  videoTutorial?: string;
  additionalResources?: { label: string; href: string }[];
}

export const CHANNEL_REGISTRY: ChannelRegistryItem[] = [
  {
    catalogId: 'whatsapp-cloud',
    connectSlug: 'whatsapp_cloud',
    name: 'WhatsApp Cloud API',
    description:
      'Connect WhatsApp Cloud API and manage your messages easily in one place.',
    icon: 'https://cdn.simpleicons.org/whatsapp',
    color: 'bg-emerald-500',
    category: 'business',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    SidebarContent: WhatsAppChannelSidebar,
  },
  {
    catalogId: 'messenger',
    connectSlug: 'messenger',
    name: 'Facebook Messenger',
    description:
      "Connect Facebook Messenger to engage with your customers on the world's largest social platform.",
    icon: 'https://cdn.simpleicons.org/messenger',
    color: 'bg-blue-600',
    category: 'business',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    SidebarContent: FacebookChannelSidebar,
  },
  {
    catalogId: 'instagram',
    connectSlug: 'instagram',
    name: 'Instagram',
    description:
      'Connect Instagram to reply to private messages and build strong brand connections.',
    icon: 'https://cdn.simpleicons.org/instagram',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    category: 'business',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    SidebarContent: InstagramChannelSidebar,
  },
  {
    catalogId: 'email',
    connectSlug: 'email',
    name: 'Email (SMTP / IMAP)',
    description:
      'Connect any email provider using SMTP for sending and IMAP for receiving.',
    icon: 'https://cdn.simpleicons.org/maildotru',
    color: 'bg-indigo-500',
    category: 'email',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    SidebarContent: EmailChannelSidebar,
  },
  {
    catalogId: 'gmail',
    connectSlug: 'gmail',
    name: 'Gmail',
    description: 'Connect your Gmail or Google Workspace account.',
    icon: 'https://cdn.simpleicons.org/gmail',
    color: 'bg-red-500',
    category: 'email',
  },
  {
    catalogId: 'website_chat',
    connectSlug: 'website_chat',
    name: 'Website Chat',
    description:
      'Create and add website chat functionality on your website to engage with visitors and convert prospects into customers.',
    icon: 'https://cdn.simpleicons.org/googlechat',
    color: 'bg-blue-800',
    category: 'livechat',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    SidebarContent: WebsiteChatChannelSidebar,
  },
  {
    catalogId: 'exotel_call',
    connectSlug: 'exotel_call',
    name: 'Exotel Calling',
    description: 'Connect Exotel for inbound and outbound voice calls.',
    icon: 'https://cdn.simpleicons.org/ringcentral',
    color: 'bg-cyan-600',
    category: 'calls',
  },
  {
    catalogId: 'msg91_sms',
    connectSlug: 'msg91_sms',
    name: 'MSG91 SMS',
    description: 'Connect MSG91 for transactional and support SMS.',
    icon: 'https://cdn.simpleicons.org/androidmessages',
    color: 'bg-emerald-600',
    category: 'sms',
  },
];

export const CHANNEL_CONNECT_SLUGS: Record<string, string> = {
  whatsapp: 'whatsapp_cloud',
  'whatsapp-cloud': 'whatsapp_cloud',
  ...Object.fromEntries(
    CHANNEL_REGISTRY.map((channel) => [channel.catalogId, channel.connectSlug]),
  ),
};

export const getChannelDefinitionByConnectSlug = (slug?: string | null) =>
  slug
    ? CHANNEL_REGISTRY.find((channel) => channel.connectSlug === slug) ?? null
    : null;

export const getCatalogChannels = () => CHANNEL_REGISTRY;
