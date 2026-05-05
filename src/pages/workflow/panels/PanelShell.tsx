import React, { ReactNode } from "react";
import { X } from "@/components/ui/icons";
import { IconButton } from "../../../components/ui/button/IconButton";
import { DisclosureButton } from "../../../components/ui/button/DisclosureButton";
import { ToggleSwitch } from "../../../components/ui/toggle/ToggleSwitch";
import {
  BaseInput,
  type BaseInputProps,
} from "../../../components/ui/inputs/BaseInput";
import { TextareaInput } from "../../../components/ui/inputs/TextareaInput";
import { TagInput as SharedTagInput } from "../../../components/ui/inputs/TagInput";
import { BaseSelect } from "../../../components/ui/select/BaseSelect";

interface PanelShellProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  hideHeader?: boolean;
  children: ReactNode;
}

export function PanelShell({
  title,
  subtitle,
  onClose,
  hideHeader = false,
  children,
}: PanelShellProps) {
  return (
    <div
      className={`flex h-full flex-col bg-white ${
        hideHeader ? "overflow-visible" : "overflow-hidden"
      }`}
    >
      {!hideHeader ? (
        <div className="flex flex-shrink-0 items-start gap-3 border-b border-gray-100 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
            ) : null}
          </div>
          {onClose ? (
            <IconButton
              aria-label="Close configuration panel"
              icon={<X size={15} />}
              onClick={onClose}
              variant="ghost"
              size="xs"
              className="flex-shrink-0"
            />
          ) : null}
        </div>
      ) : null}

      <div className={hideHeader ? "min-h-0 flex-1" : "flex-1 overflow-y-auto"}>
        {children}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function Section({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  className = "",
}: SectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className={`border-b border-gray-100 last:border-0 ${className}`}>
      {collapsible ? (
        <DisclosureButton
          open={open}
          appearance="plain"
          size="sm"
          onClick={() => setOpen((value) => !value)}
        >
          {title}
        </DisclosureButton>
      ) : (
        <div className="flex w-full items-center justify-between px-4 py-3 text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {title}
          </span>
        </div>
      )}

      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
  className = "",
}: FieldProps) {
  return (
    <div className={`mb-3 ${className}`}>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
        {required ? <span className="ml-0.5 text-gray-400">*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="flex-1">
        <p className="text-sm text-gray-700">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-gray-400">{description}</p>
        ) : null}
      </div>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        size="sm"
        aria-label={label}
        className="mt-0.5 flex-shrink-0"
      />
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: SelectProps) {
  const resolvedOptions = placeholder
    ? [{ value: "", label: placeholder }, ...options]
    : options;

  return (
    <BaseSelect
      value={value}
      onChange={onChange}
      options={resolvedOptions}
      placeholder={placeholder}
      size="sm"
      className={className}
    />
  );
}

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: BaseInputProps["type"];
}

export function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  className = "",
  type = "text",
}: TextInputProps) {
  return (
    <BaseInput
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      size="sm"
      className={className}
    />
  );
}

interface TextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  maxLength?: number;
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  className = "",
  maxLength,
}: TextareaProps) {
  return (
    <div>
      <TextareaInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        size="sm"
        className={className}
      />
      {maxLength ? (
        <p className="mt-0.5 text-right text-xs text-gray-300">
          {value.length}/{maxLength}
        </p>
      ) : null}
    </div>
  );
}

interface TagInputProps {
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  suggestions?: any[];
}

export function TagInput({
  values,
  onChange,
  placeholder,
  suggestions = [],
}: TagInputProps) {
  const normalizedSuggestions = suggestions.map((suggestion) => ({
    value: String(
      suggestion?.id ?? suggestion?.value ?? suggestion?.name ?? "",
    ),
    label: String(
      suggestion?.name ?? suggestion?.label ?? suggestion?.id ?? "",
    ),
  }));
  const labelByValue = new Map(
    normalizedSuggestions.map((suggestion) => [
      suggestion.value,
      suggestion.label,
    ]),
  );

  return (
    <SharedTagInput
      values={values}
      onChange={onChange}
      placeholder={placeholder}
      suggestions={normalizedSuggestions}
      getValueLabel={(value) => labelByValue.get(value) ?? value}
      maxTagWidth={180}
    />
  );
}

interface InfoBoxProps {
  children: ReactNode;
  type?: "info" | "warning" | "tip";
}

export function InfoBox({ children, type = "info" }: InfoBoxProps) {
  return (
    <div className="flex gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
      <span className="mt-px flex-shrink-0">
        {type === "warning" ? "!" : "i"}
      </span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

interface DurationInputProps {
  value: number;
  unit: "seconds" | "minutes" | "hours" | "days";
  onValueChange: (v: number) => void;
  onUnitChange: (u: "seconds" | "minutes" | "hours" | "days") => void;
  max?: number;
}

export function DurationInput({
  value,
  unit,
  onValueChange,
  onUnitChange,
  max,
}: DurationInputProps) {
  return (
    <div className="flex gap-2">
      <BaseInput
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(event) => onValueChange(Number(event.target.value))}
        size="sm"
        className="flex-1"
      />
      <BaseSelect
        value={unit}
        onChange={(nextUnit) =>
          onUnitChange(nextUnit as DurationInputProps["unit"])
        }
        size="sm"
        options={[
          { value: "seconds", label: "Seconds" },
          { value: "minutes", label: "Minutes" },
          { value: "hours", label: "Hours" },
          { value: "days", label: "Days" },
        ]}
        className="w-32"
      />
    </div>
  );
}
