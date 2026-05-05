import {
  forwardRef,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { X } from "@/components/ui/icons";
import { BaseInput, type BaseInputProps } from "../inputs/BaseInput";
import { cx } from "../inputs/shared";
import { isAllowedPhoneInput, sanitizePhoneInput } from "@/lib/phoneNumber";
import type { PhoneCountryOption } from "./countries";

export interface PhoneInputProps
  extends Omit<
    BaseInputProps,
    "type" | "value" | "onChange" | "leftIcon" | "rightIcon" | "inputMode"
  > {
  value: string;
  country: PhoneCountryOption;
  allowClear?: boolean;
  onValueChange: (value: string) => void;
  onClear?: () => void;
}

const CONTROL_KEYS = new Set([
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "Tab",
  "Enter",
  "Escape",
]);

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      country,
      allowClear = true,
      onValueChange,
      onClear,
      onKeyDown,
      onBeforeInput,
      onPaste,
      disabled,
      readOnly,
      autoComplete = "tel",
      placeholder = "Phone number",
      className,
      ...props
    },
    ref,
  ) => {
    const canClear = Boolean(allowClear && onClear && value && !disabled && !readOnly);

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);

      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        CONTROL_KEYS.has(event.key)
      ) {
        return;
      }

      if (event.key.length === 1 && !isAllowedPhoneInput(event.key)) {
        event.preventDefault();
        return;
      }

      if (event.key === "+") {
        const input = event.currentTarget;
        const selectionStart = input.selectionStart ?? 0;
        const selectionEnd = input.selectionEnd ?? selectionStart;
        const replacesAll = selectionStart === 0 && selectionEnd === value.length;

        if (selectionStart > 0 && !replacesAll) {
          event.preventDefault();
        }
      }
    };

    const handleBeforeInput = (event: FormEvent<HTMLInputElement>) => {
      onBeforeInput?.(event);

      if (event.defaultPrevented || typeof InputEvent === "undefined") {
        return;
      }

      const nativeEvent = event.nativeEvent;
      if (
        nativeEvent instanceof InputEvent &&
        nativeEvent.data &&
        !isAllowedPhoneInput(nativeEvent.data)
      ) {
        event.preventDefault();
      }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onValueChange(sanitizePhoneInput(event.target.value));
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
      onPaste?.(event);

      if (event.defaultPrevented) {
        return;
      }

      event.preventDefault();

      const pastedText = event.clipboardData.getData("text");
      const input = event.currentTarget;
      const selectionStart = input.selectionStart ?? value.length;
      const selectionEnd = input.selectionEnd ?? selectionStart;
      const nextValue = `${value.slice(0, selectionStart)}${pastedText}${value.slice(selectionEnd)}`;

      onValueChange(sanitizePhoneInput(nextValue));
    };

    return (
      <BaseInput
        {...props}
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className={className}
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onPaste={handlePaste}
        rightIcon={
          allowClear ? (
            <span className="pointer-events-none flex h-6 w-6 items-center justify-end overflow-hidden">
              <button
                type="button"
                aria-label={`Clear ${country.name} phone number`}
                aria-hidden={!canClear}
                tabIndex={canClear ? 0 : -1}
                disabled={!canClear}
                onMouseDown={(event) => event.preventDefault()}
                onClick={onClear}
                className={cx(
                  "inline-flex h-4 w-4 origin-center items-center justify-center rounded-full bg-slate-500 text-white shadow-sm transition-[background-color,opacity,transform] duration-200 ease-out hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] disabled:pointer-events-none",
                  canClear
                    ? "pointer-events-auto translate-x-0 scale-100 opacity-100"
                    : "pointer-events-none translate-x-3 scale-75 opacity-0",
                )}
              >
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          ) : undefined
        }
      />
    );
  },
);

PhoneInput.displayName = "PhoneInput";

