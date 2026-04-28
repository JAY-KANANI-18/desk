import type { CSSProperties, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Tooltip } from "../ui/tooltip";

export type ChannelBadgeKey =
  | "whatsapp"
  | "instagram"
  | "messenger"
  | "gmail"
  | "webchat";

export interface ChannelBadgeMeta {
  icon: string;
  label: string;
  glow: string;
  shadow: string;
  connectSlug: string;
}

export const CHANNEL_BADGE_META: Record<ChannelBadgeKey, ChannelBadgeMeta> = {
  whatsapp: {
    icon: "https://cdn.simpleicons.org/whatsapp/25D366",
    label: "WhatsApp",
    glow: "from-[#25d366] to-[#128c7e]",
    shadow: "rgba(37,211,102,0.45)",
    connectSlug: "whatsapp_cloud",
  },
  instagram: {
    icon: "https://cdn.simpleicons.org/instagram/E1306C",
    label: "Instagram",
    glow: "from-[#f09433] via-[#dc2743] to-[#bc1888]",
    shadow: "rgba(220,39,67,0.45)",
    connectSlug: "instagram",
  },
  messenger: {
    icon: "https://cdn.simpleicons.org/messenger/0084FF",
    label: "Messenger",
    glow: "from-[#0084ff] to-[#00b2ff]",
    shadow: "rgba(0,132,255,0.45)",
    connectSlug: "messenger",
  },
  gmail: {
    icon: "https://cdn.simpleicons.org/gmail/EA4335",
    label: "Email",
    glow: "from-[#EA4335] to-[#FBBC05]",
    shadow: "rgba(234,67,53,0.45)",
    connectSlug: "gmail",
  },
  webchat: {
    icon: "https://cdn.simpleicons.org/googlechat/00BCD4",
    label: "Website Chat",
    glow: "from-[#00bcd4] to-[#0097a7]",
    shadow: "rgba(0,188,212,0.45)",
    connectSlug: "website_chat",
  },
};

export const CHANNEL_BADGE_KEYS = Object.keys(
  CHANNEL_BADGE_META,
) as ChannelBadgeKey[];

const CHANNEL_BADGE_ALIASES: Record<string, ChannelBadgeKey> = {
  "whatsapp-cloud": "whatsapp",
  whatsapp_cloud: "whatsapp",
  facebook: "messenger",
  website_chat: "webchat",
  website_chat_widget: "webchat",
};

type ChannelBadgeSize = "sm" | "md";

const CHANNEL_BADGE_SIZE_CLASSES: Record<
  ChannelBadgeSize,
  { badge: string; icon: string }
> = {
  sm: {
    badge: "h-7 w-7",
    icon: "h-3.5 w-3.5",
  },
  md: {
    badge: "h-8 w-8",
    icon: "h-4 w-4",
  },
};

export function getChannelBadgeMeta(channelKey: string) {
  const normalizedKey =
    CHANNEL_BADGE_ALIASES[channelKey] ?? (channelKey as ChannelBadgeKey);

  return CHANNEL_BADGE_META[normalizedKey] ?? null;
}

export function getChannelConnectPath(channelKey: string) {
  const meta = getChannelBadgeMeta(channelKey);

  return meta ? `/channels/connect/${meta.connectSlug}` : null;
}

interface ChannelBadgeProps {
  channelKey: string;
  linked?: boolean;
  className?: string;
  size?: ChannelBadgeSize;
}

export function ChannelBadge({
  channelKey,
  linked = false,
  className = "",
  size = "md",
}: ChannelBadgeProps) {
  const meta = getChannelBadgeMeta(channelKey);
  const connectPath = getChannelConnectPath(channelKey);

  if (!meta) return null;

  const sizeClasses = CHANNEL_BADGE_SIZE_CLASSES[size];
  const isLinked = linked && Boolean(connectPath);
  const rootClassName = [
    "group relative flex flex-col items-center gap-2.5 rounded-full no-underline outline-none",
    "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
    isLinked ? "cursor-pointer" : "cursor-default",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const defaultShadow = "0 4px 20px rgba(0,0,0,0.22)";
  const hoverShadow = `0 12px 32px ${meta.shadow}, 0 0 0 4px rgba(255,255,255,0.04)`;

  const updateShadow = (event: MouseEvent<HTMLElement>, shadow: string) => {
    event.currentTarget.style.boxShadow = shadow;
  };

  const badge = (
    <span
      className={[
        "relative flex items-center justify-center rounded-full border border-white/80 bg-white",
        "transition-all duration-200 ease-out group-hover:-translate-y-1.5 group-hover:scale-110",
        sizeClasses.badge,
      ].join(" ")}
      style={{ boxShadow: defaultShadow } as CSSProperties}
      onMouseEnter={(event) => updateShadow(event, hoverShadow)}
      onMouseLeave={(event) => updateShadow(event, defaultShadow)}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${meta.glow} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
        style={{
          padding: "1.5px",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <img
        src={meta.icon}
        alt={isLinked ? "" : meta.label}
        className={[
          "object-contain transition-all duration-200 group-hover:brightness-110 group-hover:drop-shadow-lg",
          sizeClasses.icon,
        ].join(" ")}
      />
    </span>
  );

  if (isLinked && connectPath) {
    return (
      <Tooltip content={meta.label} position="top">
      <Link
        to={connectPath}
        aria-label={`Connect ${meta.label}`}
        className={rootClassName}
      >
        {badge}
      </Link>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={meta.label} position="top">
      <span className={rootClassName}>{badge}</span>
    </Tooltip>
  );
}

interface ChannelBadgeStackProps {
  channelKeys?: readonly string[];
  linked?: boolean;
  className?: string;
  badgeClassName?: string;
  size?: ChannelBadgeSize;
}

export function ChannelBadgeStack({
  channelKeys = CHANNEL_BADGE_KEYS,
  linked = false,
  className = "",
  badgeClassName = "",
  size = "md",
}: ChannelBadgeStackProps) {
  return (
    <div
      className={[
        "flex flex-wrap items-center justify-center -space-x-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {channelKeys.map((channelKey) => (
        <ChannelBadge
          key={channelKey}
          channelKey={channelKey}
          // linked={linked}
          className={badgeClassName}
          size={size}
        />
      ))}
    </div>
  );
}
