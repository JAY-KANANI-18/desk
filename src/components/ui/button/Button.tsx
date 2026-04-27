import {
  forwardRef,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  cx,
  getButtonClassName,
  getButtonHoverStyle,
  getButtonIconSize,
  type ButtonContentAlign,
  type ButtonRadius,
  getButtonStyle,
  renderButtonContent,
  type ButtonSize,
  type ButtonVariant,
} from "./shared";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  selected?: boolean;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  loadingLabel?: ReactNode;
  loadingMode?: "overlay" | "inline";
  fullWidth?: boolean;
  radius?: ButtonRadius;
  contentAlign?: ButtonContentAlign;
  preserveChildLayout?: boolean;
  type?: "button" | "submit" | "reset";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      selected = false,
      size = "sm",
      leftIcon,
      rightIcon,
      iconOnly = false,
      loading = false,
      loadingLabel,
      loadingMode = "overlay",
      disabled = false,
      fullWidth = false,
      radius = "default",
      contentAlign = "center",
      preserveChildLayout = false,
      type = "button",
      children,
      className,
      style,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
    const [hovered, setHovered] = useState(false);
    const isDisabled = disabled || loading;

    const resolvedStyle = useMemo<CSSProperties>(
      () => ({
        ...getButtonStyle({
          variant,
          size,
          iconOnly,
          fullWidth,
          radius,
          contentAlign,
          selected,
        }),
        ...(hovered && !isDisabled
          ? getButtonHoverStyle(variant, selected)
          : {}),
        ...style,
      }),
      [
        contentAlign,
        fullWidth,
        hovered,
        iconOnly,
        isDisabled,
        radius,
        selected,
        size,
        style,
        variant,
      ],
    );

    const content = renderButtonContent({
      children,
      leftIcon,
      rightIcon,
      iconOnly,
      preserveChildLayout,
    });

    const usesMutedSpinner =
      variant === "secondary" ||
      variant === "ghost" ||
      variant === "inherit-ghost" ||
      variant === "unstyled" ||
      variant === "list-row" ||
      variant === "tab" ||
      variant === "select-card" ||
      variant === "soft" ||
      variant === "soft-primary" ||
      variant === "dashed" ||
      variant === "inverse-primary" ||
      variant === "link" ||
      variant === "danger-ghost";

    const spinner = (
      <span
        aria-hidden="true"
        className="spinner"
        style={{
          width: `${getButtonIconSize(size)}px`,
          height: `${getButtonIconSize(size)}px`,
          borderColor: usesMutedSpinner
            ? variant === "inherit-ghost"
              ? "rgba(148, 163, 184, 0.28)"
              : "var(--color-gray-300)"
            : "rgba(255,255,255,0.35)",
          borderTopColor: usesMutedSpinner
            ? variant === "danger-ghost"
              ? "var(--color-error)"
              : variant === "inherit-ghost"
                ? "currentColor"
                : "var(--color-primary)"
            : "white",
        }}
      />
    );

    const loadingContent =
      loadingMode === "inline" ? (
        <>
          {spinner}
          <span className="inline-flex items-center">
            {loadingLabel ?? children}
          </span>
        </>
      ) : null;

    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={getButtonClassName({
          variant,
          size,
          iconOnly,
          fullWidth,
          loading,
          className,
        })}
        style={resolvedStyle}
        onMouseEnter={(event) => {
          setHovered(true);
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          setHovered(false);
          onMouseLeave?.(event);
        }}
      >
        <span
          className={cx(
            fullWidth && !iconOnly
              ? cx(
                  "flex w-full gap-[var(--spacing-sm)]",
                  variant === "list-row" ? "items-start" : "items-center",
                )
              : cx(
                  "inline-flex gap-[var(--spacing-sm)]",
                  variant === "list-row" ? "items-start" : "items-center",
                ),
            contentAlign === "start" ? "justify-start" : "justify-center",
            loading && loadingMode === "overlay" && "opacity-0",
          )}
        >
          {loading && loadingMode === "inline" ? loadingContent : content}
        </span>

        {loading && loadingMode === "overlay" ? (
          <span className="absolute inset-0 flex items-center justify-center">
            {spinner}
          </span>
        ) : null}
      </button>
    );
  },
);

Button.displayName = "Button";
