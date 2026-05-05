import { CheckCircle2 } from "@/components/ui/icons";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { cx } from "../inputs/shared";
import { MobileSheet } from "../modal";
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
  type SelectOptionRowSize,
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

export type CompactSelectMenuMobileListVariant = "framed" | "plain";

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
  triggerStyle?: CSSProperties;
  hideIndicator?: boolean;
  mobileSheet?: boolean;
  mobileSheetTitle?: ReactNode;
  mobileSheetSubtitle?: ReactNode;
  mobileSheetListVariant?: CompactSelectMenuMobileListVariant;
  mobileSheetOptionSize?: SelectOptionRowSize;
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
  triggerStyle,
  hideIndicator = false,
  mobileSheet = false,
  mobileSheetTitle,
  mobileSheetSubtitle,
  mobileSheetListVariant = "framed",
  mobileSheetOptionSize = "default",
}: CompactSelectMenuProps) {
  const generatedId = useId();
  const fieldId = id ?? `compact-select-menu-${generatedId}`;
  const isMobile = useIsMobile();
  const shouldUseMobileSheet = mobileSheet && isMobile;
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
    initialHighlightedIndex:
      filteredOptions.find((option) => option.value === value)?.index ?? -1,
    outsideDismiss: !shouldUseMobileSheet,
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
  const optionRowSize = shouldUseMobileSheet ? mobileSheetOptionSize : "default";
  const plainMobileList = shouldUseMobileSheet && mobileSheetListVariant === "plain";
  const optionRows =
    filteredOptions.length === 0 ? (
      <SelectEmptyState message={emptyMessage} />
    ) : (
      filteredGroups.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`}>
          {group.label ? (
            <div
              className={cx(
                "font-semibold uppercase text-[var(--color-gray-400)]",
                optionRowSize === "lg"
                  ? "px-3 pb-2 pt-3 text-[11px] tracking-[0.12em]"
                  : "px-[var(--spacing-md)] pb-1 pt-2 text-[10px] tracking-[0.08em]",
              )}
            >
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
                size={optionRowSize}
                trailing={
                  isSelected ? (
                    <CheckCircle2
                      size={optionRowSize === "lg" ? 18 : 16}
                      className={cx(
                        "mt-0.5 shrink-0",
                        getSelectedIndicatorClass(option.tone),
                      )}
                    />
                  ) : undefined
                }
              >
                <div
                  className={cx(
                    "flex min-w-0 items-center",
                    optionRowSize === "lg" ? "gap-3" : "gap-[var(--spacing-sm)]",
                  )}
                >
                  {option.leading ? (
                    <span className="shrink-0">{option.leading}</span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div
                      className={cx(
                        "truncate font-medium",
                        optionRowSize === "lg" ? "text-base" : "text-sm",
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
                          "mt-[2px] truncate",
                          optionRowSize === "lg" ? "text-sm" : "text-xs",
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
    );

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
        hideIndicator={hideIndicator}
        fullWidth={fullWidth}
        appearance={triggerAppearance}
        className={triggerClassName}
        style={triggerStyle}
        onClick={controller.toggle}
        onKeyDown={controller.handleTriggerKeyDown}
      >
        {triggerContent ?? (
          <span className="truncate">
            {selectedOption?.label ?? placeholder}
          </span>
        )}
      </SelectTrigger>

      {!shouldUseMobileSheet ? (
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
            {optionRows}
          </SelectList>
        </SelectDropdown>
      ) : (
        <MobileSheet
          isOpen={controller.isOpen}
          onClose={() => controller.close(false)}
          title={
            <div>
              <p className="truncate text-base font-semibold text-gray-900">
                {mobileSheetTitle ?? placeholder}
              </p>
              {mobileSheetSubtitle ? (
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {mobileSheetSubtitle}
                </p>
              ) : null}
            </div>
          }
        >
          <div className={plainMobileList ? "p-3" : "p-4"}>
            {searchable ? (
              <div
                className={
                  plainMobileList
                    ? "mb-4"
                    : "mb-4 overflow-hidden rounded-2xl border border-gray-100"
                }
              >
                <SelectSearchInput
                  inputRef={searchInputRef}
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onKeyDown={controller.handleListKeyDown}
                  placeholder={searchPlaceholder}
                />
              </div>
            ) : null}
            <div
              className={
                plainMobileList
                  ? "space-y-1"
                  : "overflow-hidden rounded-2xl border border-gray-100 p-1.5"
              }
            >
              <div
                id={controller.listId}
                role="listbox"
                tabIndex={-1}
                onKeyDown={controller.handleListKeyDown}
                className={plainMobileList ? "py-0" : "py-[var(--spacing-xs)]"}
              >
                {optionRows}
              </div>
            </div>
          </div>
        </MobileSheet>
      )}
    </div>
  );
}
