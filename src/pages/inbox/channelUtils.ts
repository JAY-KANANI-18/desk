import type { AvatarBadgeType } from "../../components/ui/Avatar";

export type ChannelLike = {
  id?: string | number | null;
  type?: string | null;
};

export type ContactChannelLike = {
  channelId?: string | number | null;
  channelType?: string | null;
  identifier?: string | null;
  messageWindowExpiry?: string | number | null;
};

const CHANNEL_BADGE_TYPES: Record<string, AvatarBadgeType> = {
  whatsapp: "whatsapp",
  instagram: "instagram",
  facebook: "facebook",
  messenger: "messenger",
  telegram: "telegram",
  email: "email",
  gmail: "gmail",
  sms: "sms",
  web: "web",
  webchat: "webchat",
  website_chat: "webchat",
};

function normalizeValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? '' : String(value);
}

function normalizeType(value: string | number | null | undefined) {
  return normalizeValue(value).toLowerCase();
}

export function matchesContactChannel(
  contactChannel: ContactChannelLike | null | undefined,
  channel: ChannelLike | null | undefined,
) {
  if (!contactChannel || !channel) return false;

  const contactChannelId = normalizeValue(contactChannel.channelId);
  const channelId = normalizeValue(channel.id);
  if (contactChannelId && channelId) return contactChannelId === channelId;

  const contactChannelType = normalizeType(contactChannel.channelType);
  const channelType = normalizeType(channel.type);
  return Boolean(contactChannelType) && contactChannelType === channelType;
}

export function isSameChannel(
  firstChannel: ChannelLike | null | undefined,
  secondChannel: ChannelLike | null | undefined,
) {
  if (!firstChannel || !secondChannel) return false;

  const firstId = normalizeValue(firstChannel.id);
  const secondId = normalizeValue(secondChannel.id);
  if (firstId && secondId) return firstId === secondId;

  const firstType = normalizeType(firstChannel.type);
  const secondType = normalizeType(secondChannel.type);
  return Boolean(firstType) && firstType === secondType;
}

export function findMatchingContactChannel<T extends ContactChannelLike>(
  contactChannels: T[] | null | undefined,
  channel: ChannelLike | null | undefined,
) {
  if (!Array.isArray(contactChannels) || !channel) return null;
  return contactChannels.find((contactChannel) => matchesContactChannel(contactChannel, channel)) ?? null;
}

export function getContactScopedChannels<T extends ChannelLike>(
  channels: T[] | null | undefined,
  contactChannels: ContactChannelLike[] | null | undefined,
) {
  if (!Array.isArray(channels) || !Array.isArray(contactChannels) || contactChannels.length === 0) {
    return [] as T[];
  }

  const seen = new Set<string>();

  return channels.filter((channel) => {
    if (!contactChannels.some((contactChannel) => matchesContactChannel(contactChannel, channel))) {
      return false;
    }

    const key = normalizeValue(channel.id) || normalizeType(channel.type);
    if (seen.has(key)) return false;
    seen.add(key);  
    return true;
  });
}

export function getChannelBadgeType(channelType?: string | null): AvatarBadgeType {
  return CHANNEL_BADGE_TYPES[channelType ?? ""] ?? "web";
}
