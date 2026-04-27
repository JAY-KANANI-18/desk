import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Button, type ButtonProps } from "./Button";
import type { ButtonSize, ButtonVariant } from "./shared";

export interface IconButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "type" | "aria-label"
  > {
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonProps["radius"];
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = "ghost", size = "sm", loading, ...props }, ref) => (
    <Button
      {...(props as Omit<ButtonProps, "children">)}
      ref={ref}
      variant={variant}
      size={size}
      loading={loading}
      iconOnly
      leftIcon={icon}
    />
  ),
);

IconButton.displayName = "IconButton";
