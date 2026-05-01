import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { MobileSheet } from "../modal";
import { Tag } from "../tag/Tag";
import {
  SelectChip,
  SelectDropdown,
  SelectEmptyState,
  SelectField,
  SelectList,
  SelectMenuHeader,
  SelectOptionLabel,
  SelectOptionRow,
  SelectSearchInput,
  SelectTrigger,
  getSelectOptionId,
  useSelectController,
  type SelectFieldProps,
  type SelectSize,
} from "./shared";

export interface WorkspaceTagSelectOption {
  value: string;
  label: string;
  color?: string | null;
  emoji?: string | null;
  description?: string | null;
  disabled?: boolean;
  busy?: boolean;
  data?: unknown;
}

export interface WorkspaceTagSelectRenderTriggerProps {
  disabled: boolean;
  error?: string;
  id: string;
  isOpen: boolean;
  listId: string;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onToggle: () => void;
  selectedOptions: WorkspaceTagSelectOption[];
  size: SelectSize;
  triggerRef: RefObject<HTMLButtonElement>;
}

export interface WorkspaceTagSelectProps extends SelectFieldProps {
  options: WorkspaceTagSelectOption[];
  value: string[];
  onChange?: (value: string[]) => void;
  onToggleOption?: (
    option: WorkspaceTagSelectOption,
    nextSelected: boolean,
  ) => void | Promise<void>;
  searchPlaceholder?: string;
  selectedDisplay?: "trigger" | "below" | "none";
  selectedAppearance?: "chip" | "tag";
  optionAppearance?: "label" | "tag";
  triggerSummary?:
    | ReactNode
    | ((
        selectedOptions: WorkspaceTagSelectOption[],
        allOptions: WorkspaceTagSelectOption[],
      ) => ReactNode);
  clearActionLabel?: string;
  emptyActionLabel?: string | ((query: string) => string);
  onEmptyAction?: (query: string) => void;
  dropdownPlacement?: "top" | "bottom";
  dropdownAlign?: "start" | "end";
  dropdownWidth?: "trigger" | "sm" | "md" | "lg";
  menuTitle?: string;
  emptySelectedContent?: ReactNode;
  mobileSheet?: boolean;
  mobileSheetTitle?: ReactNode;
  mobileSheetSubtitle?: ReactNode;
  renderTrigger?: (
    props: WorkspaceTagSelectRenderTriggerProps,
  ) => ReactNode;
}

function formatTagLabel(option: WorkspaceTagSelectOption) {
  return option.emoji
    ? `${option.emoji} ${option.label}`
    : option.label;
}

