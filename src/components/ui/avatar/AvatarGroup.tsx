import type { MouseEventHandler } from "react";
import { Avatar, type AvatarProps } from "./Avatar";
import { avatarMetricsBySize, type AvatarSize } from "./shared";

export interface AvatarGroupProps {
  avatars: AvatarProps[];
  max?: number;
  size?: AvatarSize;
  overlap?: boolean;
  onMoreClick?: MouseEventHandler<HTMLButtonElement>;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = "md",
  overlap = true,
  onMoreClick,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const overflowCount = Math.max(avatars.length - visibleAvatars.length, 0);
  const metrics = avatarMetricsBySize[size];

  return (
    <div className="inline-flex items-center">
      {visibleAvatars.map((avatar, index) => (
        <span
          key={`${avatar.name}-${index}`}
          className="inline-flex shrink-0"
          style={{
            marginInlineStart:
              overlap && index > 0 ? metrics.overlapOffset : undefined,
            zIndex: visibleAvatars.length - index,
          }}
        >
          <Avatar {...avatar} size={avatar.size ?? size} />
        </span>
      ))}

      {overflowCount > 0 ? (
        onMoreClick ? (
          <button
            type="button"
            onClick={onMoreClick}
            className="inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0"
            style={{
              marginInlineStart:
                overlap && visibleAvatars.length > 0
                  ? metrics.overlapOffset
                  : undefined,
            }}
          >
            <span
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-[var(--color-gray-100)] font-semibold text-[var(--color-gray-700)]"
              style={{
                width: metrics.dimension,
                height: metrics.dimension,
                fontSize: metrics.fontSize,
              }}
            >
              +{overflowCount}
            </span>
          </button>
        ) : (
          <span
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-[var(--color-gray-100)] font-semibold text-[var(--color-gray-700)]"
            style={{
              width: metrics.dimension,
              height: metrics.dimension,
              fontSize: metrics.fontSize,
              marginInlineStart:
                overlap && visibleAvatars.length > 0
                  ? metrics.overlapOffset
                  : undefined,
            }}
          >
            +{overflowCount}
          </span>
        )
      ) : null}
    </div>
  );
}
