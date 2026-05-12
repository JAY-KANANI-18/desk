import type { AvatarBadgeType } from "../../components/ui/Avatar";
import {
  getAvatarBadgeTypeForChannel,
  getContactIdentifierFieldForChannel,
} from "../../config/channelMetadata";

export type ChannelLike = {
  id?: string | number | null;
  type?: string | null;
};

export type ContactChannelLike = {
  channelId?: string | number | null;
  channelType?: string | null;
  identifier?: string | null;
  messageWindowExpiry?: string | number | null;
  source?: string | null;
};

export type ContactIdentityLike = {
  email?: string | null;
  phone?: string | null;
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
  contact?: ContactIdentityLike | null,
) {
  if (!channel) return null;
  const matchedContactChannel = Array.isArray(contactChannels)
    ? contactChannels.find((contactChannel) => matchesContactChannel(contactChannel, channel))
    : null;
  return matchedContactChannel ?? buildContactFieldChannel(channel, contact);
}

export function getContactScopedChannels<T extends ChannelLike>(
  channels: T[] | null | undefined,
  contactChannels: ContactChannelLike[] | null | undefined,
  contact?: ContactIdentityLike | null,
) {
  if (!Array.isArray(channels)) {
    return [] as T[];
  }

  const seen = new Set<string>();

  return channels.filter((channel) => {
    const hasContactChannel = Array.isArray(contactChannels)
      ? contactChannels.some((contactChannel) => matchesContactChannel(contactChannel, channel))
      : false;
    const hasContactFieldIdentifier = Boolean(getContactFieldIdentifier(channel, contact));

    if (!hasContactChannel && !hasContactFieldIdentifier) {
      return false;
    }

    const key = normalizeValue(channel.id) || normalizeType(channel.type);
    if (seen.has(key)) return false;
    seen.add(key);  
    return true;
  });
}

function getContactFieldIdentifier(
  channel: ChannelLike | null | undefined,
  contact: ContactIdentityLike | null | undefined,
) {
  const field = getContactIdentifierFieldForChannel(channel?.type);
  const identifier = field ? contact?.[field] : null;
  return identifier?.trim() || null;
}

function buildContactFieldChannel(
  channel: ChannelLike,
  contact: ContactIdentityLike | null | undefined,
): ContactChannelLike | null {
  const identifier = getContactFieldIdentifier(channel, contact);
  if (!identifier) return null;

  return {
    channelId: channel.id,
    channelType: channel.type,
    identifier,
    source: 'contact_field',
  };
}

export function getChannelBadgeType(channelType?: string | null): AvatarBadgeType {
  return getAvatarBadgeTypeForChannel(channelType);
}
