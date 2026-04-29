import type { ComponentType } from 'react';

import { FacebookChannelSidebar } from '../workspace/channels/FacebookChannel';
import { InstagramChannelSidebar } from '../workspace/channels/InstagramChannel';
import { EmailChannelSidebar } from '../workspace/channels/EmailChannelV2';
import { WhatsAppChannelSidebar } from '../workspace/channels/WhatsAppCloudChannel';
import { WebsiteChatChannelSidebar } from '../workspace/channels/WebsiteChatChannel';
import {
  CHANNEL_CATALOG_ITEMS,
  CHANNEL_CONNECT_SLUGS,
  getChannelDefinitionByConnectSlug as getSharedChannelDefinitionByConnectSlug,
  type ChannelCatalogCategory,
  type ChannelCatalogItem,
  type ChannelKey,
} from '../../config/channelMetadata';

export type { ChannelCatalogCategory };

export interface ChannelRegistryItem extends ChannelCatalogItem {
  badge?: string;
  badgeColor?: string;
  SidebarContent?: ComponentType;
  videoTutorial?: string;
  additionalResources?: { label: string; href: string }[];
}

const SIDEBAR_CONTENT_BY_CHANNEL: Partial<Record<ChannelKey, ComponentType>> = {
  whatsapp: WhatsAppChannelSidebar,
  messenger: FacebookChannelSidebar,
  instagram: InstagramChannelSidebar,
  email: EmailChannelSidebar,
  webchat: WebsiteChatChannelSidebar,
};

export const CHANNEL_REGISTRY: ChannelRegistryItem[] = CHANNEL_CATALOG_ITEMS.map(
  (channel) => ({
    ...channel,
    SidebarContent: SIDEBAR_CONTENT_BY_CHANNEL[channel.key],
  }),
);

export const getChannelDefinitionByConnectSlug = (slug?: string | null) =>
  slug
    ? CHANNEL_REGISTRY.find(
        (channel) =>
          channel.connectSlug ===
          getSharedChannelDefinitionByConnectSlug(slug)?.connectSlug,
      ) ?? null
    : null;

export const getCatalogChannels = () => CHANNEL_REGISTRY;

export { CHANNEL_CONNECT_SLUGS };
