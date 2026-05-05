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
  type TagSelectGroup,
} from "./shared";

export interface TagSelectProps extends SelectFieldProps {
  groups: TagSelectGroup[];
  value: string[];
  onChange?: (value: string[]) => void;
}

export function TagSelect({
  id,
  name,
  label,
  hint,
  error,
  required,
  groups,
  value,
  onChange,
  placeholder = "Select tags",
  disabled = false,
  size = "md",
  emptyMessage = "No tags available.",
  className,
}: TagSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? `tag-select-${generatedId}`;
  const flatOptions = groups.flatMap((group) => group.options);
  const selectedOptions = getSelectedOptions(flatOptions, value);

  const updateValue = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange?.(value.filter((currentValue) => currentValue !== optionValue));
      return;
    }

    onChange?.([...value, optionValue]);
  };

  const controller = useSelectController({
    options: flatOptions,
    disabled,
    closeOnSelect: false,
    initialHighlightedIndex: flatOptions.findIndex((option) =>
      value.includes(option.value),
    ),
    getOptionDisabled: (option) => Boolean(option.disabled),
    onSelect: (option) => updateValue(option.value),
  });

  let optionIndex = -1;

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
            title="Tags"
            actionLabel={selectedOptions.length > 0 ? "Clear all" : undefined}
            onAction={
              selectedOptions.length > 0 ? () => onChange?.([]) : undefined
            }
          />

          <SelectList
            id={controller.listId}
            onKeyDown={controller.handleListKeyDown}
          >
            {flatOptions.length === 0 ? (
              <SelectEmptyState message={emptyMessage} />
            ) : (
              groups.map((group) => (
                <div key={group.label}>
                  <div className="px-[var(--spacing-md)] py-[var(--spacing-xs)] text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-gray-500)]">
                    {group.label}
                  </div>

                  {group.options.map((option) => {
                    optionIndex += 1;
                    const currentIndex = optionIndex;

                    return (
                      <SelectOptionRow
                        key={option.value}
                        id={getSelectOptionId(controller.listId, currentIndex)}
                        selected={value.includes(option.value)}
                        highlighted={controller.highlightedIndex === currentIndex}
                        disabled={option.disabled}
                        onSelect={() => controller.selectByIndex(currentIndex)}
                        onMouseEnter={() =>
                          controller.setHighlightedIndex(currentIndex)
                        }
                      >
                        <SelectOptionLabel
                          label={option.label}
                          subtitle={option.description}
                        />
                      </SelectOptionRow>
                    );
                  })}
                </div>
              ))
            )}
          </SelectList>
        </SelectDropdown>
      </div>
    </SelectField>
  );
}
