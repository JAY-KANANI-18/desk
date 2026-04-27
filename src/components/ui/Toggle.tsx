import { forwardRef } from "react";
import {
  ToggleSwitch,
  type ToggleSwitchProps as ModernToggleSwitchProps,
} from "./toggle/ToggleSwitch";

export interface ToggleProps
  extends Omit<ModernToggleSwitchProps, "checked" | "onChange"> {
  checked?: boolean;
  enabled?: boolean;
  onChange?: (value: boolean) => void;
  onToggle?: () => void;
  ariaLabel?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      checked,
      enabled,
      onChange,
      onToggle,
      ariaLabel,
      ...props
    },
    ref,
  ) => {
    const isChecked = checked ?? enabled ?? false;

    return (
      <ToggleSwitch
        {...props}
        ref={ref}
        checked={isChecked}
        aria-label={ariaLabel ?? props["aria-label"]}
        onChange={(value) => {
          onChange?.(value);
          onToggle?.();
        }}
      />
    );
  },
);

Toggle.displayName = "Toggle";
