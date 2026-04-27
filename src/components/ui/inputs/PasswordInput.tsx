import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { BaseInput, type BaseInputProps } from "./BaseInput";
import { getActionButtonClassName } from "./shared";

export interface PasswordInputProps
  extends Omit<BaseInputProps, "type" | "rightIcon"> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ size = "md", disabled, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <BaseInput
        {...props}
        ref={ref}
        type={isVisible ? "text" : "password"}
        size={size}
        disabled={disabled}
        rightIcon={
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsVisible((current) => !current)}
            aria-label={isVisible ? "Hide password" : "Show password"}
            className={getActionButtonClassName(size)}
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
