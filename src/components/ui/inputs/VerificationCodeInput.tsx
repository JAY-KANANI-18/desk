import {
  useEffect,
  useMemo,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { cx } from "./shared";

export interface VerificationCodeInputProps {
  value: string[];
  onChange: (nextValue: string[]) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabelPrefix?: string;
}

export function VerificationCodeInput({
  value,
  onChange,
  length = 6,
  invalid = false,
  disabled = false,
  autoFocus = false,
  ariaLabelPrefix = "Verification code digit",
}: VerificationCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = useMemo(
    () => Array.from({ length }, (_, index) => value[index] ?? ""),
    [length, value],
  );

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }

    inputRefs.current[0]?.focus();
  }, [autoFocus, disabled]);

  const commit = (nextValue: string[]) => {
    onChange(nextValue.slice(0, length));
  };

  const focusIndex = (index: number) => {
    inputRefs.current[Math.max(0, Math.min(index, length - 1))]?.focus();
  };

  const handleChange = (index: number, rawValue: string) => {
    const nextCharacter = rawValue.replace(/\D/g, "").slice(-1);

    if (rawValue && !nextCharacter) {
      return;
    }

    const nextValue = [...digits];
    nextValue[index] = nextCharacter;
    commit(nextValue);

    if (nextCharacter && index < length - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      const nextValue = [...digits];

      if (nextValue[index]) {
        nextValue[index] = "";
        commit(nextValue);
        return;
      }

      if (index > 0) {
        nextValue[index - 1] = "";
        commit(nextValue);
        focusIndex(index - 1);
      }

      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();

    const pastedValue = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pastedValue) {
      return;
    }

    const nextValue = Array.from({ length }, (_, index) => pastedValue[index] ?? "");
    commit(nextValue);
    focusIndex(Math.min(pastedValue.length, length) - 1);
  };

  return (
    <div
      className="grid gap-2 sm:gap-3"
      style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`${ariaLabelPrefix} ${index + 1}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className={cx(
            "h-14 w-full rounded-2xl border text-center text-lg font-semibold outline-none transition",
            "focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-light)]",
            digit
              ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
              : "border-gray-200 bg-white text-gray-900",
            invalid && "border-red-300 bg-red-50 text-red-600 focus:border-red-400 focus:ring-red-100",
            disabled && "cursor-not-allowed opacity-60",
          )}
        />
      ))}
    </div>
  );
}
