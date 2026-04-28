import type { CSSProperties, ReactNode } from "react";
import { cx } from "../inputs/shared";
import { Button, type ButtonProps } from "./Button";

export interface FloatingActionButtonProps
  extends Omit<ButtonProps, "children" | "iconOnly" | "leftIcon" | "radius" | "size"> {
  label: string;
  icon: ReactNode;
  offset?: "default" | "low";
}

const classDrivenButtonStyle = {
  position: "fixed",
  padding: undefined,
  borderRadius: undefined,
  borderWidth: undefined,
  color: "white",
  boxShadow: undefined,
  fontSize: undefined,
  minWidth: undefined,
} satisfies CSSProperties;

const offsetStyles: Record<NonNullable<FloatingActionButtonProps["offset"]>, CSSProperties["bottom"]> = {
  default: "calc(6.25rem + env(safe-area-inset-bottom))",
  low: "calc(3rem + env(safe-area-inset-bottom))",
};

export function FloatingActionButton({
  label,
  icon,
  variant = "primary",
  offset = "default",
  className,
  style,
  ...props
}: FloatingActionButtonProps) {
  return (
    <Button
      {...props}
      aria-label={label}
      title={label}
      variant={variant}
      iconOnly
      leftIcon={icon}
      className={cx(
        "z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_18px_44px_rgba(79,70,229,0.32)] md:hidden",
        className,
      )}
      style={{
        ...classDrivenButtonStyle,
        right: "1.5rem",
        bottom: offsetStyles[offset],
        width: 42,
        height: 42,
        borderRadius: 9999,
        ...style,
      }}
    />
  );
}
