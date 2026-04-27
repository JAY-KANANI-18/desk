import { Plus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../button/Button";
import { IconButton } from "../button/IconButton";
import type { ButtonSize, ButtonVariant } from "../button/shared";
import {
  WorkspaceTagSelect,
  type WorkspaceTagSelectProps,
} from "./WorkspaceTagSelect";

export type WorkspaceTagManagerLabelAppearance =
  | "form"
  | "field"
  | "sidebar"
  | "section";

export interface WorkspaceTagManagerProps
  extends Pick<
    WorkspaceTagSelectProps,
    | "disabled"
    | "dropdownAlign"
    | "dropdownPlacement"
    | "dropdownWidth"
    | "emptyActionLabel"
    | "emptyMessage"
    | "emptySelectedContent"
    | "menuTitle"
    | "onChange"
    | "onEmptyAction"
    | "onToggleOption"
    | "optionAppearance"
    | "options"
    | "searchPlaceholder"
    | "selectedAppearance"
    | "value"
  > {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  labelAppearance?: WorkspaceTagManagerLabelAppearance;
  clearActionLabel?: string;
  onClearAll?: () => void;
  addButtonAriaLabel?: string;
  closeButtonAriaLabel?: string;
  addButtonVariant?: ButtonVariant;
  addButtonSize?: ButtonSize;
  addIcon?: LucideIcon;
}

const labelClassNames: Record<
  WorkspaceTagManagerLabelAppearance,
  string
> = {
  form: "text-sm font-medium text-[var(--color-gray-700)]",
  field: "text-xs font-medium text-gray-600",
  sidebar: "text-[12px] font-semibold text-[#374151]",
  section: "text-xs font-medium uppercase tracking-wide text-gray-500",
};

export function WorkspaceTagManager({
  label = "Tags",
  required = false,
  hint,
  labelAppearance = "field",
  options,
  value,
  onChange,
  onToggleOption,
  onEmptyAction,
  emptyActionLabel,
  emptyMessage = "No tags found.",
  emptySelectedContent,
  searchPlaceholder = "Search tags",
  selectedAppearance = "tag",
  optionAppearance = "tag",
  dropdownPlacement = "bottom",
  dropdownAlign = "start",
  dropdownWidth = "trigger",
  menuTitle,
  disabled = false,
  clearActionLabel,
  onClearAll,
  addButtonAriaLabel = "Add tag",
  closeButtonAriaLabel = "Close tag picker",
  addButtonVariant = "secondary",
  addButtonSize = "xs",
  addIcon: AddIcon = Plus,
}: WorkspaceTagManagerProps) {
  const resolvedEmptySelectedContent = emptySelectedContent ?? (
    <p className="text-xs text-gray-400">No tags selected.</p>
  );

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
      return;
    }

    onChange?.([]);
  };

  return (
    <div className="space-y-2">
      <WorkspaceTagSelect
        options={options}
        value={value}
        onChange={onChange}
        onToggleOption={onToggleOption}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        emptyActionLabel={emptyActionLabel}
        onEmptyAction={onEmptyAction}
        selectedDisplay="below"
        selectedAppearance={selectedAppearance}
        optionAppearance={optionAppearance}
        dropdownPlacement={dropdownPlacement}
        dropdownAlign={dropdownAlign}
        dropdownWidth={dropdownWidth}
        menuTitle={menuTitle}
        clearActionLabel={undefined}
        emptySelectedContent={resolvedEmptySelectedContent}
        disabled={disabled}
        renderTrigger={({
          id,
          isOpen,
          listId,
          onKeyDown,
          onToggle,
          selectedOptions,
          triggerRef,
        }) => (
          <div className="flex items-center justify-between gap-2">
            {label ? (
              <span className={labelClassNames[labelAppearance]}>
                {label}
                {required ? (
                  <span className="ml-0.5 text-gray-400">*</span>
                ) : null}
              </span>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              {clearActionLabel &&
              selectedOptions.length > 0 &&
              (onClearAll || onChange) ? (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={handleClearAll}
                  disabled={disabled}
                >
                  {clearActionLabel}
                </Button>
              ) : null}

              <IconButton
                ref={triggerRef}
                id={id}
                type="button"
                onClick={onToggle}
                onKeyDown={onKeyDown}
                icon={<AddIcon size={addButtonSize === "xs" ? 14 : 16} />}
                size={addButtonSize}
                variant={addButtonVariant}
                disabled={disabled}
                aria-label={
                  isOpen ? closeButtonAriaLabel : addButtonAriaLabel
                }
                aria-controls={listId}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
              />
            </div>
          </div>
        )}
      />

      {hint ? (
        <p className="text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}
