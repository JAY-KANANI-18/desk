import { getChannelMetadata } from "../../config/channelMetadata";
import type { BroadcastRunRow } from "../../lib/broadcastApi";

type BroadcastChannel = BroadcastRunRow["channel"];

export function getBroadcastChannelDisplay(channel?: BroadcastChannel) {
  const metadata = getChannelMetadata(channel?.type);
  const typeLabel = metadata?.label ?? channel?.type ?? "Channel";

  return {
    icon: metadata?.coloredIcon ?? metadata?.icon,
    name: channel?.name || channel?.identifier || typeLabel,
    typeLabel,
  };
}

function fallbackInitials(label: string) {
  return label
    .replace(/[^a-z0-9]+/gi, "")
    .slice(0, 2)
    .toUpperCase() || "CH";
}

type BroadcastChannelIconProps = {
  channel?: BroadcastChannel;
  className?: string;
  iconClassName?: string;
  fallbackClassName?: string;
};

export function BroadcastChannelIcon({
  channel,
  className = "h-5 w-5 rounded-md bg-slate-50 ring-1 ring-slate-100",
  iconClassName = "h-4 w-4",
  fallbackClassName = "text-[10px] font-semibold text-slate-500",
}: BroadcastChannelIconProps) {
  const display = getBroadcastChannelDisplay(channel);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      title={display.typeLabel}
    >
      {display.icon ? (
        <img
          src={display.icon}
          alt={display.typeLabel}
          className={`object-contain ${iconClassName}`}
        />
      ) : (
        <span className={fallbackClassName}>
          {fallbackInitials(display.typeLabel)}
        </span>
      )}
    </span>
  );
}

export function BroadcastChannelLabel({
  channel,
  className,
}: {
  channel?: BroadcastChannel;
  className?: string;
}) {
  const display = getBroadcastChannelDisplay(channel);

  return (
    <span
      className={`inline-flex max-w-full min-w-0 items-center gap-2 ${className ?? ""}`}
      title={display.typeLabel}
    >
      <BroadcastChannelIcon channel={channel} />
      <span className="min-w-0 truncate text-gray-700">{display.name}</span>
    </span>
  );
}
