import type { HTMLAttributes } from "react";
import { cx } from "./inputs/shared";

export type CountBadgeTone = "primary" | "neutral" | "warning" | "danger";
export type CountBadgeSize = "xs" | "sm" | "md";

export interface CountBadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  count?: number | null;
  max?: number;
  tone?: CountBadgeTone;
  size?: CountBadgeSize;
  showZero?: boolean;
  compact?: boolean;
}

const sizeClassNames: Record<CountBadgeSize, string> = {
  xs: "h-[14px] min-w-[14px] px-0.5 text-[8px]",
  sm: "h-[18px] min-w-[18px] px-1 text-[10px]",
  md: "h-5 min-w-5 px-1.5 text-[11px]",
};

const toneClassNames: Record<CountBadgeTone, string> = {
  primary: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
  neutral: "bg-gray-100 text-gray-500",
  warning: "bg-orange-100 text-orange-700",
  danger: "bg-red-100 text-red-700",
};

export function CountBadge({
  count,
  max = 99,
  tone = "primary",
  size = "sm",
  showZero = false,
  compact = false,
  className,
  ...props
}: CountBadgeProps) {
  if (count == null || (count <= 0 && !showZero)) {
    return null;
  }

  const resolvedSize = compact ? "xs" : size;
  const displayValue =
    count > max ? (compact ? String(max) : `${max}+`) : String(count);

  return (
    <span
      {...props}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none",
        sizeClassNames[resolvedSize],
        toneClassNames[tone],
        compact && "absolute -right-1.5 -top-1.5",
        compact && tone === "primary" && "bg-[var(--color-primary)] text-white",
        compact && tone === "warning" && "bg-orange-500 text-white",
        compact && tone === "danger" && "bg-red-500 text-white",
        className,
      )}
    >
      {displayValue}
    </span>
  );
}
