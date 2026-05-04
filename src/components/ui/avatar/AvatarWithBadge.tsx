import { forwardRef, type CSSProperties } from "react";
import { Avatar, type AvatarProps } from "./Avatar";
import {
  avatarMetricsBySize,
  getAvatarBadgeAppearance,
  getAvatarStatusColor,
  type AvatarBadgeType,
} from "./shared";
import { cx } from "../inputs/shared";

export interface AvatarWithBadgeProps extends AvatarProps {
  badgeType: AvatarBadgeType;
  badgeSize?: string;
  badgeSrc?: string;
  badgeAlt?: string;
  badgePlacement?: "inset" | "overlap";
}

export const AvatarWithBadge = forwardRef<HTMLSpanElement, AvatarWithBadgeProps>(
  (
    {
      badgeType,
      badgeSize,
      badgeSrc,
      badgeAlt,
      badgePlacement = "overlap",
      size = "md",
      showStatus = false,
      statusColor,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const metrics = avatarMetricsBySize[size];
    const badgeAppearance = getAvatarBadgeAppearance(badgeType);
    const resolvedBadgeSize = badgeSize ?? metrics.badgeSize;
    const badgeStyle: CSSProperties = {
      width: resolvedBadgeSize,
      height: resolvedBadgeSize,
      backgroundColor: badgeSrc
        ? "var(--avatar-badge-bg, white)"
        : badgeAppearance.backgroundColor,
      backgroundImage: badgeSrc ? undefined : badgeAppearance.backgroundImage,
      color: badgeSrc ? "inherit" : "var(--avatar-badge-fg, white)",
      boxShadow: "0 0 0 2px var(--avatar-badge-ring, white)",
    };

    return (
      <span
        ref={ref}
        className={cx("relative inline-flex shrink-0", className)}
        style={style}
      >
        <Avatar
          {...props}
          className="relative inline-flex shrink-0"
          size={size}
          showStatus={false}
        />

        {showStatus ? (
          <span
            aria-hidden="true"
            className="absolute left-0 bottom-0 block rounded-full border-2 border-[var(--color-gray-50)]"
            style={{
              width: metrics.statusSize,
              height: metrics.statusSize,
              backgroundColor: getAvatarStatusColor(statusColor),
            }}
          />
        ) : null}

        <span
          aria-hidden="true"
          className={cx(
            "absolute inline-flex items-center justify-center overflow-hidden rounded-full",
            badgePlacement === "overlap" ? "-bottom-1 -right-1" : "bottom-0 right-0",
          )}
          style={badgeStyle}
        >
          {badgeSrc ? (
            <img
              src={badgeSrc}
              alt={badgeAlt ?? ""}
              className="h-[75%] w-[75%] object-contain"
            />
          ) : (
            <badgeAppearance.Icon size={metrics.badgeIconSize} />
          )}
        </span>
      </span>
    );
  },
);

AvatarWithBadge.displayName = "AvatarWithBadge";
