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
  type IconSelectOption,
  type SelectFieldProps,
} from "./shared";

export interface SelectWithIconLabelProps extends SelectFieldProps {
  options: IconSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
}

export function SelectWithIconLabel({
  id,
  name,
  label,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  placeholder = "Select a channel",
  disabled = false,
  size = "md",
  emptyMessage = "No channels available.",
  className,
}: SelectWithIconLabelProps) {
  const generatedId = useId();
  const fieldId = id ?? `icon-select-${generatedId}`;
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
            <span className="flex items-center gap-[var(--spacing-sm)] text-[var(--color-gray-900)]">
              <span className="shrink-0 text-[var(--color-gray-500)]">
                {selectedOption.icon}
              </span>
              <span className="truncate">{selectedOption.label}</span>
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
                  <div className="flex items-center gap-[var(--spacing-sm)]">
                    <span className="shrink-0 text-[var(--color-gray-500)]">
                      {option.icon}
                    </span>
                    <SelectOptionLabel label={option.label} />
                  </div>
                </SelectOptionRow>
              ))
            )}
          </SelectList>
        </SelectDropdown>
      </div>
    </SelectField>
  );
}
