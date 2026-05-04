import {
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { ChevronDown } from "@/components/ui/icons";
import { cx } from "../inputs/shared";

export interface DisclosureButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  open?: boolean;
  tone?: "default" | "primary" | "warning" | "danger";
  appearance?: "surface" | "plain";
  size?: "sm" | "md";
  leadingIcon?: ReactNode;
  children: ReactNode;
}

const toneStyles = {
  default: {
    background: "color-mix(in srgb, var(--color-gray-200) 35%, white)",
    backgroundHover: "color-mix(in srgb, var(--color-gray-200) 55%, white)",
    border: "var(--color-gray-200)",
    color: "var(--color-gray-800)",
    icon: "var(--color-gray-500)",
  },
  primary: {
    background: "color-mix(in srgb, var(--color-primary-light) 45%, white)",
    backgroundHover: "color-mix(in srgb, var(--color-primary-light) 68%, white)",
    border: "color-mix(in srgb, var(--color-primary) 20%, white)",
    color: "var(--color-primary)",
    icon: "var(--color-primary)",
  },
  warning: {
    background: "#fff7ed",
    backgroundHover: "#ffedd5",
    border: "#fed7aa",
    color: "#c2410c",
    icon: "#d97706",
  },
  danger: {
    background: "color-mix(in srgb, var(--color-error) 8%, white)",
    backgroundHover: "color-mix(in srgb, var(--color-error) 14%, white)",
    border: "color-mix(in srgb, var(--color-error) 24%, white)",
    color: "color-mix(in srgb, var(--color-error) 75%, black)",
    icon: "color-mix(in srgb, var(--color-error) 72%, white)",
  },
} as const;

export function DisclosureButton({
  open = false,
  tone = "default",
  appearance = "surface",
  size = "md",
  leadingIcon,
  children,
  className,
  disabled = false,
  onMouseEnter,
  onMouseLeave,
  style,
  ...props
}: DisclosureButtonProps) {
  const [hovered, setHovered] = useState(false);
  const palette = toneStyles[tone];
  const isPlain = appearance === "plain";

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      disabled={disabled}
      className={cx(
        "flex w-full items-center justify-between transition-colors",
        size === "sm" ? "px-4 py-3" : "px-5 py-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      style={{
        backgroundColor: isPlain
          ? hovered
            ? "var(--color-gray-50)"
            : "transparent"
          : hovered
            ? palette.backgroundHover
            : palette.background,
        borderColor: isPlain ? "transparent" : palette.border,
        color:
          isPlain && tone === "default"
            ? "var(--color-gray-500)"
            : palette.color,
        ...style,
      }}
      onMouseEnter={(event) => {
        setHovered(true);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        setHovered(false);
        onMouseLeave?.(event);
      }}
    >
      <span className="flex items-center gap-[var(--spacing-sm)]">
        {leadingIcon ? (
          <span className="inline-flex items-center" style={{ color: palette.icon }}>
            {leadingIcon}
          </span>
        ) : null}
        <span
          className={cx(
            size === "sm"
              ? "text-xs font-semibold uppercase tracking-wider"
              : "text-sm font-semibold",
          )}
        >
          {children}
        </span>
      </span>
      <ChevronDown
        size={size === "sm" ? 13 : 16}
        className={cx("transition-transform", open && "rotate-180")}
        style={{
          color:
            isPlain && tone === "default"
              ? "var(--color-gray-300)"
              : palette.icon,
        }}
      />
    </button>
  );
}
