import { useId } from "react";
import { FieldShell, cx } from "./shared";

export interface TagColorSwatchOption {
  value: string;
  hex: string;
  label?: string;
}

export interface TagColorSwatchPickerProps {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  value: string;
  options: TagColorSwatchOption[];
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export function TagColorSwatchPicker({
  id,
  label,
  hint,
  error,
  value,
  options,
  disabled = false,
  onChange,
}: TagColorSwatchPickerProps) {
  const generatedId = useId();
  const inputId = id ?? `tag-color-swatch-picker-${generatedId}`;

  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <div className="flex flex-wrap items-center gap-3">
        {options.map((option) => {
          const selected = option.value === value;
          const optionLabel =
            option.label ?? option.value.replace(/^tag-/, "");

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange?.(option.value)}
              disabled={disabled}
              aria-label={`Select ${optionLabel} tag color`}
              aria-pressed={selected}
              className={cx(
                "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "scale-110 border-[var(--color-gray-900)]"
                  : "border-transparent hover:scale-110",
              )}
              style={{ backgroundColor: option.hex }}
            >
              <span className="sr-only">{optionLabel}</span>
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}
