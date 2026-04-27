import { useEffect, useId, useRef, useState } from "react";
import {
  SelectDropdown,
  SelectEmptyState,
  SelectField,
  SelectList,
  SelectOptionLabel,
  SelectOptionRow,
  SelectSearchInput,
  SelectTrigger,
  findOptionByValue,
  getSelectOptionId,
  useSelectController,
  type SelectFieldProps,
  type SelectOption,
} from "./shared";

export interface SearchableSelectProps extends SelectFieldProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function SearchableSelect({
  id,
  name,
  label,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  placeholder = "Search and select",
  disabled = false,
  size = "md",
  emptyMessage = "No matching options.",
  className,
  searchPlaceholder = "Search options...",
}: SearchableSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? `searchable-select-${generatedId}`;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );

  const selectedOption = findOptionByValue(options, value);

  const controller = useSelectController({
    options: filteredOptions,
    disabled,
    getOptionDisabled: (option) => Boolean(option.disabled),
    onSelect: (option) => {
      onChange?.(option.value);
      setSearchTerm("");
    },
  });

  useEffect(() => {
    if (!controller.isOpen) {
      setSearchTerm("");
      return;
    }

    const timeout = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [controller.isOpen]);

  return (
    <SelectField
      id={fieldId}
      label={label}
      required={required}
      error={error}
      hint={hint}
    >
      <div ref={controller.containerRef} className="relative">
        <SelectTrigger
          id={fieldId}
          name={name}
          triggerRef={controller.triggerRef}
          listId={controller.listId}
          isOpen={controller.isOpen}
          disabled={disabled}
          size={size}
          hasValue={Boolean(selectedOption)}
          error={error}
          className={className}
          onClick={controller.toggle}
          onKeyDown={controller.handleTriggerKeyDown}
        >
          {selectedOption ? (
            <span className="block truncate text-[var(--color-gray-900)]">
              {selectedOption.label}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </SelectTrigger>

        <SelectDropdown isOpen={controller.isOpen}>
          <SelectSearchInput
            inputRef={searchInputRef}
            value={searchTerm}
            onChange={setSearchTerm}
            onKeyDown={controller.handleListKeyDown}
            placeholder={searchPlaceholder}
          />

          <SelectList
            id={controller.listId}
            onKeyDown={controller.handleListKeyDown}
          >
            {filteredOptions.length === 0 ? (
              <SelectEmptyState message={emptyMessage} />
            ) : (
              filteredOptions.map((option, index) => (
                <SelectOptionRow
                  key={option.value}
                  id={getSelectOptionId(controller.listId, index)}
                  selected={option.value === value}
                  highlighted={controller.highlightedIndex === index}
                  disabled={option.disabled}
                  onSelect={() => controller.selectByIndex(index)}
                  onMouseEnter={() => controller.setHighlightedIndex(index)}
                >
                  <SelectOptionLabel label={option.label} />
                </SelectOptionRow>
              ))
            )}
          </SelectList>
        </SelectDropdown>
      </div>
    </SelectField>
  );
}
