import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "../button/Button";
import { Tag } from "../tag/Tag";
import { FieldShell } from "./shared";

export interface TagInputProps {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  values: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTagWidth?: number | string;
  normalizeValue?: (value: string) => string;
  suggestions?: Array<{ value: string; label: string }>;
  getValueLabel?: (value: string) => string;
}

export function TagInput({
  id,
  label,
  hint,
  error,
  values,
  onChange,
  placeholder,
  disabled = false,
  maxTagWidth = 220,
  normalizeValue = (value) => value.trim().replace(/,+$/, ""),
  suggestions = [],
  getValueLabel,
}: TagInputProps) {
  const generatedId = useId();
  const inputId = id ?? `tag-input-${generatedId}`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);

  const addValue = (value: string) => {
    const normalized = normalizeValue(value);

    if (!normalized || values.includes(normalized)) {
      setInputValue("");
      setShowSuggestion(false);
      return;
    }

    onChange?.([...values, normalized]);
    setInputValue("");
    setShowSuggestion(false);
  };

  const removeValue = (value: string) => {
    onChange?.(values.filter((item) => item !== value));
  };

  const filteredSuggestions = suggestions
    .filter((suggestion) => !values.includes(suggestion.value))
    .filter((suggestion) =>
      inputValue
        ? suggestion.label.toLowerCase().includes(inputValue.toLowerCase())
        : true,
    )
    .slice(0, 6);

  const canAddInputValue = Boolean(normalizeValue(inputValue));

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addValue(inputValue);
      return;
    }

    if (event.key === "Backspace" && !inputValue && values.length) {
      onChange?.(values.slice(0, -1));
    }
  };

  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <div className="space-y-[var(--spacing-xs)]">
        <div
          className="relative flex min-h-[40px] flex-wrap items-center gap-[6px] rounded-[var(--radius-md)] border bg-white px-[var(--spacing-sm)] py-[var(--spacing-sm)] transition-all focus-within:ring-2"
          style={{
            borderColor: error
              ? "var(--color-error)"
              : "var(--color-gray-200)",
            boxShadow: "0 0 0 0 transparent",
          }}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.focus();
              setShowSuggestion(true);
            }
          }}
        >
          {values.map((value) => (
            <Tag
              key={value}
              label={getValueLabel?.(value) ?? value}
              size="sm"
              bgColor="primary"
              maxWidth={maxTagWidth}
              onRemove={disabled ? undefined : () => removeValue(value)}
              disabled={disabled}
            />
          ))}

          <input
            id={inputId}
            ref={inputRef}
            type="text"
            value={inputValue}
            disabled={disabled}
            placeholder={values.length === 0 ? placeholder : ""}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--color-gray-700)] outline-none placeholder:text-[var(--color-gray-400)] sm:min-w-[180px]"
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestion(true)}
            onBlur={() => {
              window.setTimeout(() => setShowSuggestion(false), 150);
            }}
          />

          <ChevronDown size={14} className="ml-auto shrink-0 text-[var(--color-gray-300)]" />
        </div>

        {showSuggestion && (filteredSuggestions.length > 0 || canAddInputValue) ? (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white shadow-sm">
            {filteredSuggestions.map((suggestion) => (
              <Button
                key={suggestion.value}
                variant="ghost"
                fullWidth
                radius="none"
                contentAlign="start"
                onMouseDown={(event) => {
                  event.preventDefault();
                  addValue(suggestion.value);
                }}
              >
                {suggestion.label}
              </Button>
            ))}

            {canAddInputValue ? (
              <Button
                variant="ghost"
                fullWidth
                radius="none"
                contentAlign="start"
                onMouseDown={(event) => {
                  event.preventDefault();
                  addValue(inputValue);
                }}
              >
                Add "{inputValue}"
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
}
