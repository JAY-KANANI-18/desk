import {
  forwardRef,
  useEffect,
  useId,
  useState,
  type InputHTMLAttributes,
} from "react";
import { Check, Copy } from "lucide-react";
import {
  FieldShell,
  getActionButtonClassName,
  getDescriptionId,
  getInputControlClassName,
  getInputControlStyle,
  type InputSize,
} from "./shared";

export interface CopyInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size" | "readOnly" | "type" | "value"
  > {
  value?: string | number;
  label?: string;
  hint?: string;
  error?: string;
  size?: InputSize;
}

export const CopyInput = forwardRef<HTMLInputElement, CopyInputProps>(
  (
    {
      id,
      value = "",
      label,
      hint,
      error,
      size = "md",
      className,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = getDescriptionId(inputId, Boolean(error || hint));
    const [copied, setCopied] = useState(false);

    useEffect(() => {
      if (!copied) {
        return;
      }

      const timeout = window.setTimeout(() => setCopied(false), 2000);
      return () => window.clearTimeout(timeout);
    }, [copied]);

    const handleCopy = async () => {
      if (disabled || !navigator.clipboard?.writeText) {
        return;
      }

      await navigator.clipboard.writeText(String(value ?? ""));
      setCopied(true);
    };

    return (
      <FieldShell
        id={inputId}
        label={label}
        required={required}
        error={error}
        hint={hint}
      >
        <div className="relative">
          <input
            {...props}
            id={inputId}
            ref={ref}
            type="text"
            value={value}
            readOnly
            required={required}
            disabled={disabled}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={descriptionId}
            className={getInputControlClassName({
              size,
              className,
            })}
            style={getInputControlStyle({
              hasError: Boolean(error),
              readOnly: true,
              paddingRight:
                "calc(var(--spacing-2xl) * 2 + var(--spacing-md))",
            })}
          />

          <div className="absolute inset-y-0 right-[var(--spacing-xs)] flex items-center">
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={disabled}
              aria-label={copied ? "Copied" : "Copy value"}
              className={getActionButtonClassName(size)}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </FieldShell>
    );
  },
);

CopyInput.displayName = "CopyInput";
