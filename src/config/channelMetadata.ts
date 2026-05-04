import type { AvatarBadgeType } from "../components/ui/Avatar";

export type ChannelCatalogCategory =
  | "business"
  | "calls"
  | "sms"
  | "email"
  | "livechat";

export type ChannelKey =
  | "whatsapp"
  | "messenger"
  | "instagram"
  | "email"
  | "gmail"
  | "webchat"
  | "sms"
  | "exotel_call"
  | "meta_ads"
  | "facebook"
  | "twitter";

export type ManageChannelNavIconKey =
  | "settings"
  | "fileText"
  | "messageCircle"
  | "menu"
  | "wrench";

export type OnboardingChannelIconKey =
  | "messageCircleMore"
  | "instagram"
  | "mail"
  | "globe"
  | "facebook";

export interface ChannelResourceLink {
  label: string;
  href: string;
}

export interface ManageChannelNavItemDefinition {
  id: string;
  label: string;
  icon: ManageChannelNavIconKey;
  badge?: string;
}

export interface ChannelOnboardingDefinition {
  value: string;
  label: string;
  description: string;
  iconKey: OnboardingChannelIconKey;
  iconUrl: string;
}

export interface ChannelMetadata {
  key: ChannelKey;
  aliases?: string[];
  label: string;
  selectLabel?: string;
  inboxLabel?: string;
  contactLabel?: string;
  catalogName?: string;
  manageLabel?: string;
  description?: string;
  simpleIconSlug: string;
  icon: string;
  coloredIcon?: string;
  color?: string;
  catalogColor?: string;
  category?: ChannelCatalogCategory;
  catalogId?: string;
  connectSlug?: string;
  badge?: string;
  badgeColor?: string;
  badgeGlow?: string;
  badgeShadow?: string;
  avatarBadgeType: AvatarBadgeType;
  manageNavItems?: ManageChannelNavItemDefinition[];
  additionalResources?: ChannelResourceLink[];
  onboarding?: ChannelOnboardingDefinition;
}

export interface ChannelCatalogItem {
  key: ChannelKey;
  catalogId: string;
  connectSlug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: ChannelCatalogCategory;
  badge?: string;
  badgeColor?: string;
  videoTutorial?: string;
  additionalResources?: ChannelResourceLink[];
}

const simpleIconUrl = (slug: string, color?: string) =>
  color
    ? `https://cdn.simpleicons.org/${slug}/${color}`
    : `https://cdn.simpleicons.org/${slug}`;

const helpCenterResource: ChannelResourceLink = {
  label: "Help Center",
  href: "#",
};

