import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Loader2, X } from "@/components/ui/icons";
import {
  cx,
  getActionButtonClassName,
  getInputControlClassName,
  getInputControlStyle,
  type InputSize,
} from "./shared";

export interface InlineEditableInputProps {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  renderText?: (value: string) => ReactNode;
  size?: InputSize;
  className?: string;
  inputClassName?: string;
}

export function InlineEditableInput({
  value,
  onSave,
  placeholder = "Click to edit",
  disabled = false,
  renderText,
  size = "md",
  className,
  inputClassName,
}: InlineEditableInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  useEffect(() => {
    if (!editing) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const closeEditor = () => {
    setEditing(false);
    setSaving(false);
    setError(null);
    setDraft(value);
  };

  const commitDraft = async () => {
    if (saving) {
      return;
    }

    if (draft === value) {
      setEditing(false);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(draft);
      setEditing(false);
    } catch (commitError) {
      setError(
        commitError instanceof Error
          ? commitError.message
          : "Unable to save changes.",
      );
      inputRef.current?.focus();
      inputRef.current?.select();
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className={className}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setEditing(true)}
          className={cx(
            "inline-flex max-w-full items-center rounded-[var(--radius-md)] border border-transparent px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-left text-sm transition-colors hover:bg-[var(--color-gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
            !value && "italic text-[var(--color-gray-400)]",
          )}
        >
          {renderText ? renderText(value) : value || placeholder}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="flex items-start gap-[var(--spacing-sm)]"
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          disabled={disabled || saving}
          placeholder={placeholder}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) {
              setError(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void commitDraft();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              closeEditor();
            }
          }}
          onBlur={(event) => {
            if (
              containerRef.current?.contains(
                event.relatedTarget as Node | null,
              )
            ) {
              return;
            }

            void commitDraft();
          }}
          className={getInputControlClassName({
            size,
            className: inputClassName,
          })}
          style={getInputControlStyle({
            hasError: Boolean(error),
          })}
        />

        <div className="flex items-center gap-[var(--spacing-xs)]">
          <button
            type="button"
            onClick={() => void commitDraft()}
            disabled={saving}
            className={getActionButtonClassName(size)}
            aria-label="Save value"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          </button>

          <button
            type="button"
            onClick={closeEditor}
            disabled={saving}
            className={getActionButtonClassName(size)}
            aria-label="Cancel editing"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {error ? (
        <p
          className="mt-[var(--spacing-xs)] text-xs"
          style={{ color: "var(--color-error)" }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
