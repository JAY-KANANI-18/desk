import {
  Facebook,
  Globe,
  Instagram,
  Mail,
  MessageCircle,
  MessageSquareText,
  Send,
} from "lucide-react";
import type { ComponentType } from "react";

export type AvatarSize =
  | "2xs"
  | "xs"
  | "sm"
  | "base"
  | "md"
  | "lg"
  | "xl"
  | "2xl";
export type AvatarShape = "circle" | "square";
export type AvatarBadgeType =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "telegram"
  | "email"
  | "sms"
  | "web"
  | "messenger"
  | "gmail"
  | "webchat";

export const avatarMetricsBySize: Record<
  AvatarSize,
  {
    dimension: string;
    fontSize: string;
    badgeSize: string;
    badgeIconSize: number;
    statusSize: string;
    overlapOffset: string;
  }
> = {
  "2xs": {
    dimension: "1.25rem",
    fontSize: "0.625rem",
    badgeSize: "0.625rem",
    badgeIconSize: 6,
    statusSize: "0.5rem",
    overlapOffset: "-0.375rem",
  },
  xs: {
    dimension: "calc(var(--spacing-md) + var(--spacing-sm))",
    fontSize: "var(--font-size-xs)",
    badgeSize: "calc(var(--spacing-sm) + var(--spacing-xs))",
    badgeIconSize: 8,
    statusSize: "var(--spacing-sm)",
    overlapOffset: "calc(0px - var(--spacing-sm))",
  },
  sm: {
    dimension: "var(--spacing-xl)",
    fontSize: "var(--font-size-xs)",
    badgeSize: "calc(var(--spacing-sm) + var(--spacing-xs))",
    badgeIconSize: 8,
    statusSize: "var(--spacing-sm)",
    overlapOffset: "calc(0px - var(--spacing-sm))",
  },
  base: {
    dimension: "2.5rem",
    fontSize: "var(--font-size-sm)",
    badgeSize: "var(--spacing-md)",
    badgeIconSize: 10,
    statusSize: "calc(var(--spacing-sm) + var(--spacing-xs))",
    overlapOffset: "calc(0px - var(--spacing-sm))",
  },
  md: {
    dimension: "var(--spacing-2xl)",
    fontSize: "var(--font-size-sm)",
    badgeSize: "var(--spacing-md)",
    badgeIconSize: 10,
    statusSize: "calc(var(--spacing-sm) + var(--spacing-xs))",
    overlapOffset: "calc(0px - var(--spacing-sm))",
  },
  lg: {
    dimension: "calc(var(--spacing-2xl) + var(--spacing-sm))",
    fontSize: "var(--font-size-base)",
    badgeSize: "var(--spacing-md)",
    badgeIconSize: 10,
    statusSize: "calc(var(--spacing-sm) + var(--spacing-xs))",
    overlapOffset: "calc(0px - var(--spacing-md))",
  },
  xl: {
    dimension: "calc(var(--spacing-2xl) + var(--spacing-md))",
    fontSize: "var(--font-size-lg)",
    badgeSize: "calc(var(--spacing-md) + var(--spacing-xs))",
    badgeIconSize: 12,
    statusSize: "var(--spacing-md)",
    overlapOffset: "calc(0px - var(--spacing-md))",
  },
  "2xl": {
    dimension: "6rem",
    fontSize: "1.875rem",
    badgeSize: "calc(var(--spacing-lg) + var(--spacing-xs))",
    badgeIconSize: 14,
    statusSize: "calc(var(--spacing-md) + var(--spacing-xs))",
    overlapOffset: "calc(0px - var(--spacing-lg))",
  },
};

const defaultBadgeAppearance = {
  backgroundColor: "var(--color-channel-web)",
  color: "white",
  Icon: Globe,
};

const badgeAppearanceByType: Record<
  AvatarBadgeType,
  {
    backgroundColor?: string;
    backgroundImage?: string;
    color: string;
    Icon: ComponentType<{ size?: number; className?: string }>;
  }
> = {
  whatsapp: {
    backgroundColor: "var(--color-channel-whatsapp)",
    color: "white",
    Icon: MessageCircle,
  },
  instagram: {
    backgroundImage: "var(--surface-channel-instagram)",
    color: "white",
    Icon: Instagram,
  },
  facebook: {
    backgroundColor: "var(--color-channel-facebook)",
    color: "white",
    Icon: Facebook,
  },
  telegram: {
    backgroundColor: "var(--color-channel-telegram)",
    color: "white",
    Icon: Send,
  },
  email: {
    backgroundColor: "var(--color-channel-email)",
    color: "white",
    Icon: Mail,
  },
  sms: {
    backgroundColor: "var(--color-channel-sms)",
    color: "white",
    Icon: MessageSquareText,
  },
  web: {
    backgroundColor: "var(--color-channel-web)",
    color: "white",
    Icon: Globe,
  },
  messenger: {
    backgroundColor: "var(--color-channel-messenger)",
    color: "white",
    Icon: MessageCircle,
  },
  gmail: {
    backgroundColor: "var(--color-channel-gmail)",
    color: "white",
    Icon: Mail,
  },
  webchat: {
    backgroundColor: "var(--color-channel-web)",
    color: "white",
    Icon: Globe,
  },
};

export function getAvatarInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

export function getAvatarShapeRadius(shape: AvatarShape = "circle") {
  return shape === "square" ? "var(--radius-md)" : "var(--radius-full)";
}

export function getAvatarStatusPositionStyle() {
  return {
    insetInlineEnd: 0,
    insetBlockEnd: 0,
  };
}

export function getAvatarStatusColor(statusColor?: string) {
  return statusColor || "var(--color-success)";
}

export function getAvatarBadgeAppearance(type: AvatarBadgeType) {
  return badgeAppearanceByType[type] ?? defaultBadgeAppearance;
}