export const CHANNEL_METADATA: ChannelMetadata[] = [
  {
    key: "whatsapp",
    aliases: ["whatsapp_cloud", "whatsapp-cloud"],
    label: "WhatsApp",
    catalogName: "WhatsApp Cloud API",
    manageLabel: "WhatsApp Cloud API",
    description:
      "Connect WhatsApp Cloud API and manage your messages easily in one place.",
    simpleIconSlug: "whatsapp",
    icon: simpleIconUrl("whatsapp"),
    coloredIcon: simpleIconUrl("whatsapp", "25D366"),
    color: "bg-green-500",
    catalogColor: "bg-emerald-500",
    category: "business",
    catalogId: "whatsapp-cloud",
    connectSlug: "whatsapp_cloud",
    // badge: "Popular",
    badgeColor: "bg-green-100 text-green-700",
    badgeGlow: "from-[#25d366] to-[#128c7e]",
    badgeShadow: "rgba(37,211,102,0.45)",
    avatarBadgeType: "whatsapp",
    manageNavItems: [
      { id: "configuration", label: "Configuration", icon: "settings" },
      { id: "templates", label: "Templates", icon: "fileText" },
    ],
    additionalResources: [
      {
        label: "WhatsApp Cloud API docs",
        href: "https://developers.facebook.com/docs/whatsapp",
      },
      {
        label: "Template guidelines",
        href: "https://developers.facebook.com/docs/whatsapp/message-templates",
      },
      helpCenterResource,
    ],
    onboarding: {
      value: "whatsapp",
      label: "WhatsApp",
      description: "Handle the conversations your customers expect first.",
      iconKey: "messageCircleMore",
      iconUrl: simpleIconUrl("whatsapp", "25D366"),
    },
  },
  {
    key: "messenger",
    aliases: ["facebook_messenger"],
    label: "Messenger",
    catalogName: "Facebook Messenger",
    manageLabel: "Facebook Messenger",
    description:
      "Connect Facebook Messenger to engage with your customers on the world's largest social platform.",
    simpleIconSlug: "messenger",
    icon: simpleIconUrl("messenger"),
    coloredIcon: simpleIconUrl("messenger", "0084FF"),
    color: "bg-blue-600",
    catalogColor: "bg-blue-600",
    category: "business",
    catalogId: "messenger",
    connectSlug: "messenger",
    // badge: "Popular",
    badgeColor: "bg-green-100 text-green-700",
    badgeGlow: "from-[#0084ff] to-[#00b2ff]",
    badgeShadow: "rgba(0,132,255,0.45)",
    avatarBadgeType: "messenger",
    manageNavItems: [
      { id: "configuration", label: "Configuration", icon: "settings" },
      { id: "templates", label: "Templates", icon: "fileText" },
      {
        id: "private_replies",
        label: "Private Replies",
        icon: "messageCircle",
      },
      { id: "chat_menu", label: "Chat Menu", icon: "menu" },
    ],
    additionalResources: [
      {
        label: "Messenger Platform docs",
        href: "https://developers.facebook.com/docs/messenger-platform",
      },
      { label: "About Private Replies", href: "#" },
      helpCenterResource,
    ],
  },
  {
    key: "instagram",
    label: "Instagram",
    description:
      "Connect Instagram to reply to private messages and build strong brand connections.",
    simpleIconSlug: "instagram",
    icon: simpleIconUrl("instagram"),
    coloredIcon: simpleIconUrl("instagram", "E1306C"),
    color: "bg-pink-500",
    catalogColor: "bg-gradient-to-br from-[var(--color-primary)] to-pink-500",
    category: "business",
    catalogId: "instagram",
    connectSlug: "instagram",
    // badge: "Popular",
    badgeColor: "bg-green-100 text-green-700",
    badgeGlow: "from-[#f09433] via-[#dc2743] to-[#bc1888]",
    badgeShadow: "rgba(220,39,67,0.45)",
    avatarBadgeType: "instagram",
    manageNavItems: [
      { id: "configuration", label: "Configuration", icon: "settings" },
      {
        id: "icebreakers",
        label: "Ice-Breakers",
        icon: "messageCircle",
        badge: "New",
      },
      {
        id: "private_replies",
        label: "Private Replies",
        icon: "messageCircle",
      },
      {
        id: "story_replies",
        label: "Story Replies",
        icon: "messageCircle",
      },
    ],
    additionalResources: [
      {
        label: "Instagram Messaging API docs",
        href: "https://developers.facebook.com/docs/instagram-api/guides/business-messaging",
      },
      helpCenterResource,
    ],
    onboarding: {
      value: "instagram",
      label: "Instagram",
      description: "Capture DMs, stories, and social leads in one place.",
      iconKey: "instagram",
      iconUrl: simpleIconUrl("instagram", "E4405F"),
    },
  },
  {
    key: "email",
    label: "Email",
    catalogName: "Email (SMTP)",
    manageLabel: "Email (SMTP)",
    description:
      "Connect any email provider using SMTP for sending and forwarding for receiving.",
    simpleIconSlug: "maildotru",
    icon: simpleIconUrl("maildotru"),
    color: "bg-blue-500",
    catalogColor: "bg-[var(--color-primary)]",
    category: "email",
    catalogId: "email",
    connectSlug: "email",
    // badge: "Popular",
    badgeColor: "bg-green-100 text-green-700",
    avatarBadgeType: "email",
    manageNavItems: [
      { id: "configuration", label: "Configuration", icon: "settings" },
      { id: "troubleshoot", label: "Troubleshoot", icon: "wrench" },
    ],
    additionalResources: [
      { label: "Email channel setup guide", href: "#" },
      helpCenterResource,
    ],
    onboarding: {
      value: "email",
      label: "Email",
      description: "Keep slower, higher-context threads alongside chat.",
      iconKey: "mail",
      iconUrl: simpleIconUrl("gmail", "EA4335"),
    },
  },
  
  {
    key: "webchat",
    aliases: ["website_chat", "website_chat_widget", "website-chat", "website"],
    label: "Website Chat",
    contactLabel: "Web Chat",
    catalogName: "Website Chat",
    description:
      "Create and add website chat functionality on your website to engage with visitors and convert prospects into customers.",
    simpleIconSlug: "googlechat",
    icon: simpleIconUrl("googlechat"),
    coloredIcon: simpleIconUrl("googlechat", "00BCD4"),
    color: "bg-[var(--color-primary)]",
    catalogColor: "bg-blue-800",
    category: "livechat",
    catalogId: "website_chat",
    connectSlug: "website_chat",
    // badge: "Popular",
    badgeColor: "bg-green-100 text-green-700",
    badgeGlow: "from-[#00bcd4] to-[#0097a7]",
    badgeShadow: "rgba(0,188,212,0.45)",
    avatarBadgeType: "webchat",
    manageNavItems: [
      { id: "configuration", label: "Configuration", icon: "settings" },
      { id: "troubleshoot", label: "Troubleshoot", icon: "wrench" },
    ],
    additionalResources: [
      { label: "Install on WordPress", href: "#" },
      { label: "Install on Shopify", href: "#" },
      { label: "Install on Wix", href: "#" },
    ],
    onboarding: {
      value: "website-chat",
      label: "Website Chat",
      description: "Convert visitors the moment they land on your site.",
      iconKey: "globe",
      iconUrl: simpleIconUrl("livechat", "FF5100"),
    },
  },
  // {
  //   key: "gmail",
  //   label: "Gmail",
  //   catalogName: "Gmail",
  //   description: "Connect your Gmail or Google Workspace account.",
  //   simpleIconSlug: "gmail",
  //   icon: simpleIconUrl("gmail"),
  //   coloredIcon: simpleIconUrl("gmail", "EA4335"),
  //   color: "bg-red-500",
  //   catalogColor: "bg-red-500",
  //   category: "email",
  //   catalogId: "gmail",
  //   connectSlug: "gmail",
  //   badgeGlow: "from-[#EA4335] to-[#FBBC05]",
  //   badgeShadow: "rgba(234,67,53,0.45)",
  //   avatarBadgeType: "gmail",
  //   manageNavItems: [
  //     { id: "configuration", label: "Configuration", icon: "settings" },
  //     { id: "troubleshoot", label: "Troubleshoot", icon: "wrench" },
  //   ],
  //   additionalResources: [
  //     { label: "Gmail channel setup guide", href: "#" },
  //     helpCenterResource,
  //   ],
  // },
  // {
  //   key: "sms",
  //   aliases: ["msg91_sms"],
  //   label: "SMS",
  //   catalogName: "MSG91 SMS",
  //   manageLabel: "MSG91 SMS",
  //   description: "Connect MSG91 for transactional and support SMS.",
  //   simpleIconSlug: "androidmessages",
  //   icon: simpleIconUrl("androidmessages"),
  //   color: "bg-emerald-600",
  //   catalogColor: "bg-emerald-600",
  //   category: "sms",
  //   catalogId: "msg91_sms",
  //   connectSlug: "msg91_sms",
  //   avatarBadgeType: "sms",
  //   manageNavItems: [
  //     { id: "configuration", label: "Configuration", icon: "settings" },
  //     { id: "troubleshoot", label: "Troubleshoot", icon: "wrench" },
  //   ],
  //   additionalResources: [{ label: "MSG91 Docs", href: "https://msg91.com/help" }],
  // },
  // {
  //   key: "exotel_call",
  //   label: "Voice Call",
  //   catalogName: "Exotel Calling",
  //   manageLabel: "Exotel Calling",
  //   description: "Connect Exotel for inbound and outbound voice calls.",
  //   simpleIconSlug: "ringcentral",
  //   icon: simpleIconUrl("ringcentral"),
  //   color: "bg-cyan-600",
  //   catalogColor: "bg-cyan-600",
  //   category: "calls",
  //   catalogId: "exotel_call",
  //   connectSlug: "exotel_call",
  //   avatarBadgeType: "web",
  //   manageNavItems: [
  //     { id: "configuration", label: "Configuration", icon: "settings" },
  //     { id: "troubleshoot", label: "Troubleshoot", icon: "wrench" },
  //   ],
  //   additionalResources: [
  //     { label: "Exotel Docs", href: "https://developer.exotel.com/" },
  //   ],
  // },
  // {
  //   key: "meta_ads",
  //   label: "Meta Ads",
  //   simpleIconSlug: "meta",
  //   icon: simpleIconUrl("meta"),
  //   color: "bg-blue-700",
  //   avatarBadgeType: "facebook",
  // },
  // {
  //   key: "facebook",
  //   label: "Facebook",
  //   simpleIconSlug: "meta",
  //   icon: simpleIconUrl("meta"),
  //   coloredIcon: simpleIconUrl("facebook", "1877F2"),
  //   avatarBadgeType: "facebook",
  //   onboarding: {
  //     value: "facebook",
  //     label: "Facebook",
  //     description: "Support your page audience without tab-switching.",
  //     iconKey: "facebook",
  //     iconUrl: simpleIconUrl("facebook", "1877F2"),
  //   },
  // },
  // {
  //   key: "twitter",
  //   label: "X",
  //   simpleIconSlug: "x",
  //   icon: simpleIconUrl("x"),
  //   avatarBadgeType: "web",
  // },
];

