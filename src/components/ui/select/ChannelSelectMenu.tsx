import { useId, type ReactNode } from "react";
import { FieldShell } from "../inputs/shared";
import {
  CompactSelectMenu,
  type CompactSelectMenuGroup,
  type CompactSelectMenuOption,
  type CompactSelectMenuProps,
} from "./CompactSelectMenu";

export type ChannelSelectMenuVariant = "inline" | "field" | "panel";
export type ChannelSelectValueMode = "id" | "type-id";

export interface ChannelSelectMenuChannel {
  id?: string | number | null;
  type?: string | null;
  name?: string | null;
  status?: string | null;
  icon?: string | null;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface ChannelSelectMenuSpecialOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  searchText?: string;
  alwaysVisible?: boolean;
}

export interface ChannelSelectMenuProps<TChannel extends ChannelSelectMenuChannel>
  extends Pick<
    CompactSelectMenuProps,
    | "disabled"
    | "dropdownAlign"
    | "dropdownPlacement"
    | "dropdownWidth"
    | "emptyMessage"
    | "mobileSheet"
    | "mobileSheetSubtitle"
    | "mobileSheetTitle"
    | "searchable"
    | "searchPlaceholder"
  > {
  channels: TChannel[];
  value?: string;
  selectedChannel?: TChannel | null;
  onChange: (value: string, channel: TChannel | null) => void;
  variant?: ChannelSelectMenuVariant;
  valueMode?: ChannelSelectValueMode;
  label?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  groupLabel?: string;
  specialOptions?: ChannelSelectMenuSpecialOption[];
  channelFilter?: (channel: TChannel) => boolean;
  fullWidth?: boolean;
  triggerClassName?: string;
}

const CHANNEL_SELECT_META: Record<string, { icon: string; label: string }> = {
  whatsapp: {
    icon: "https://cdn.simpleicons.org/whatsapp",
    label: "WhatsApp",
  },
  instagram: {
    icon: "https://cdn.simpleicons.org/instagram",
    label: "Instagram",
  },
  messenger: {
    icon: "https://cdn.simpleicons.org/messenger",
    label: "Messenger",
  },
  gmail: {
    icon: "https://cdn.simpleicons.org/gmail",
    label: "Gmail",
  },
  email: {
    icon: "https://cdn.simpleicons.org/maildotru",
    label: "Email",
  },
  webchat: {
    icon: "https://cdn.simpleicons.org/googlechat",
    label: "Website Chat",
  },
  sms: {
    icon: "https://cdn.simpleicons.org/androidmessages",
    label: "SMS",
  },
  exotel_call: {
    icon: "https://cdn.simpleicons.org/ringcentral",
    label: "Voice Call",
  },
  meta_ads: {
    icon: "https://cdn.simpleicons.org/meta",
    label: "Meta Ads",
  },
};

export function getChannelSelectValue(
  channel: ChannelSelectMenuChannel,
  mode: ChannelSelectValueMode = "id",
) {
  if (mode === "type-id") {
    return `${String(channel.type ?? "unknown")}::${String(channel.id ?? "")}`;
  }

  return String(channel.id ?? "");
}

function getChannelType(channel: ChannelSelectMenuChannel) {
  return String(channel.type ?? "").toLowerCase();
}

function getChannelLabel(channel: ChannelSelectMenuChannel) {
  const type = getChannelType(channel);
  const metaLabel = CHANNEL_SELECT_META[type]?.label;
  return channel.name || metaLabel || channel.type || "Unnamed";
}

function getChannelDescription(channel: ChannelSelectMenuChannel) {
  const type = getChannelType(channel);
  return CHANNEL_SELECT_META[type]?.label ?? channel.type ?? undefined;
}

function getChannelIcon(channel: ChannelSelectMenuChannel, sizeClassName: string) {
  const type = getChannelType(channel);
  const icon = channel.icon || CHANNEL_SELECT_META[type]?.icon;

  if (!icon) {
    return (
      <span
        aria-hidden="true"
        className={`${sizeClassName} inline-flex items-center justify-center rounded-sm bg-gray-100 text-[10px] font-semibold uppercase text-gray-500`}
      >
        {(channel.type || channel.name || "?").slice(0, 1)}
      </span>
    );
  }

  return (
    <img
      src={icon}
      alt={getChannelLabel(channel)}
      className={`${sizeClassName} rounded-sm object-contain`}
    />
  );
}