export function WorkspaceTagSelect({
  id,
  name,
  label,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  onToggleOption,
  placeholder = "Select tags",
  disabled = false,
  size = "md",
  emptyMessage = "No tags available.",
  className,
  searchPlaceholder = "Search tags",
  selectedDisplay = "trigger",
  selectedAppearance = "chip",
  optionAppearance = "label",
  triggerSummary,
  clearActionLabel = "Clear all",
  emptyActionLabel,
  onEmptyAction,
  dropdownPlacement = "bottom",
  dropdownAlign = "start",
  dropdownWidth = "trigger",
  menuTitle = "Tags",
  emptySelectedContent,
  mobileSheet = false,
  mobileSheetTitle,
  mobileSheetSubtitle,
  renderTrigger,
}: WorkspaceTagSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? `workspace-tag-select-${generatedId}`;
  const isMobile = useIsMobile();
  const shouldUseMobileSheet = mobileSheet && isMobile;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const searchableText = [
        option.label,
        option.description,
        option.emoji,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [options, searchTerm]);

  const selectedOptions = useMemo(() => {
    const optionByValue = new Map(options.map((option) => [option.value, option]));
    return value
      .map((selectedValue) => optionByValue.get(selectedValue))
      .filter(
        (option): option is WorkspaceTagSelectOption => Boolean(option),
      );
  }, [options, value]);

  const updateValue = (option: WorkspaceTagSelectOption) => {
    const nextSelected = !value.includes(option.value);

    if (onToggleOption) {
      void onToggleOption(option, nextSelected);
      return;
    }

    if (nextSelected) {
      onChange?.([...value, option.value]);
      return;
    }

    onChange?.(value.filter((currentValue) => currentValue !== option.value));
  };

  const controller = useSelectController({
    options: filteredOptions,
    disabled,
    closeOnSelect: false,
    getOptionDisabled: (option) => Boolean(option.disabled || option.busy),
    outsideDismiss: !shouldUseMobileSheet,
    onSelect: (option) => updateValue(option),
  });

  const runEmptyAction = (query: string) => {
    if (!onEmptyAction) return;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    controller.close(false);
    onEmptyAction(trimmedQuery);
  };

  useEffect(() => {
    if (!controller.isOpen) {
      setSearchTerm("");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [controller.isOpen]);

  const triggerContent =
    selectedDisplay === "trigger" && selectedOptions.length > 0 ? (
      <span className="flex flex-wrap gap-[var(--spacing-xs)]">
        {selectedOptions.map((option) => (
          <SelectChip
            key={option.value}
            label={formatTagLabel(option)}
            onRemove={
              option.busy ? undefined : () => updateValue(option)
            }
          />
        ))}
      </span>
    ) : triggerSummary ? (
      typeof triggerSummary === "function" ? (
        triggerSummary(selectedOptions, options)
      ) : (
        triggerSummary
      )
    ) : (
      <span>{placeholder}</span>
    );

  const triggerNode = renderTrigger ? (
    renderTrigger({
      disabled,
      error,
      id: fieldId,
      isOpen: controller.isOpen,
      listId: controller.listId,
      onKeyDown: controller.handleTriggerKeyDown,
      onToggle: controller.toggle,
      selectedOptions,
      size,
      triggerRef: controller.triggerRef,
    })
  ) : (
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
      {triggerContent}
    </SelectTrigger>
  );

  const selectedListNode =
    selectedDisplay === "below" ? (
      selectedOptions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-[var(--spacing-xs)]">
          {selectedOptions.map((option) =>
            selectedAppearance === "tag" ? (
              <Tag
                key={option.value}
                label={option.label}
                emoji={option.emoji || undefined}
                bgColor={option.color || "tag-indigo"}
                size="sm"
                disabled={option.disabled || option.busy}
                icon={
                  option.busy ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : undefined
                }
                onRemove={
                  option.busy ? undefined : () => updateValue(option)
                }
              />
            ) : (
              <SelectChip
                key={option.value}
                label={formatTagLabel(option)}
                onRemove={
                  option.busy ? undefined : () => updateValue(option)
                }
              />
            ),
          )}
        </div>
      ) : emptySelectedContent ? (
        <div className="mt-2">{emptySelectedContent}</div>
      ) : null
    ) : null;

  const optionRows =
    filteredOptions.length === 0 ? (
      <>
        <SelectEmptyState message={emptyMessage} />
        {onEmptyAction && emptyActionLabel && searchTerm.trim() ? (
          <div className="border-t border-[var(--color-gray-200)] p-[var(--spacing-sm)]">
            <button
              type="button"
              onClick={() => runEmptyAction(searchTerm)}
              className="w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-primary)] bg-[var(--color-primary-light)] px-[var(--spacing-md)] py-[var(--spacing-sm)] text-left text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-gray-50)]"
            >
              {typeof emptyActionLabel === "function"
                ? emptyActionLabel(searchTerm.trim())
                : emptyActionLabel}
            </button>
          </div>
        ) : null}
      </>
    ) : (
      filteredOptions.map((option, index) => (
        <SelectOptionRow
          key={option.value}
          id={getSelectOptionId(controller.listId, index)}
          selected={value.includes(option.value)}
          highlighted={controller.highlightedIndex === index}
          disabled={option.disabled || option.busy}
          onSelect={() => controller.selectByIndex(index)}
          onMouseEnter={() => controller.setHighlightedIndex(index)}
          trailing={
            option.busy ? (
              <Loader2
                size={16}
                className="mt-0.5 shrink-0 animate-spin text-[var(--color-primary)]"
              />
            ) : undefined
          }
        >
          {optionAppearance === "tag" ? (
            <div className="space-y-[6px]">
              <Tag
                label={option.label}
                emoji={option.emoji || undefined}
                bgColor={option.color || "tag-indigo"}
                size="sm"
              />
              {option.description ? (
                <p className="text-xs text-[var(--color-gray-500)]">
                  {option.description}
                </p>
              ) : null}
            </div>
          ) : (
            <SelectOptionLabel
              label={option.label}
              subtitle={option.description}
            />
          )}
        </SelectOptionRow>
      ))
    );

  const menuContent = (
    <>
      <SelectMenuHeader
        title={menuTitle}
        actionLabel={selectedOptions.length > 0 ? clearActionLabel : undefined}
        onAction={selectedOptions.length > 0 ? () => onChange?.([]) : undefined}
      />

      <SelectSearchInput
        inputRef={searchInputRef}
        value={searchTerm}
        onChange={setSearchTerm}
        onKeyDown={controller.handleListKeyDown}
        placeholder={searchPlaceholder}
      />

      <SelectList id={controller.listId} onKeyDown={controller.handleListKeyDown}>
        {optionRows}
      </SelectList>
    </>
  );

  const content = (
    <div ref={controller.containerRef} className="relative">
      {triggerNode}
      {selectedListNode}

      {!shouldUseMobileSheet ? (
        <SelectDropdown
          isOpen={controller.isOpen}
          placement={dropdownPlacement}
          align={dropdownAlign}
          width={dropdownWidth}
        >
          {menuContent}
        </SelectDropdown>
      ) : (
        <MobileSheet
          isOpen={controller.isOpen}
          onClose={() => controller.close(false)}
          title={
            <div>
              <p className="truncate text-base font-semibold text-slate-900">
                {mobileSheetTitle ?? menuTitle ?? placeholder}
              </p>
              {mobileSheetSubtitle ? (
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {mobileSheetSubtitle}
                </p>
              ) : null}
            </div>
          }
        >
          <div className="p-4">
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              {menuContent}
            </div>
          </div>
        </MobileSheet>
      )}
    </div>
  );

  return (
    <SelectField
      id={fieldId}
      label={label}
      required={required}
      error={error}
      hint={hint}
    >
      {content}
    </SelectField>
  );
}