export const CHANNEL_METADATA_BY_KEY: Record<string, ChannelMetadata> =
  Object.fromEntries(CHANNEL_METADATA.map((channel) => [channel.key, channel]));

export const CHANNEL_ALIAS_TO_KEY = CHANNEL_METADATA.reduce<
  Record<string, ChannelKey>
>((aliases, channel) => {
  aliases[channel.key] = channel.key;
  channel.aliases?.forEach((alias) => {
    aliases[alias] = channel.key;
  });
  return aliases;
}, {});

export function normalizeChannelKey(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined
    ? ""
    : String(value).toLowerCase().trim();

  return CHANNEL_ALIAS_TO_KEY[normalized] ?? normalized;
}

export function getChannelMetadata(value: string | number | null | undefined) {
  const key = normalizeChannelKey(value);
  return CHANNEL_METADATA_BY_KEY[key] ?? null;
}

export function getChannelIconUrl(
  value: string | number | null | undefined,
  color?: string,
) {
  const metadata = getChannelMetadata(value);
  if (!metadata) return undefined;
  return color ? simpleIconUrl(metadata.simpleIconSlug, color) : metadata.icon;
}

function isCatalogChannel(
  channel: ChannelMetadata,
): channel is ChannelMetadata & {
  catalogId: string;
  connectSlug: string;
  category: ChannelCatalogCategory;
  description: string;
} {
  return Boolean(
    channel.catalogId &&
      channel.connectSlug &&
      channel.category &&
      channel.description,
  );
}

