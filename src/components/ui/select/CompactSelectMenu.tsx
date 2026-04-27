import { CheckCircle2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "../inputs/shared";
import {
  SelectDropdown,
  SelectEmptyState,
  SelectList,
  SelectOptionRow,
  SelectSearchInput,
  SelectTrigger,
  getSelectOptionId,
  useSelectController,
  type SelectOptionTone,
  type SelectSize,
  type SelectTriggerAppearance,
} from "./shared";

export type CompactSelectMenuDescriptionTone =
  | "default"
  | "muted"
  | "success"
  | "warning";

export interface CompactSelectMenuOption {
  value: string;
  label: string;
  description?: string;
  descriptionTone?: CompactSelectMenuDescriptionTone;
  leading?: ReactNode;
  tone?: SelectOptionTone;
  searchText?: string;
  alwaysVisible?: boolean;
}

export interface CompactSelectMenuGroup {
  label?: string;
  options: CompactSelectMenuOption[];
}

export interface CompactSelectMenuProps {
  id?: string;
  value?: string;
  groups: CompactSelectMenuGroup[];
  onChange: (value: string) => void;
  triggerContent?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  size?: SelectSize;
  hasValue?: boolean;
  fullWidth?: boolean;
  triggerAppearance?: SelectTriggerAppearance;
  dropdownWidth?: "trigger" | "sm" | "md" | "lg";
  dropdownAlign?: "start" | "end";
  dropdownPlacement?: "top" | "bottom";
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  triggerClassName?: string;
}

function getDescriptionToneClass(
  tone: CompactSelectMenuDescriptionTone = "default",
) {
  switch (tone) {
    case "success":
      return "text-[var(--color-success)]";
    case "warning":
      return "text-[#c2410c]";
    case "muted":
      return "text-[var(--color-gray-400)]";
    default:
      return "text-[var(--color-gray-500)]";
  }
}

function getSelectedLabelClass(tone: SelectOptionTone = "primary") {
  switch (tone) {
    case "warning":
      return "text-[#c2410c]";
    case "neutral":
      return "text-[var(--color-gray-700)]";
    default:
      return "text-[var(--color-primary)]";
  }
}

function getSelectedIndicatorClass(tone: SelectOptionTone = "primary") {
  switch (tone) {
    case "warning":
      return "text-[#c2410c]";
    case "neutral":
      return "text-[var(--color-gray-500)]";
    default:
      return "text-[var(--color-primary)]";
  }
}

export function CompactSelectMenu({
  id,
  value,
  groups,
  onChange,
  triggerContent,
  placeholder = "Select option",
  disabled = false,
  size = "sm",
  hasValue,
  fullWidth = false,
  triggerAppearance = "pill",
  dropdownWidth = "trigger",
  dropdownAlign = "start",
  dropdownPlacement = "bottom",
  searchable = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No options available.",
  triggerClassName,
}: CompactSelectMenuProps) {
  const generatedId = useId();
  const fieldId = id ?? `compact-select-menu-${generatedId}`;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedOption = useMemo(
    () => groups.flatMap((group) => group.options).find((option) => option.value === value),
    [groups, value],
  );

  const filteredGroups = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    let nextIndex = 0;

    return groups.reduce<
      Array<{
        label?: string;
        options: Array<CompactSelectMenuOption & { index: number }>;
      }>
    >((accumulator, group) => {
      const options = group.options
        .filter((option) => {
          if (option.alwaysVisible || !normalizedQuery) {
            return true;
          }

          const searchableText = [
            option.label,
            option.description,
            option.searchText,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(normalizedQuery);
        })
        .map((option) => ({
          ...option,
          index: nextIndex++,
        }));

      if (options.length > 0) {
        accumulator.push({
          label: group.label,
          options,
        });
      }

      return accumulator;
    }, []);
  }, [groups, searchTerm]);

  const filteredOptions = useMemo(
    () => filteredGroups.flatMap((group) => group.options),
    [filteredGroups],
  );

  const controller = useSelectController({
    options: filteredOptions,
    disabled,
    onSelect: (option) => {
      onChange(option.value);
    },
  });

  useEffect(() => {
    if (!controller.isOpen) {
      setSearchTerm("");
      return;
    }

    if (!searchable) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [controller.isOpen, searchable]);

  useEffect(() => {
    if (!controller.isOpen) {
      return;
    }

    const nextHighlightedIndex =
      filteredOptions.find((option) => option.value === value)?.index ??
      filteredOptions[0]?.index ??
      -1;

    controller.setHighlightedIndex(nextHighlightedIndex);
  }, [controller.isOpen, controller.setHighlightedIndex, filteredOptions, value]);

  const resolvedHasValue = hasValue ?? Boolean(selectedOption);

  return (
    <div ref={controller.containerRef} className="relative">
      <SelectTrigger
        id={fieldId}
        triggerRef={controller.triggerRef}
        listId={controller.listId}
        isOpen={controller.isOpen}
        disabled={disabled}
        size={size}
        hasValue={resolvedHasValue}
        fullWidth={fullWidth}
        appearance={triggerAppearance}
        className={triggerClassName}
        onClick={controller.toggle}
        onKeyDown={controller.handleTriggerKeyDown}
      >
        {triggerContent ?? (
          <span className="truncate">
            {selectedOption?.label ?? placeholder}
          </span>
        )}
      </SelectTrigger>

      <SelectDropdown
        isOpen={controller.isOpen}
        placement={dropdownPlacement}
        align={dropdownAlign}
        width={dropdownWidth}
      >
        {searchable ? (
          <SelectSearchInput
            inputRef={searchInputRef}
            value={searchTerm}
            onChange={setSearchTerm}
            onKeyDown={controller.handleListKeyDown}
            placeholder={searchPlaceholder}
          />
        ) : null}

        <SelectList id={controller.listId} onKeyDown={controller.handleListKeyDown}>
          {filteredOptions.length === 0 ? (
            <SelectEmptyState message={emptyMessage} />
          ) : (
            filteredGroups.map((group, groupIndex) => (
              <div key={group.label ?? `group-${groupIndex}`}>
                {group.label ? (
                  <div className="px-[var(--spacing-md)] pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-gray-400)]">
                    {group.label}
                  </div>
                ) : null}

                {group.options.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <SelectOptionRow
                      key={option.value}
                      id={getSelectOptionId(controller.listId, option.index)}
                      selected={isSelected}
                      highlighted={controller.highlightedIndex === option.index}
                      onSelect={() => controller.selectByIndex(option.index)}
                      onMouseEnter={() => controller.setHighlightedIndex(option.index)}
                      tone={option.tone}
                      surface="inset"
                      trailing={
                        isSelected ? (
                          <CheckCircle2
                            size={16}
                            className={cx(
                              "mt-0.5 shrink-0",
                              getSelectedIndicatorClass(option.tone),
                            )}
                          />
                        ) : undefined
                      }
                    >
                      <div className="flex min-w-0 items-center gap-[var(--spacing-sm)]">
                        {option.leading ? (
                          <span className="shrink-0">{option.leading}</span>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div
                            className={cx(
                              "truncate text-sm font-medium",
                              isSelected
                                ? getSelectedLabelClass(option.tone)
                                : "text-[var(--color-gray-800)]",
                            )}
                          >
                            {option.label}
                          </div>
                          {option.description ? (
                            <div
                              className={cx(
                                "mt-[2px] truncate text-xs",
                                getDescriptionToneClass(option.descriptionTone),
                              )}
                            >
                              {option.description}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </SelectOptionRow>
                  );
                })}
              </div>
            ))
          )}
        </SelectList>
      </SelectDropdown>
    </div>
  );
}
