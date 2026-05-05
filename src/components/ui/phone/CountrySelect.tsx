import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "@/components/ui/icons";
import {
  SelectDropdown,
  SelectEmptyState,
  SelectOptionRow,
  SelectSearchInput,
  SelectTrigger,
  getSelectOptionId,
  useSelectController,
  type SelectOptionSurface,
} from "../select/shared";
import { cx, type InputAppearance, type InputSize } from "../inputs/shared";
import {
  PHONE_COUNTRIES,
  getPhoneCountryOption,
  type PhoneCountryOption,
} from "./countries";
import type { PhoneCountryCode } from "@/lib/phoneNumber";

export interface CountrySelectProps {
  id?: string;
  value: PhoneCountryCode;
  options?: PhoneCountryOption[];
  disabled?: boolean;
  error?: string;
  size?: InputSize;
  appearance?: InputAppearance;
  className?: string;
  dropdownAlign?: "start" | "end";
  dropdownPlacement?: "top" | "bottom";
  dropdownWidth?: "trigger" | "sm" | "md" | "lg";
  searchPlaceholder?: string;
  emptyMessage?: string;
  onChange: (country: PhoneCountryCode) => void;
}

interface IndexedCountryOption extends PhoneCountryOption {
  index: number;
}

function matchesSearch(option: PhoneCountryOption, query: string) {
  return !query || option.searchText.includes(query);
}

function getVisibleCountryOptions(
  options: PhoneCountryOption[],
  searchTerm: string,
): IndexedCountryOption[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  return [...options]
    .sort((left, right) => left.name.localeCompare(right.name))
    .filter((option) => matchesSearch(option, normalizedSearch))
    .map((option, index) => ({
      ...option,
      index,
    }));
}

function renderTriggerContent(option: PhoneCountryOption, isOpen: boolean) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="text-sm font-semibold uppercase text-[var(--color-gray-900)]">
        {option.code}
      </span>
      <ChevronDown
        size={15}
        aria-hidden="true"
        className={`shrink-0 text-[var(--color-gray-500)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      />
      <span className="truncate text-sm font-medium text-[var(--color-gray-900)]">
        {option.dialCode}
      </span>
      <span className="sr-only">{option.name}</span>
    </span>
  );
}

function renderOptionContent(option: PhoneCountryOption) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm leading-5">
      <span className="w-7 shrink-0 font-semibold uppercase text-[var(--color-gray-900)]">
        {option.code}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium text-[var(--color-gray-700)]">
        {option.name}
      </span>
      <span className="shrink-0 font-medium text-[var(--color-gray-700)]">
        {option.dialCode}
      </span>
    </div>
  );
}

export function CountrySelect({
  id,
  value,
  options = PHONE_COUNTRIES,
  disabled = false,
  error,
  size = "sm",
  appearance = "default",
  className,
  dropdownAlign = "start",
  dropdownPlacement = "bottom",
  dropdownWidth = "lg",
  searchPlaceholder = "Search",
  emptyMessage = "No matching countries.",
  onChange,
}: CountrySelectProps) {
  const generatedId = useId();
  const fieldId = id ?? `phone-country-${generatedId}`;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedOption = getPhoneCountryOption(value);

  const visibleOptions = useMemo(
    () => getVisibleCountryOptions(options, searchTerm),
    [options, searchTerm],
  );
  const getOptionDisabled = useCallback(() => false, []);

  const controller = useSelectController({
    options: visibleOptions,
    disabled,
    initialHighlightedIndex:
      visibleOptions.find((option) => option.code === selectedOption.code)?.index ??
      -1,
    getOptionDisabled,
    onSelect: (option) => {
      onChange(option.code);
      setSearchTerm("");
    },
  });

  useEffect(() => {
    if (!controller.isOpen) {
      setSearchTerm("");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [controller.isOpen]);

  useEffect(() => {
    if (!controller.isOpen) {
      return;
    }

    const selectedIndex =
      visibleOptions.find((option) => option.code === selectedOption.code)?.index ??
      visibleOptions[0]?.index ??
      -1;
    controller.setHighlightedIndex(selectedIndex);
  }, [
    controller.isOpen,
    controller.setHighlightedIndex,
    selectedOption.code,
    visibleOptions,
  ]);

  const optionSurface: SelectOptionSurface = "inset";

  return (
    <div ref={controller.containerRef} className="relative shrink-0">
      <SelectTrigger
        id={fieldId}
        triggerRef={controller.triggerRef}
        listId={controller.listId}
        isOpen={controller.isOpen}
        disabled={disabled}
        size={size}
        hasValue
        fullWidth
        hideIndicator
        appearance="inline"
        className={cx(
          "min-w-0 justify-start rounded-md py-0.5 text-[13px] leading-snug",
          error && "text-[var(--color-error)]",
          className,
        )}
        onClick={controller.toggle}
        onKeyDown={controller.handleTriggerKeyDown}
      >
        {renderTriggerContent(selectedOption, controller.isOpen)}
      </SelectTrigger>

      <SelectDropdown
        isOpen={controller.isOpen}
        placement={dropdownPlacement}
        align={dropdownAlign}
        width={dropdownWidth}
      >
        <SelectSearchInput
          inputRef={searchInputRef}
          value={searchTerm}
          onChange={setSearchTerm}
          onKeyDown={controller.handleListKeyDown}
          placeholder={searchPlaceholder}
        />

        <div
          id={controller.listId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={controller.handleListKeyDown}
          className="max-h-80 overflow-y-auto py-2"
        >
          {visibleOptions.length === 0 ? (
            <SelectEmptyState message={emptyMessage} />
          ) : (
            visibleOptions.map((option) => (
              <SelectOptionRow
                key={option.code}
                id={getSelectOptionId(controller.listId, option.index)}
                selected={option.code === selectedOption.code}
                highlighted={controller.highlightedIndex === option.index}
                onSelect={() => controller.selectByIndex(option.index)}
                onMouseEnter={() => controller.setHighlightedIndex(option.index)}
                surface={optionSurface}
              >
                {renderOptionContent(option)}
              </SelectOptionRow>
            ))
          )}
        </div>
      </SelectDropdown>
    </div>
  );
}