export const CHANNEL_CATALOG_ITEMS: ChannelCatalogItem[] = CHANNEL_METADATA
  .filter(isCatalogChannel)
  .map((channel) => ({
    key: channel.key,
    catalogId: channel.catalogId,
    connectSlug: channel.connectSlug,
    name: channel.catalogName ?? channel.label,
    description: channel.description,
    icon: channel.icon,
    color: channel.catalogColor ?? channel.color ?? "bg-[var(--color-primary)]",
    category: channel.category,
    badge: channel.badge,
    badgeColor: channel.badgeColor,
    additionalResources: channel.additionalResources,
  }));

export const CHANNEL_CONNECT_SLUGS = CHANNEL_METADATA.reduce<
  Record<string, string>
>((slugs, channel) => {
  if (!channel.connectSlug) return slugs;

  slugs[channel.key] = channel.connectSlug;
  slugs[channel.connectSlug] = channel.connectSlug;

  if (channel.catalogId) {
    slugs[channel.catalogId] = channel.connectSlug;
  }

  channel.aliases?.forEach((alias) => {
    slugs[alias] = channel.connectSlug;
  });

  return slugs;
}, {});

export function getChannelDefinitionByConnectSlug(slug?: string | null) {
  if (!slug) return null;
  const normalizedSlug = String(slug).toLowerCase().trim();
  const connectSlug = CHANNEL_CONNECT_SLUGS[normalizedSlug] ?? normalizedSlug;

  return (
    CHANNEL_CATALOG_ITEMS.find(
      (channel) => channel.connectSlug === connectSlug,
    ) ?? null
  );
}

type ChannelDisplayConfig = {
  icon: string;
  bg: string;
  label: string;
};

export const CHANNEL_DISPLAY_CONFIG = CHANNEL_METADATA.reduce<
  Record<string, ChannelDisplayConfig>
>((config, channel) => {
  if (!channel.color) return config;

  const entry = {
    icon: channel.icon,
    bg: channel.color,
    label: channel.inboxLabel ?? channel.label,
  };

  config[channel.key] = entry;
  channel.aliases?.forEach((alias) => {
    config[alias] = entry;
  });

  return config;
}, {});

export const CHANNEL_SELECT_META = CHANNEL_METADATA.reduce<
  Record<string, { icon: string; label: string }>
