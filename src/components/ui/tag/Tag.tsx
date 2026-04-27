import {
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { resolveTagBaseColor } from "../../../lib/tagAppearance";
import { Tooltip } from "../Tooltip";
import { cx } from "../inputs/shared";

export type TagSize = "sm" | "md";
export type TagPresetColor =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "gray"
  | "tag-grey"
  | "tag-red"
  | "tag-orange"
  | "tag-yellow"
  | "tag-green"
  | "tag-blue"
  | "tag-indigo"
  | "tag-purple"
  | "tag-pink";

export interface TagProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "color" | "onClick"> {
  label: string;
  emoji?: string;
  bgColor?: string;
  textColor?: string;
  size?: TagSize;
  onRemove?: () => void;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  maxWidth?: number | string;
}

const sizeClassNames: Record<TagSize, string> = {
  sm: "gap-[6px] px-[10px] py-[3px] text-xs",
  md: "gap-[var(--spacing-xs)] px-3 py-1.5 text-sm",
};

const presetToCssVarMap: Record<string, string> = {
  primary: "--color-primary",
  success: "--color-success",
  warning: "--color-warning",
  error: "--color-error",
  info: "--color-info",
  gray: "--color-gray-400",
};

function getComputedCssVar(variableName: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  const resolved = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();

  return resolved || undefined;
}

function parseColorToRgb(color: string) {
  const normalized = color.trim();

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const fullHex =
      hex.length === 3
        ? hex
            .split("")
            .map((part) => `${part}${part}`)
            .join("")
        : hex;

    if (fullHex.length !== 6) {
      return null;
    }

    const int = Number.parseInt(fullHex, 16);

    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
    };
  }

  const rgbMatch = normalized.match(
    /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i,
  );

  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
    };
  }

  return null;
}

function toRgba(color: string, alpha: number) {
  const rgb = parseColorToRgb(color);

  if (!rgb) {
    return undefined;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getContrastTextColor(color: string) {
  const rgb = parseColorToRgb(color);

  if (!rgb) {
    return "var(--color-gray-700)";
  }

  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];

  return luminance > 0.62 ? "var(--color-gray-800)" : color;
}

function resolveBaseColor(bgColor?: string) {
  if (!bgColor) {
    return resolveTagBaseColor("tag-indigo");
  }

  if (bgColor in presetToCssVarMap) {
    return getComputedCssVar(presetToCssVarMap[bgColor]) ?? undefined;
  }

  if (bgColor.startsWith("var(")) {
    const variableName = bgColor.slice(4, -1).trim();
    return getComputedCssVar(variableName) ?? undefined;
  }

  if (bgColor.startsWith("tag-") || bgColor.startsWith("#")) {
    return resolveTagBaseColor(bgColor);
  }

  return bgColor;
}

export function Tag({
  label,
  emoji,
  bgColor = "tag-indigo",
  textColor,
  size = "md",
  onRemove,
  onClick,
  icon,
  disabled = false,
  maxWidth,
  className,
  style,
  onKeyDown: onKeyDownProp,
  ...props
}: TagProps) {
  const isMobile = useIsMobile();
  const baseColor = resolveBaseColor(bgColor);
  const surfaceBackground =
    (baseColor && toRgba(baseColor, 0.12)) || "var(--color-gray-100)";
  const surfaceBorder =
    (baseColor && toRgba(baseColor, 0.22)) || "var(--color-gray-200)";
  const resolvedTextColor =
    textColor || "var(--color-gray-700)";

  const tagStyle: CSSProperties = {
    backgroundColor: surfaceBackground,
    borderColor: surfaceBorder,
    color: resolvedTextColor,
    maxWidth,
    ...style,
  };

  const isInteractive = Boolean(onClick) && !disabled;

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    onKeyDownProp?.(event);

    if (!isInteractive) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  const labelNode = (
    <span className="min-w-0 truncate">
      {label}
    </span>
  );

  const truncatedLabelNode =
    maxWidth && label && !isMobile ? (
      <Tooltip content={label}>
        <span className="min-w-0 flex-1 overflow-hidden">{labelNode}</span>
      </Tooltip>
    ) : (
      <span className="min-w-0 flex-1 overflow-hidden">{labelNode}</span>
    );

  return (
    <span
      {...props}
      className={cx(
        "inline-flex max-w-full items-center rounded-md border font-medium leading-none transition-colors",
        sizeClassNames[size],
        isInteractive && "cursor-pointer hover:brightness-[0.98]",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      style={tagStyle}
      role={isInteractive ? "button" : props.role}
      tabIndex={isInteractive ? 0 : props.tabIndex}
      aria-disabled={disabled || undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={handleKeyDown}
    >
      {icon ? <span className="inline-flex shrink-0 items-center">{icon}</span> : null}
      {emoji ? <span className="shrink-0 leading-none">{emoji}</span> : null}
      {truncatedLabelNode}

      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="inline-flex shrink-0 items-center justify-center rounded-full text-current/70 transition-colors hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1 disabled:cursor-not-allowed"
        >
          <X size={size === "sm" ? 12 : 14} />
        </button>
      ) : null}
    </span>
  );
}
