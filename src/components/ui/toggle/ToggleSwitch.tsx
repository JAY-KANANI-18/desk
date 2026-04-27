import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
} from "react";

export type ToggleSwitchSize = "sm" | "md";
export type ToggleSwitchLabelPosition = "left" | "right";

export interface ToggleSwitchProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "checked" | "children" | "onChange" | "size" | "type"
  > {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  labelPosition?: ToggleSwitchLabelPosition;
  disabled?: boolean;
  size?: ToggleSwitchSize;
}

const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const toggleSizeClassNames: Record<
  ToggleSwitchSize,
  {
    track: string;
    knob: string;
    checkedTranslate: string;
  }
> = {
  sm: {
    track: "h-4 w-7 px-[2px]",
    knob: "h-3 w-3",
    checkedTranslate: "translate-x-3",
  },
  md: {
    track: "h-5 w-9 px-0.5",
    knob: "h-4 w-4",
    checkedTranslate: "translate-x-4",
  },
};

const labelClassNameBySize: Record<ToggleSwitchSize, string> = {
  sm: "text-sm",
  md: "text-sm",
};

export const ToggleSwitch = forwardRef<HTMLInputElement, ToggleSwitchProps>(
  (
    {
      checked,
      onChange,
      label,
      labelPosition = "right",
      disabled = false,
      size = "md",
      id,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? `toggle-${generatedId}`;
    const sizeClassNames = toggleSizeClassNames[size];
    const ariaLabel = props["aria-label"] ?? (!label ? "Toggle switch" : undefined);

    const labelText = label ? (
      <span
        className={cx(
          "font-medium leading-none text-[var(--color-gray-700)]",
          labelClassNameBySize[size],
        )}
      >
        {label}
      </span>
    ) : null;

    return (
      <div className={cx("inline-flex max-w-full", className)} style={style}>
        <label
          htmlFor={inputId}
          className={cx(
            "inline-flex max-w-full items-center gap-[var(--spacing-sm)]",
            disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer select-none",
          )}
        >
          {labelPosition === "left" ? labelText : null}

          <span className="relative inline-flex shrink-0">
            <input
              {...props}
              ref={ref}
              id={inputId}
              type="checkbox"
              role="switch"
              checked={checked}
              disabled={disabled}
              aria-label={label ? undefined : ariaLabel}
              className="peer sr-only"
              onChange={(event) => onChange?.(event.target.checked)}
            />

            <span
              aria-hidden="true"
              className={cx(
                "pointer-events-none inline-flex items-center rounded-full transition-colors duration-200",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary-light)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white",
                sizeClassNames.track,
              )}
              style={{
                backgroundColor: checked
                  ? "var(--color-primary)"
                  : "var(--color-gray-200)",
              }}
            >
              <span
                aria-hidden="true"
                className={cx(
                  "rounded-full bg-white shadow-sm transition-transform duration-200",
                  sizeClassNames.knob,
                  checked ? sizeClassNames.checkedTranslate : "translate-x-0",
                )}
              />
            </span>
          </span>

          {labelPosition === "right" ? labelText : null}
        </label>
      </div>
    );
  },
);

ToggleSwitch.displayName = "ToggleSwitch";
