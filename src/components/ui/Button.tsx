import {
  forwardRef,
  type ButtonHTMLAttributes,
} from "react";
import {
  Button as ModernButton,
  type ButtonProps as ModernButtonProps,
} from "./button/Button";

export interface ButtonProps
  extends ModernButtonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ isLoading = false, ...props }, ref) => (
    <ModernButton {...props} ref={ref} loading={isLoading || props.loading} />
  ),
);

Button.displayName = "Button";
