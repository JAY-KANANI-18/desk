import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import {
  FieldShell,
  type FieldLabelVariant,
  getAdornmentClassName,
  getDescriptionId,
  getInputControlClassName,
  getInputControlStyle,
  type InputAppearance,
  type InputSize,
} from "./shared";

export interface TextareaInputProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  readOnly?: boolean;
  size?: InputSize;
  appearance?: InputAppearance;
  labelVariant?: FieldLabelVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  autoResize?: boolean;
  maxRows?: number;
  showCharCount?: boolean;
}

export const TextareaInput = forwardRef<
  HTMLTextAreaElement,
  TextareaInputProps
>(
  (
    {
      id,
      label,
      error,
      hint,
      disabled,
      readOnly,
      size = "md",
      appearance = "default",
      labelVariant = "default",
      leftIcon,
      rightIcon,
      rows = 4,
      autoResize = false,
      maxRows = 8,
      maxLength,
      showCharCount = false,
      className,
      required,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textAreaId = id ?? generatedId;
    const descriptionId = getDescriptionId(textAreaId, Boolean(error || hint));
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const [uncontrolledValue, setUncontrolledValue] = useState(() =>
      typeof defaultValue === "string" ? defaultValue : "",
    );

    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

    useEffect(() => {
      if (!autoResize || !innerRef.current) {
        return;
      }

      const node = innerRef.current;
      const computedStyle = window.getComputedStyle(node);
      const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 20;
      const borderTopWidth =
        Number.parseFloat(computedStyle.borderTopWidth) || 0;
      const borderBottomWidth =
        Number.parseFloat(computedStyle.borderBottomWidth) || 0;
      const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom =
        Number.parseFloat(computedStyle.paddingBottom) || 0;
      const minRows = Math.max(1, rows);
      const resolvedMaxRows = Math.max(minRows, maxRows);
      const minHeight =
        lineHeight * minRows +
        paddingTop +
        paddingBottom +
        borderTopWidth +
        borderBottomWidth;
      const maxHeight =
        lineHeight * resolvedMaxRows +
        paddingTop +
        paddingBottom +
        borderTopWidth +
        borderBottomWidth;

      node.style.height = "auto";
      const nextHeight = Math.min(
        Math.max(node.scrollHeight, minHeight),
        maxHeight,
      );
      node.style.height = `${nextHeight}px`;
      node.style.overflowY = node.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [autoResize, maxRows, rows, uncontrolledValue, value]);

    const currentValue =
      typeof value === "string"
        ? value
        : uncontrolledValue;
    const charCount = currentValue.length;

    return (
      <FieldShell
        id={textAreaId}
        label={label}
        required={required}
        error={error}
        hint={hint}
        labelVariant={labelVariant}
        messageEnd={
          showCharCount && typeof maxLength === "number" ? (
            <span>{`${charCount}/${maxLength}`}</span>
          ) : null
        }
      >
        <div className="relative">
          {leftIcon ? (
            <span
              className={getAdornmentClassName({
                side: "left",
                appearance,
                multiline: true,
              })}
            >
              {leftIcon}
            </span>
          ) : null}

          <textarea
            {...props}
            id={textAreaId}
            ref={innerRef}
            value={value}
            defaultValue={defaultValue}
            onChange={(event) => {
              if (value === undefined) {
                setUncontrolledValue(event.target.value);
              }

              props.onChange?.(event);
            }}
            rows={rows}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={descriptionId}
            className={getInputControlClassName({
              size,
              appearance,
              hasLeftIcon: Boolean(leftIcon),
              hasRightIcon: Boolean(rightIcon),
              multiline: true,
              className,
            })}
            style={getInputControlStyle({
              hasError: Boolean(error),
              readOnly,
              size,
              appearance,
              hasLeftIcon: Boolean(leftIcon),
              hasRightIcon: Boolean(rightIcon),
            })}
          />

          {rightIcon ? (
            <span
              className={getAdornmentClassName({
                side: "right",
                appearance,
                multiline: true,
              })}
            >
              {rightIcon}
            </span>
          ) : null}
        </div>
      </FieldShell>
    );
  },
);

TextareaInput.displayName = "TextareaInput";
