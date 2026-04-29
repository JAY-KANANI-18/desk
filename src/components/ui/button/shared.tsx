import type { CSSProperties, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "inherit-ghost"
  | "unstyled"
  | "list-row"
  | "tab"
  | "select-card"
  | "soft"
  | "soft-primary"
  | "soft-warning"
  | "dashed"
  | "inverse-primary"
  | "facebook"
  | "dark"
  | "danger"
  | "danger-ghost"
  | "link"
  | "success"
  | "warning";
export type ButtonSize = "2xs" | "xs" | "sm" | "md" | "lg";
export type ButtonRadius = "none" | "default" | "lg" | "full";
export type ButtonContentAlign = "center" | "start";

export const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const buttonHeightBySize: Record<ButtonSize, string> = {
  "2xs": "1.25rem",
  xs: "1.75rem",
  sm: "calc(var(--spacing-xl) + var(--spacing-xs))",
  md: "calc(var(--spacing-xl) + var(--spacing-md))",
  lg: "calc(var(--spacing-2xl) + var(--spacing-sm))",
};

const buttonPaddingBySize: Record<ButtonSize, string> = {
  "2xs": "0.125rem 0.375rem",
  xs: "0.25rem 0.625rem",
  sm: "0.375rem 0.75rem",
  md: "var(--spacing-sm) var(--spacing-md)",
  lg: "0.75rem 1.5rem",
};

const buttonFontSizeBySize: Record<ButtonSize, string> = {
  "2xs": "0.625rem",
  xs: "var(--font-size-xs)",
  sm: "var(--font-size-xs)",
  md: "var(--font-size-sm)",
  lg: "var(--font-size-base)",
};

const iconSizeByButtonSize: Record<ButtonSize, number> = {
  "2xs": 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
};

const radiusByVariant: Record<ButtonRadius, string> = {
  none: "0px",
  default: "var(--radius-md)",
  lg: "var(--radius-lg)",
  full: "var(--radius-full)",
};

const buttonVariantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: "var(--color-primary)",
    borderColor: "var(--color-primary)",
    color: "white",
  },
  secondary: {
    backgroundColor: "white",
    borderColor: "var(--color-gray-300)",
    color: "var(--color-gray-700)",
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: "var(--color-gray-700)",
  },
  "inherit-ghost": {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: "inherit",
    boxShadow: "none",
  },
  unstyled: {},
  "list-row": {
    backgroundColor: "white",
    borderColor: "var(--color-gray-100)",
    color: "inherit",
    boxShadow: "none",
  },
  tab: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderBottomColor: "transparent",
    color: "var(--color-gray-600)",
    boxShadow: "none",
  },
  "select-card": {
    backgroundColor: "white",
    borderColor: "var(--color-gray-200)",
    color: "var(--color-gray-900)",
  },
  soft: {
    backgroundColor: "var(--color-gray-100)",
    borderColor: "transparent",
    color: "var(--color-gray-700)",
  },
  "soft-primary": {
    backgroundColor: "var(--color-primary-light)",
    borderColor: "transparent",
    color: "var(--color-primary)",
  },
  "soft-warning": {
    backgroundColor: "#fff7ed",
    borderColor: "transparent",
    color: "#c2410c",
  },
  dashed: {
    backgroundColor: "white",
    borderColor: "var(--color-gray-300)",
    color: "var(--color-gray-500)",
  },
  "inverse-primary": {
    backgroundColor: "white",
    borderColor: "white",
    color: "var(--color-primary)",
  },
  facebook: {
    backgroundColor: "#1877F2",
    borderColor: "#1877F2",
    color: "white",
  },
  dark: {
    backgroundColor: "var(--color-gray-900)",
    borderColor: "var(--color-gray-900)",
    color: "white",
  },
  danger: {
    backgroundColor: "var(--color-error)",
    borderColor: "var(--color-error)",
    color: "white",
  },
  "danger-ghost": {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: "var(--color-error)",
  },
  success: {
    backgroundColor: "var(--color-success)",
    borderColor: "var(--color-success)",
    color: "white",
  },
  warning: {
    backgroundColor: "var(--color-warning)",
    borderColor: "var(--color-warning)",
    color: "white",
  },
  link: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: "var(--color-primary)",
    boxShadow: "none",
  },
};

const buttonHoverStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: "var(--color-primary-hover)",
    borderColor: "var(--color-primary-hover)",
  },
  secondary: {
    backgroundColor: "var(--color-gray-50)",
  },
  ghost: {
    backgroundColor: "var(--color-gray-100)",
  },
  "inherit-ghost": {
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  unstyled: {},
  "list-row": {
    backgroundColor: "var(--color-gray-50)",
  },
  tab: {
    color: "var(--color-gray-900)",
  },
  "select-card": {
    backgroundColor: "color-mix(in srgb, var(--color-primary-light) 34%, white)",
    borderColor: "color-mix(in srgb, var(--color-primary) 24%, white)",
  },
  soft: {
    backgroundColor: "var(--color-gray-200)",
  },
  "soft-primary": {
    filter: "brightness(0.98)",
  },
  "soft-warning": {
    backgroundColor: "#ffedd5",
  },
  dashed: {
    backgroundColor: "color-mix(in srgb, var(--color-primary-light) 34%, white)",
    borderColor: "var(--color-primary)",
    color: "var(--color-primary)",
  },
  "inverse-primary": {
    backgroundColor: "var(--color-primary-light)",
    borderColor: "var(--color-primary-light)",
  },
  facebook: {
    backgroundColor: "#166FE5",
    borderColor: "#166FE5",
  },
  dark: {
    backgroundColor: "var(--color-gray-700)",
    borderColor: "var(--color-gray-700)",
  },
  danger: {
    filter: "brightness(0.96)",
  },
  "danger-ghost": {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  success: {
    filter: "brightness(0.96)",
  },
  warning: {
    filter: "brightness(0.96)",
  },
  link: {
    color: "var(--color-primary-hover)",
    textDecoration: "underline",
  },
};

export function getButtonIconSize(size: ButtonSize = "md") {
  return iconSizeByButtonSize[size];
}

export function getButtonClassName({
  variant = "primary",
  size = "md",
  iconOnly = false,
  fullWidth = false,
  loading = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return cx(
    "btn focus-visible relative isolate",
    variant === "list-row" ? "overflow-visible" : "overflow-hidden",
    fullWidth && "w-full",
    loading && "cursor-wait",
    iconOnly && "px-0",
    className,
  );
}

export function getButtonStyle({
  variant = "primary",
  size = "md",
  iconOnly = false,
  fullWidth = false,
  radius = "default",
  contentAlign = "center",
  selected = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  fullWidth?: boolean;
  radius?: ButtonRadius;
  contentAlign?: ButtonContentAlign;
  selected?: boolean;
}) {
  const style: CSSProperties = {
    ...buttonVariantStyles[variant],
    minHeight: buttonHeightBySize[size],
    fontSize: buttonFontSizeBySize[size],
    padding: iconOnly ? undefined : buttonPaddingBySize[size],
    width: iconOnly ? buttonHeightBySize[size] : fullWidth ? "100%" : undefined,
    minWidth: iconOnly ? buttonHeightBySize[size] : undefined,
    textDecoration: variant === "link" ? "none" : undefined,
    borderRadius: radiusByVariant[radius],
    justifyContent: iconOnly
      ? "center"
      : contentAlign === "start"
        ? "flex-start"
        : "center",
    textAlign: contentAlign === "start" ? "left" : "center",
  };

  if (variant === "select-card" && selected) {
    style.backgroundColor =
      "color-mix(in srgb, var(--color-primary-light) 78%, white)";
    style.borderColor = "var(--color-primary)";
    style.color = "var(--color-gray-900)";
  }

  if (variant === "list-row") {
    style.minHeight = undefined;
    style.padding = iconOnly ? undefined : "0.75rem 1rem";
    style.borderRadius = radiusByVariant[radius];
    style.borderWidth = "0 0 1px 0";
    style.borderStyle = "solid";
    style.borderColor = "var(--color-gray-100)";
    style.backgroundColor = selected ? "#eef2ff" : "white";
    style.boxShadow = "none";
    style.alignItems = "stretch";
    style.lineHeight = "var(--line-height-normal)";
    style.whiteSpace = "normal";
  }

  if (variant === "tab") {
    style.minHeight = "3rem";
    style.fontSize = "var(--font-size-sm)";
    style.padding = iconOnly ? undefined : "0.625rem 0.75rem";
    style.borderRadius = "0";
    style.borderWidth = "0 0 2px 0";
    style.borderStyle = "solid";
    style.borderBottomColor = selected
      ? "var(--color-primary)"
      : "transparent";
    style.color = selected ? "var(--color-primary)" : "var(--color-gray-600)";
  }

  if (variant === "link") {
    style.padding = iconOnly ? undefined : "0";
  }

  if (variant === "dashed") {
    style.borderStyle = "dashed";
    style.boxShadow = "none";
  }

  if (variant === "unstyled") {
    style.minHeight = undefined;
    style.padding = "0";
    style.borderWidth = 0;
    style.borderRadius = 0;
    style.color = "inherit";
    style.boxShadow = "none";
  }

  return style;
}

export function getButtonHoverStyle(
  variant: ButtonVariant = "primary",
  selected = false,
) {
  if (variant === "select-card" && selected) {
    return {
      backgroundColor:
        "color-mix(in srgb, var(--color-primary-light) 88%, white)",
      borderColor: "var(--color-primary)",
      color: "var(--color-gray-900)",
    };
  }

  if (variant === "tab" && selected) {
    return {
      color: "var(--color-primary-hover)",
      borderBottomColor: "var(--color-primary-hover)",
    };
  }

  if (variant === "list-row" && selected) {
    return {
      backgroundColor: "#eef2ff",
    };
  }

  return buttonHoverStyles[variant];
}

export function renderButtonContent({
  children,
  leftIcon,
  rightIcon,
  iconOnly,
  preserveChildLayout = false,
}: {
  children?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconOnly?: boolean;
  preserveChildLayout?: boolean;
}) {
  if (iconOnly) {
    return leftIcon ?? rightIcon ?? children;
  }

  return (
    <>
      {leftIcon ? <span className="inline-flex items-center">{leftIcon}</span> : null}
      {children ? (
        preserveChildLayout ? (
          children
        ) : (
          <span className="inline-flex items-center">{children}</span>
        )
      ) : null}
      {rightIcon ? <span className="inline-flex items-center">{rightIcon}</span> : null}
    </>
  );
}
