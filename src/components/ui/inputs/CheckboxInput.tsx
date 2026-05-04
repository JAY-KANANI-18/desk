import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { Check } from "@/components/ui/icons";
import { cx } from "./shared";

export type CheckboxInputSize = "sm" | "md";

export interface CheckboxInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "size" | "checked" | "onChange"
  > {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  size?: CheckboxInputSize;
  label?: ReactNode;
  description?: ReactNode;
}

export const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
  (
    {
      id,
      checked,
      onChange,
      size = "md",
      label,
      description,
      disabled = false,
      className,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? `checkbox-${generatedId}`;

    return (
      <label
        htmlFor={inputId}
        className={cx(
          "inline-flex max-w-full items-start gap-[var(--spacing-sm)]",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className,
        )}
      >
        <span className="relative mt-[2px] inline-flex shrink-0">
          <input
            {...props}
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            onChange={(event) => onChange?.(event.target.checked)}
          />
          <span
            aria-hidden="true"
            className={cx(
              "inline-flex items-center justify-center rounded-[var(--radius-sm)] border transition-colors duration-200",
              size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary-light)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white",
            )}
            style={{
              backgroundColor: checked ? "var(--color-primary)" : "white",
              borderColor: checked
                ? "var(--color-primary)"
                : "var(--color-gray-300)",
            }}
          >
            <Check
              size={12}
              className={cx(
                "text-white transition-opacity duration-150",
                checked ? "opacity-100" : "opacity-0",
              )}
            />
          </span>
        </span>

        {label || description ? (
          <span className="min-w-0 flex-1">
            {label ? (
              <span
                className={cx(
                  "block font-medium",
                  size === "sm"
                    ? "text-xs text-[var(--color-gray-700)]"
                    : "text-sm text-[var(--color-gray-900)]",
                )}
              >
                {label}
              </span>
            ) : null}
            {description ? (
              <span className="mt-0.5 block text-xs text-[var(--color-gray-500)]">
                {description}
              </span>
            ) : null}
          </span>
        ) : null}
      </label>
    );
  },
);

CheckboxInput.displayName = "CheckboxInput";
