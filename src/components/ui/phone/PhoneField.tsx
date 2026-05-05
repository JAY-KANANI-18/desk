import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEventHandler,
  type Ref,
} from "react";
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneNumberForInput,
  parsePhoneNumberValue,
  validatePhoneNumber,
  type PhoneCountryCode,
  type PhoneNumberParseResult,
} from "@/lib/phoneNumber";
import {
  FieldShell,
  cx,
  getDescriptionId,
  type FieldLabelVariant,
  type InputAppearance,
  type InputSize,
} from "../inputs/shared";
import { CountrySelect } from "./CountrySelect";
import { PhoneInput } from "./PhoneInput";
import { getPhoneCountryOption, type PhoneCountryOption } from "./countries";

export interface PhoneFieldChangeMeta {
  country: PhoneCountryCode;
  countryOption: PhoneCountryOption;
  displayValue: string;
  isEmpty: boolean;
  isPossible: boolean;
  isValid: boolean;
}

export interface PhoneFieldProps {
  id?: string;
  name?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  value?: string | null;
  defaultCountry?: string | null;
  touched?: boolean;
  size?: InputSize;
  appearance?: InputAppearance;
  labelVariant?: FieldLabelVariant;
  placeholder?: string;
  countrySearchPlaceholder?: string;
  className?: string;
  inputClassName?: string;
  countryClassName?: string;
  controlsClassName?: string;
  inputRef?: Ref<HTMLInputElement>;
  allowClear?: boolean;
  onChange: (value: string, meta: PhoneFieldChangeMeta) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onInputKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}

function createChangeMeta(
  parsed: PhoneNumberParseResult,
): PhoneFieldChangeMeta {
  const countryOption = getPhoneCountryOption(parsed.country);

  return {
    country: countryOption.code,
    countryOption,
    displayValue: parsed.displayValue,
    isEmpty: parsed.isEmpty,
    isPossible: parsed.isPossible,
    isValid: parsed.isValid,
  };
}

function getInputDisplayValue(parsed: PhoneNumberParseResult) {
  if (!parsed.rawInput.trim().startsWith("+")) {
    return parsed.displayValue;
  }

  return formatPhoneNumberForInput(
    parsed.e164 || parsed.rawInput,
    parsed.country,
  ).displayValue;
}

function getPhoneControlClassName({
  appearance,
  disabled,
  hasError,
  className,
}: {
  appearance: InputAppearance;
  disabled: boolean;
  hasError: boolean;
  className?: string;
}) {
  return cx(
    "flex w-full min-w-0 items-center gap-2 rounded-xl border bg-white transition-[border-color,box-shadow,background-color]",
    appearance === "sidebar"
      ? "min-h-[2.625rem] border-[#e0e4ed] bg-[#fafbfc] px-2.5"
      : "min-h-[2.75rem] border-[var(--color-gray-300)] px-3",
    "focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_var(--color-primary-light)]",
    hasError && "border-[var(--color-error)] focus-within:border-[var(--color-error)]",
    disabled && "opacity-70",
    className,
  );
}

