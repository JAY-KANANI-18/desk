import {
  forwardRef,
  useId,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import {
  FieldShell,
  cx,
  type FieldLabelVariant,
  getAdornmentClassName,
  getDescriptionId,
  getInputControlClassName,
  getInputControlStyle,
  type InputAppearance,
  type BaseInputType,
  type InputSize,
} from "./shared";

export interface BaseInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  type?: BaseInputType;
  label?: string;
  error?: string;
  invalid?: boolean;
  hint?: string;
  size?: InputSize;
  appearance?: InputAppearance;
  labelVariant?: FieldLabelVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  autoWidth?: boolean;
  minWidthCh?: number;
  maxWidthCh?: number;
  hideNativePickerIndicator?: boolean;
}

export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      id,
      type = "text",
      label,
      error,
      invalid = false,
      hint,
      size = "sm",
      appearance = "default",
      labelVariant = "default",
      leftIcon,
      rightIcon,
      autoWidth = false,
      minWidthCh = 8,
      maxWidthCh = 32,
      hideNativePickerIndicator = false,
      className,
      style,
      required,
      readOnly,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = getDescriptionId(inputId, Boolean(error || hint));
    const widthSource =
      props.value ?? props.defaultValue ?? props.placeholder ?? "";
    const autoWidthCh = Math.min(
      maxWidthCh,
      Math.max(minWidthCh, String(widthSource).length + 1),
    );
    const autoWidthStyle: CSSProperties | undefined = autoWidth
      ? { width: `${autoWidthCh}ch` }
      : undefined;

    return (
      <FieldShell
        id={inputId}
        label={label}
        required={required}
        error={error}
        hint={hint}
        labelVariant={labelVariant}
        className={autoWidth ? "w-auto" : undefined}
      >
        <div className="relative">
          {leftIcon ? (
            <span
              className={getAdornmentClassName({
                side: "left",
                appearance,
              })}
            >
              {leftIcon}
            </span>
          ) : null}

          <input
            {...props}
            id={inputId}
            ref={ref}
            type={type}
            required={required}
            readOnly={readOnly}
            disabled={disabled}
            aria-invalid={error || invalid ? "true" : undefined}
            aria-describedby={descriptionId}
            className={getInputControlClassName({
              size,
              appearance,
              hasLeftIcon: Boolean(leftIcon),
              hasRightIcon: Boolean(rightIcon),
              className: cx(
                hideNativePickerIndicator && "[&::-webkit-calendar-picker-indicator]:opacity-0",
                className,
              ),
            })}
            style={{
              ...getInputControlStyle({
                hasError: Boolean(error || invalid),
                readOnly,
                size,
                appearance,
                hasLeftIcon: Boolean(leftIcon),
                hasRightIcon: Boolean(rightIcon),
              }),
              ...autoWidthStyle,
              ...style,
            }}
          />

          {rightIcon ? (
            <span
              className={getAdornmentClassName({
                side: "right",
                appearance,
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

BaseInput.displayName = "BaseInput";
