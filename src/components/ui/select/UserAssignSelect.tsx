import { X } from "@/components/ui/icons";
import { useId } from "react";
import {
  SelectDropdown,
  SelectEmptyState,
  SelectField,
  SelectList,
  SelectOptionLabel,
  SelectOptionRow,
  SelectTrigger,
  SelectUserAvatar,
  findOptionByValue,
  getSelectOptionId,
  useSelectController,
  type SelectFieldProps,
  type UserSelectOption,
} from "./shared";

export interface UserAssignSelectProps extends SelectFieldProps {
  options: UserSelectOption[];
  value?: string;
  onChange?: (value: string | undefined) => void;
  clearable?: boolean;
  unassignLabel?: string;
}

export function UserAssignSelect({
  id,
  name,
  label,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  placeholder = "Assign user",
  disabled = false,
  size = "md",
  emptyMessage = "No users available.",
  className,
  clearable = true,
  unassignLabel = "Unassigned",
}: UserAssignSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? `user-assign-select-${generatedId}`;
  const selectedOption = findOptionByValue(options, value);

  const assignableOptions = clearable
    ? [{ value: "__unassigned__", label: unassignLabel }, ...options]
    : options;

  const controller = useSelectController({
    options: assignableOptions,
    disabled,
    initialHighlightedIndex: assignableOptions.findIndex((option) =>
      option.value === "__unassigned__" ? !value : option.value === value,
    ),
    getOptionDisabled: (option) => Boolean(option.disabled),
    onSelect: (option) => {
      if (option.value === "__unassigned__") {
        onChange?.(undefined);
        return;
      }

      onChange?.(option.value);
    },
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
        <div className="relative">
          <SelectTrigger
            id={fieldId}
            name={name}
            triggerRef={controller.triggerRef}
            listId={controller.listId}
            isOpen={controller.isOpen}
            disabled={disabled}
            size={size}
            hasValue={Boolean(selectedOption)}
            hasClearAction={Boolean(clearable && selectedOption)}
            error={error}
            className={className}
            onClick={controller.toggle}
            onKeyDown={controller.handleTriggerKeyDown}
          >
            {selectedOption ? (
              <span className="flex items-center gap-[var(--spacing-sm)] text-[var(--color-gray-900)]">
                <SelectUserAvatar
                  src={selectedOption.avatarSrc}
                  name={selectedOption.avatarName ?? selectedOption.label}
                />
                <span className="min-w-0">
                  <span className="block truncate">{selectedOption.label}</span>
                </span>
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </SelectTrigger>

          {clearable && selectedOption ? (
            <button
              type="button"
              aria-label={`Clear ${selectedOption.label}`}
              onClick={(event) => {
                event.stopPropagation();
                onChange?.(undefined);
              }}
              className="absolute right-[calc(var(--spacing-xl)+var(--spacing-sm))] top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-[2px] text-[var(--color-gray-500)] transition-colors hover:text-[var(--color-gray-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <SelectDropdown isOpen={controller.isOpen}>
          <SelectList
            id={controller.listId}
            onKeyDown={controller.handleListKeyDown}
          >
            {assignableOptions.length === 0 ? (
              <SelectEmptyState message={emptyMessage} />
            ) : (
              assignableOptions.map((option, index) => {
                const isUnassignedOption = option.value === "__unassigned__";

                return (
                  <SelectOptionRow
                    key={option.value}
                    id={getSelectOptionId(controller.listId, index)}
                    selected={
                      isUnassignedOption ? !value : option.value === value
                    }
                    highlighted={controller.highlightedIndex === index}
                    disabled={option.disabled}
                    onSelect={() => controller.selectByIndex(index)}
                    onMouseEnter={() => controller.setHighlightedIndex(index)}
                  >
                    {isUnassignedOption ? (
                      <SelectOptionLabel
                        label={option.label}
                        subtitle="Remove the current assignee"
                      />
                    ) : (
                      <div className="flex items-center gap-[var(--spacing-sm)]">
                        <SelectUserAvatar
                          src={option.avatarSrc}
                          name={option.avatarName ?? option.label}
                        />
                        <SelectOptionLabel
                          label={option.label}
                          subtitle={option.subtitle}
                        />
                      </div>
                    )}
                  </SelectOptionRow>
                );
              })
            )}
          </SelectList>
        </SelectDropdown>
      </div>
    </SelectField>
  );
}