>((config, channel) => {
  const entry = {
    icon: channel.icon,
    label: channel.selectLabel ?? channel.label,
  };

  config[channel.key] = entry;
  channel.aliases?.forEach((alias) => {
    config[alias] = entry;
  });

  return config;
}, {});

export const CONTACT_CHANNEL_META = CHANNEL_METADATA.reduce<
  Record<string, { icon: string; label: string }>
>((config, channel) => {
  const entry = {
    icon: channel.icon,
    label: channel.contactLabel ?? channel.label,
  };

  config[channel.key] = entry;
  channel.aliases?.forEach((alias) => {
    config[alias] = entry;
  });

  return config;
}, {});

export type ChannelBadgeKey =
  | "whatsapp"
  | "instagram"
  | "messenger"
  | "gmail"
  | "webchat";

export interface ChannelBadgeMetadata {
  icon: string;
  label: string;
  glow: string;
  shadow: string;
  connectSlug: string;
}

const CHANNEL_BADGE_CHANNEL_KEYS: ChannelBadgeKey[] = [
  "whatsapp",
  "instagram",
  "messenger",
  "gmail",
  "webchat",
];

export const CHANNEL_BADGE_META = CHANNEL_BADGE_CHANNEL_KEYS.reduce<
  Record<ChannelBadgeKey, ChannelBadgeMetadata>
>((config, key) => {
  const channel = CHANNEL_METADATA_BY_KEY[key];
  if (!channel?.connectSlug || !channel.badgeGlow || !channel.badgeShadow) {
    return config;
  }

  config[key] = {
    icon: channel.coloredIcon ?? channel.icon,
    label: key === "gmail" ? "Email" : channel.label,
    glow: channel.badgeGlow,
    shadow: channel.badgeShadow,
    connectSlug: channel.connectSlug,
  };

  return config;
}, {} as Record<ChannelBadgeKey, ChannelBadgeMetadata>);

export const CHANNEL_BADGE_KEYS = Object.keys(
  CHANNEL_BADGE_META,
) as ChannelBadgeKey[];

export const CHANNEL_BADGE_ALIAS_TO_KEY: Record<string, ChannelBadgeKey> = {
  "whatsapp-cloud": "whatsapp",
  whatsapp_cloud: "whatsapp",
  facebook: "messenger",
  facebook_messenger: "messenger",
  website_chat: "webchat",
  website_chat_widget: "webchat",
  "website-chat": "webchat",
};

export function getChannelBadgeMetadata(channelKey: string) {
  const normalizedKey =
    CHANNEL_BADGE_ALIAS_TO_KEY[channelKey] ?? (channelKey as ChannelBadgeKey);

  return CHANNEL_BADGE_META[normalizedKey] ?? null;
}

export function getAvatarBadgeTypeForChannel(
  channelType?: string | number | null,
): AvatarBadgeType {
  return getChannelMetadata(channelType)?.avatarBadgeType ?? "web";
}

export const MANAGE_CHANNEL_CONFIG = CHANNEL_METADATA.reduce<
  Record<
    string,
    {
      label: string;
      icon: string;
      color: string;
      navItems: ManageChannelNavItemDefinition[];
      additionalResources: ChannelResourceLink[];
    }
  >
>((config, channel) => {
  if (!channel.manageNavItems || !channel.color) return config;

  config[channel.key] = {
    label: channel.manageLabel ?? channel.catalogName ?? channel.label,
    icon: channel.icon,
    color: channel.key === "messenger" ? "bg-[var(--color-primary)]" : channel.color,
    navItems: channel.manageNavItems,
    additionalResources: channel.additionalResources ?? [],
  };

  return config;
}, {});

export const CHANNEL_TYPE_LABEL_TO_KEY = CHANNEL_METADATA.reduce<
  Record<string, string>
>((config, channel) => {
  [
    channel.label,
    channel.catalogName,
    channel.manageLabel,
    channel.selectLabel,
    channel.inboxLabel,
  ]
    .filter((label): label is string => Boolean(label))
    .forEach((label) => {
      config[label] = channel.key;
    });

  return config;
}, {});

export const ONBOARDING_CHANNEL_DEFINITIONS = CHANNEL_METADATA.flatMap(
  (channel) => (channel.onboarding ? [channel.onboarding] : []),
);

export const GET_STARTED_CHANNELS = [
  "whatsapp",
  "instagram",
  "messenger",
  "webchat",
  "email",
].map((key) => {
  const channel = CHANNEL_METADATA_BY_KEY[key];
  return {
    label: channel.label,
    src: channel.icon,
  };
});
