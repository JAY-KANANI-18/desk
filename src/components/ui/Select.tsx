import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import {
  FieldShell,
  getDescriptionId,
  getInputControlClassName,
  getInputControlStyle,
  type FieldLabelVariant,
  type InputAppearance,
  type InputSize,
} from "./inputs/shared";

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  size?: InputSize;
  appearance?: InputAppearance;
  labelVariant?: FieldLabelVariant;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      options,
      size = "md",
      appearance = "default",
      labelVariant = "default",
      className,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const descriptionId = getDescriptionId(
      selectId,
      Boolean(error || helperText),
    );

    return (
      <FieldShell
        id={selectId}
        label={label}
        required={required}
        error={error}
        hint={helperText}
        labelVariant={labelVariant}
      >
        <select
          {...props}
          ref={ref}
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={descriptionId}
          className={getInputControlClassName({
            size,
            appearance,
            className,
          })}
          style={getInputControlStyle({
            hasError: Boolean(error),
          })}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  },
);

Select.displayName = "Select";

export {
  BaseSelect,
  CompactSelectMenu,
  MultiSelect,
  SearchableSelect,
  SelectWithIconLabel,
  TagSelect,
  UserAssignSelect,
  VariableSuggestionMenu,
  WorkspaceTagManager,
  WorkspaceTagSelect,
} from "./select/index";
export type {
  BaseSelectProps,
  CompactSelectMenuDescriptionTone,
  CompactSelectMenuGroup,
  CompactSelectMenuOption,
  CompactSelectMenuProps,
  MultiSelectProps,
  SearchableSelectProps,
  SelectOption,
  SelectOptionSurface,
  SelectOptionTone,
  SelectSize,
  SelectTriggerAppearance,
  SelectWithIconLabelProps,
  TagSelectGroup,
  TagSelectOption,
  TagSelectProps,
  UserSelectOption,
  UserAssignSelectProps,
  VariableSuggestionMenuProps,
  VariableSuggestionOption,
  WorkspaceTagManagerLabelAppearance,
  WorkspaceTagManagerProps,
  WorkspaceTagSelectOption,
  WorkspaceTagSelectProps,
  WorkspaceTagSelectRenderTriggerProps,
} from "./select/index";