export function PhoneField({
  id,
  name,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  readOnly = false,
  value,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  touched,
  size = "sm",
  appearance = "default",
  labelVariant = "default",
  placeholder = "Phone number",
  countrySearchPlaceholder = "Search country or code",
  className,
  inputClassName,
  countryClassName,
  controlsClassName,
  inputRef,
  allowClear = true,
  onChange,
  onBlur,
  onInputKeyDown,
}: PhoneFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? `phone-field-${generatedId}`;
  const fallbackCountry = useMemo(
    () => getPhoneCountryOption(defaultCountry).code,
    [defaultCountry],
  );
  const initialDisplay = formatPhoneNumberForInput(value, fallbackCountry);
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountryCode>(
    initialDisplay.country,
  );
  const [inputValue, setInputValue] = useState(initialDisplay.displayValue);
  const [internalTouched, setInternalTouched] = useState(false);
  const lastEmittedValueRef = useRef<string | null>(null);

  useEffect(() => {
    const externalValue = value?.trim() ?? "";

    if (externalValue === lastEmittedValueRef.current) {
      return;
    }

    const nextDisplay = formatPhoneNumberForInput(externalValue, fallbackCountry);
    setSelectedCountry(nextDisplay.country);
    setInputValue(nextDisplay.displayValue);
  }, [fallbackCountry, value]);

  const parsedValue = useMemo(
    () => parsePhoneNumberValue(inputValue, selectedCountry),
    [inputValue, selectedCountry],
  );
  const validation = useMemo(
    () => validatePhoneNumber(parsedValue.e164 || inputValue, selectedCountry),
    [inputValue, parsedValue.e164, selectedCountry],
  );
  const isTouched = touched ?? internalTouched;
  const generatedError =
    required && parsedValue.isEmpty
      ? "Enter a phone number."
      : validation.error;
  const resolvedError = error ?? (isTouched ? generatedError : undefined);
  const descriptionId = getDescriptionId(fieldId, Boolean(resolvedError || hint));
  const selectedCountryOption = getPhoneCountryOption(selectedCountry);

  const emitChange = useCallback(
    (parsed: PhoneNumberParseResult) => {
      lastEmittedValueRef.current = parsed.e164;
      onChange(parsed.e164, createChangeMeta(parsed));
    },
    [onChange],
  );

  const handleInputChange = (nextValue: string) => {
    const parsed = parsePhoneNumberValue(nextValue, selectedCountry);
    const nextCountry = parsed.country || selectedCountry;

    setInternalTouched(true);
    setInputValue(getInputDisplayValue(parsed));
    setSelectedCountry(nextCountry);
    emitChange(parsed);
  };

  const handleCountryChange = (country: PhoneCountryCode) => {
    setInternalTouched(true);
    setSelectedCountry(country);

    if (!inputValue.trim()) {
      return;
    }

    const parsed = parsePhoneNumberValue(inputValue, country);
    setInputValue(getInputDisplayValue(parsed));
    setSelectedCountry(parsed.country);
    emitChange(parsed);
  };

  const handleClear = () => {
    const parsed = parsePhoneNumberValue("", selectedCountry);
    setInternalTouched(true);
    setInputValue("");
    lastEmittedValueRef.current = "";
    onChange("", createChangeMeta(parsed));
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setInternalTouched(true);
    onBlur?.(event);
  };

  return (
    <FieldShell
      id={fieldId}
      label={label}
      required={required}
      error={resolvedError}
      hint={hint}
      labelVariant={labelVariant}
      className={className}
    >
      <div
        className={getPhoneControlClassName({
          appearance,
          disabled,
          hasError: Boolean(resolvedError),
          className: controlsClassName,
        })}
      >
        <CountrySelect
          id={`${fieldId}-country`}
          value={selectedCountryOption.code}
          disabled={disabled || readOnly}
          error={resolvedError}
          size={size}
          appearance={appearance}
          className={cx("shrink-0", countryClassName)}
          searchPlaceholder={countrySearchPlaceholder}
          onChange={handleCountryChange}
        />

        <div className="min-w-0 flex-1">
          <PhoneInput
            ref={inputRef}
            id={fieldId}
            name={name}
            value={inputValue}
            country={selectedCountryOption}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            invalid={Boolean(resolvedError)}
            size={size}
            appearance="composer-inline"
            placeholder={placeholder}
            className={cx(
              "min-w-0 text-sm text-[var(--color-gray-900)] placeholder:text-[var(--color-gray-400)]",
              appearance === "sidebar" && "text-[13px] placeholder:text-[#c8cdd8]",
              inputClassName,
            )}
            aria-describedby={descriptionId}
            allowClear={allowClear}
            onValueChange={handleInputChange}
            onClear={handleClear}
            onBlur={handleBlur}
            onKeyDown={onInputKeyDown}
          />
        </div>
      </div>
    </FieldShell>
  );
}
