import { useId } from "react";
import {
  SelectDropdown,
  SelectEmptyState,
  SelectField,
  SelectList,
  SelectOptionLabel,
  SelectOptionRow,
  SelectTrigger,
  findOptionByValue,
  getSelectOptionId,
  useSelectController,
  type SelectFieldProps,
  type SelectOption,
} from "./shared";

export interface BaseSelectProps extends SelectFieldProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
}

export function BaseSelect({
  id,
  name,
  label,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  size = "sm",
  emptyMessage = "No options available.",
  className,
}: BaseSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? `base-select-${generatedId}`;
  const selectedOption = findOptionByValue(options, value);

  const controller = useSelectController({
    options,
    disabled,
    initialHighlightedIndex: options.findIndex((option) => option.value === value),
    getOptionDisabled: (option) => Boolean(option.disabled),
    onSelect: (option) => onChange?.(option.value),
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
