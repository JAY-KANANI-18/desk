import {
  forwardRef,
  useId,
  useRef,
  type InputHTMLAttributes,
} from "react";
import {
  FieldShell,
  getDescriptionId,
  getInputControlClassName,
  getInputControlStyle,
  type InputSize,
} from "./shared";

export interface ColorInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "size" | "value" | "onChange"
  > {
  value: string;
  onChange?: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  size?: InputSize;
}

export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  (
    {
      id,
      value,
      onChange,
      label,
      hint,
      error,
      size = "md",
      className,
      required,
      disabled,
      placeholder = "#2563EB",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? `color-input-${generatedId}`;
    const descriptionId = getDescriptionId(inputId, Boolean(error || hint));
    const colorPickerRef = useRef<HTMLInputElement | null>(null);

    return (
      <FieldShell
        id={inputId}
        label={label}
        required={required}
        error={error}
        hint={hint}
      >
        <div className="flex items-center gap-[var(--spacing-md)]">
          <button
            type="button"
            disabled={disabled}
            aria-label="Choose color"
            onClick={() => colorPickerRef.current?.click()}
            className="inline-flex shrink-0 items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-2"
            style={{
              width: "calc(var(--spacing-xl) + var(--spacing-sm))",
              height: "calc(var(--spacing-xl) + var(--spacing-sm))",
              borderRadius: "var(--radius-md)",
              borderColor: error
                ? "var(--color-error)"
                : "var(--color-gray-200)",
              backgroundColor: value || "transparent",
            }}
          >
            <span className="sr-only">Open color picker</span>
          </button>

          <input
            ref={colorPickerRef}
            type="color"
            value={value}
            disabled={disabled}
            className="sr-only"
            onChange={(event) => onChange?.(event.target.value)}
            tabIndex={-1}
          />

          <input
            {...props}
            id={inputId}
            ref={ref}
            type="text"
            value={value}
            required={required}
            disabled={disabled}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={descriptionId}
            placeholder={placeholder}
            className={getInputControlClassName({
              size,
              className,
            })}
            style={getInputControlStyle({
              hasError: Boolean(error),
              size,
            })}
            onChange={(event) => onChange?.(event.target.value)}
          />
        </div>
      </FieldShell>
    );
  },
);

ColorInput.displayName = "ColorInput";
