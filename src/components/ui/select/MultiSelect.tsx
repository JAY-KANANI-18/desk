import { useId } from "react";
import {
  SelectChip,
  SelectDropdown,
  SelectEmptyState,
  SelectField,
  SelectList,
  SelectMenuHeader,
  SelectOptionLabel,
  SelectOptionRow,
  SelectTrigger,
  getSelectOptionId,
  getSelectedOptions,
  useSelectController,
  type SelectFieldProps,
  type SelectOption,
} from "./shared";

export interface MultiSelectProps extends SelectFieldProps {
  options: SelectOption[];
  value: string[];
  onChange?: (value: string[]) => void;
}

export function MultiSelect({
  id,
  name,
  label,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  placeholder = "Select one or more options",
  disabled = false,
  size = "md",
  emptyMessage = "No options available.",
  className,
}: MultiSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? `multi-select-${generatedId}`;
  const selectedOptions = getSelectedOptions(options, value);

  const updateValue = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange?.(value.filter((currentValue) => currentValue !== optionValue));
      return;
    }

    onChange?.([...value, optionValue]);
  };

  const controller = useSelectController({
    options,
    disabled,
    closeOnSelect: false,
    getOptionDisabled: (option) => Boolean(option.disabled),
    onSelect: (option) => updateValue(option.value),
  });

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
          hasValue={selectedOptions.length > 0}
          error={error}
          className={className}
          onClick={controller.toggle}
          onKeyDown={controller.handleTriggerKeyDown}
        >
          {selectedOptions.length > 0 ? (
            <span className="flex flex-wrap gap-[var(--spacing-xs)]">
              {selectedOptions.map((option) => (
                <SelectChip
                  key={option.value}
                  label={option.label}
                  onRemove={() => updateValue(option.value)}
                />
              ))}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </SelectTrigger>

        <SelectDropdown isOpen={controller.isOpen}>
          <SelectMenuHeader
            title="Selected"
            actionLabel={selectedOptions.length > 0 ? "Clear all" : undefined}
            onAction={
              selectedOptions.length > 0 ? () => onChange?.([]) : undefined
            }
          />

          <SelectList
            id={controller.listId}
            onKeyDown={controller.handleListKeyDown}
          >
            {options.length === 0 ? (
              <SelectEmptyState message={emptyMessage} />
            ) : (
              options.map((option, index) => (
                <SelectOptionRow
                  key={option.value}
                  id={getSelectOptionId(controller.listId, index)}
                  selected={value.includes(option.value)}
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
