import { type ReactNode } from "react";
import {
  getButtonIconSize,
  getButtonStyle,
  type ButtonContentAlign,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant,
} from "../button/shared";
import {
  CompactSelectMenu,
  type CompactSelectMenuProps,
} from "./CompactSelectMenu";
import type { SelectSize } from "./shared";

export interface ButtonSelectMenuProps
  extends Omit<
    CompactSelectMenuProps,
    | "triggerAppearance"
    | "triggerContent"
    | "triggerClassName"
    | "triggerStyle"
    | "size"
  > {
  label: ReactNode;
  leftIcon?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
  selected?: boolean;
  contentAlign?: ButtonContentAlign;
  triggerClassName?: string;
}

function toSelectSize(size: ButtonSize): SelectSize {
  return size === "2xs" ? "xs" : size;
}

export function ButtonSelectMenu({
  label,
  leftIcon,
  variant = "secondary",
  size = "sm",
  radius = "default",
  selected = false,
  contentAlign = "center",
  fullWidth = false,
  triggerClassName,
  ...props
}: ButtonSelectMenuProps) {
  const iconSize = getButtonIconSize(size);

  return (
    <CompactSelectMenu
      {...props}
      fullWidth={fullWidth}
      size={toSelectSize(size)}
      hasValue={selected}
      triggerAppearance="button"
      triggerStyle={getButtonStyle({
        variant,
        size,
        fullWidth,
        radius,
        contentAlign,
        selected,
      })}
      triggerClassName={triggerClassName}
      triggerContent={
        <span className="inline-flex min-w-0 items-center gap-[var(--spacing-sm)]">
          {leftIcon ? (
            <span
              className="inline-flex shrink-0 items-center"
              style={{ width: iconSize, height: iconSize }}
            >
              {leftIcon}
            </span>
          ) : null}
          <span className="truncate">{label}</span>
        </span>
      }
    />
  );
}
