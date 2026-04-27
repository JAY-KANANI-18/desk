import {
  forwardRef,
  useEffect,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { cx } from "../inputs/shared";
import {
  avatarMetricsBySize,
  getAvatarInitials,
  getAvatarShapeRadius,
  getAvatarStatusColor,
  getAvatarStatusPositionStyle,
  type AvatarShape,
  type AvatarSize,
} from "./shared";

export interface AvatarProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  src?: string;
  name: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  fallbackTone?: "primary" | "neutral";
  showStatus?: boolean;
  statusColor?: string;
  alt?: string;
}

const fallbackToneClassNames: Record<NonNullable<AvatarProps["fallbackTone"]>, string> = {
  primary: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
  neutral: "bg-[var(--color-gray-300)] text-[var(--color-gray-900)]",
};

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  (
    {
      src,
      name,
      size = "md",
      shape = "circle",
      fallbackTone = "primary",
      showStatus = false,
      statusColor,
      alt,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
      setImageFailed(false);
    }, [src]);

    const metrics = avatarMetricsBySize[size];
    const wrapperStyle: CSSProperties = {
      width: metrics.dimension,
      height: metrics.dimension,
      borderRadius: getAvatarShapeRadius(shape),
      fontSize: metrics.fontSize,
      ...style,
    };

    return (
      <span
        {...props}
        ref={ref}
        className={cx("relative inline-flex shrink-0", className)}
        style={wrapperStyle}
      >
        {src && !imageFailed ? (
          <img
            src={src}
            alt={alt ?? name}
            className="h-full w-full object-cover"
            style={{ borderRadius: getAvatarShapeRadius(shape) }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span
            aria-label={alt ?? name}
            className={cx(
              "inline-flex h-full w-full items-center justify-center overflow-hidden font-semibold",
              fallbackToneClassNames[fallbackTone],
            )}
            style={{ borderRadius: getAvatarShapeRadius(shape) }}
          >
            {getAvatarInitials(name)}
          </span>
        )}

        {showStatus ? (
          <span
            aria-hidden="true"
            className="absolute block rounded-full border-2 border-[var(--color-gray-50)]"
            style={{
              ...getAvatarStatusPositionStyle(),
              width: metrics.statusSize,
              height: metrics.statusSize,
              backgroundColor: getAvatarStatusColor(statusColor),
            }}
          />
        ) : null}
      </span>
    );
  },
);

Avatar.displayName = "Avatar";