function optionFromChannel<TChannel extends ChannelSelectMenuChannel>(
  channel: TChannel,
  valueMode: ChannelSelectValueMode,
): CompactSelectMenuOption {
  const description = getChannelDescription(channel);

  return {
    value: getChannelSelectValue(channel, valueMode),
    label: getChannelLabel(channel),
    description:
      channel.name && description && channel.name !== description
        ? description
        : undefined,
    leading: getChannelIcon(channel, "h-4 w-4"),
    tone: "neutral",
    searchText: [channel.name, channel.type, description]
      .filter(Boolean)
      .join(" "),
  };
}

function specialOptionToCompactOption(
  option: ChannelSelectMenuSpecialOption,
): CompactSelectMenuOption {
  return {
    value: option.value,
    label: option.label,
    description: option.description,
    leading: option.icon,
    tone: "neutral",
    searchText: option.searchText,
    alwaysVisible: option.alwaysVisible,
  };
}

export function ChannelSelectMenu<TChannel extends ChannelSelectMenuChannel>({
  channels,
  value,
  selectedChannel,
  onChange,
  variant = "field",
  valueMode = "id",
  label,
  required = false,
  hint,
  placeholder = "Select channel",
  groupLabel = "Channels",
  specialOptions = [],
  channelFilter,
  disabled = false,
  dropdownAlign = "start",
  dropdownPlacement,
  dropdownWidth,
  emptyMessage = "No channels available.",
  mobileSheet = true,
  mobileSheetTitle,
  mobileSheetSubtitle,
  searchable = false,
  searchPlaceholder = "Search channels",
  fullWidth,
  triggerClassName,
}: ChannelSelectMenuProps<TChannel>) {
  const generatedId = useId();
  const fieldId = `channel-select-menu-${generatedId}`;
  const visibleChannels = channelFilter ? channels.filter(channelFilter) : channels;
  const resolvedValue =
    value ??
    (selectedChannel ? getChannelSelectValue(selectedChannel, valueMode) : undefined);
  const selectedFromValue =
    selectedChannel ??
    visibleChannels.find(
      (channel) => getChannelSelectValue(channel, valueMode) === resolvedValue,
    ) ??
    null;

  const groups: CompactSelectMenuGroup[] = [
    ...(specialOptions.length
      ? [
          {
            options: specialOptions.map(specialOptionToCompactOption),
          },
        ]
      : []),
    {
      label: groupLabel,
      options: visibleChannels.map((channel) =>
        optionFromChannel(channel, valueMode),
      ),
    },
  ];

  const triggerContent = selectedFromValue ? (
    <span className="flex min-w-0 items-center gap-1.5">
      {getChannelIcon(
        selectedFromValue,
        variant === "inline" ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0",
      )}
      <span
        className={
          variant === "inline"
            ? "max-w-[7rem] truncate"
            : "min-w-0 flex-1 truncate"
        }
      >
        {getChannelLabel(selectedFromValue)}
      </span>
    </span>
  ) : undefined;

  const menu = (
    <CompactSelectMenu
      id={fieldId}
      value={resolvedValue}
      groups={groups}
      onChange={(nextValue) => {
        const nextChannel =
          visibleChannels.find(
            (channel) => getChannelSelectValue(channel, valueMode) === nextValue,
          ) ?? null;
        onChange(nextValue, nextChannel);
      }}
      hasValue={Boolean(resolvedValue)}
      size={variant === "panel" ? "sm" : "sm"}
      triggerAppearance={variant === "inline" ? "inline" : "field"}
      dropdownWidth={
        dropdownWidth ?? (variant === "inline" ? "sm" : "trigger")
      }
      dropdownAlign={dropdownAlign}
      dropdownPlacement={
        dropdownPlacement ?? (variant === "inline" ? "top" : "bottom")
      }
      disabled={disabled}
      fullWidth={fullWidth ?? variant !== "inline"}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      mobileSheet={mobileSheet}
      mobileSheetTitle={mobileSheetTitle ?? label ?? "Select channel"}
      mobileSheetSubtitle={mobileSheetSubtitle}
      placeholder={placeholder}
      triggerClassName={triggerClassName}
      triggerContent={triggerContent}
    />
  );

  if (label || hint) {
    return (
      <FieldShell id={fieldId} label={label} required={required} hint={hint}>
        {menu}
      </FieldShell>
    );
  }

  return menu;
}
