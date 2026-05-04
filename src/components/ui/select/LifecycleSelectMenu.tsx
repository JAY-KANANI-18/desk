import { useId, useMemo } from "react";
import { FieldShell, cx } from "../inputs/shared";
import {
  CompactSelectMenu,
  type CompactSelectMenuGroup,
  type CompactSelectMenuOption,
  type CompactSelectMenuProps,
} from "./CompactSelectMenu";

export type LifecycleSelectMenuVariant = "inline" | "field" | "sidebar";

export interface LifecycleSelectStage {
  id: string | number;
  name: string;
  emoji?: string | null;
  type?: string | null;
  [key: string]: unknown;
}

export interface LifecycleSelectMenuProps<TStage extends LifecycleSelectStage>
  extends Pick<
    CompactSelectMenuProps,
    | "disabled"
    | "dropdownAlign"
    | "dropdownPlacement"
    | "dropdownWidth"
    | "emptyMessage"
    | "mobileSheet"
    | "mobileSheetSubtitle"
    | "mobileSheetTitle"
    | "searchable"
    | "searchPlaceholder"
  > {
  stages: TStage[];
  value?: string | number | null;
  onChange: (stageId: string | null, stage: TStage | null) => void;
  variant?: LifecycleSelectMenuVariant;
  label?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  noneLabel?: string;
  fallbackLabel?: string;
  className?: string;
  triggerClassName?: string;
  lifecycleGroupLabel?: string;
  lostGroupLabel?: string;
  allowEmpty?: boolean;
  fullWidth?: boolean;
}

const NO_STAGE_VALUE = "__no-stage__";

function getStageType(stage: LifecycleSelectStage) {
  return String(stage.type ?? "lifecycle").toLowerCase();
}

function isLostStage(stage: LifecycleSelectStage) {
  return getStageType(stage) === "lost";
}

function getStageValue(stage: LifecycleSelectStage) {
  return String(stage.id);
}

function getStageSearchText(stage: LifecycleSelectStage) {
  return [stage.name, stage.emoji, stage.type].filter(Boolean).join(" ");
}

function getStageLeading(stage: LifecycleSelectStage) {
  return (
    <span className="w-4 text-center text-sm leading-none">
      {stage.emoji || "-"}
    </span>
  );
}

function stageToOption(stage: LifecycleSelectStage): CompactSelectMenuOption {
  return {
    value: getStageValue(stage),
    label: stage.name,
    leading: getStageLeading(stage),
    tone: isLostStage(stage) ? "warning" : "primary",
    searchText: getStageSearchText(stage),
  };
}

function emptyOption(label: string): CompactSelectMenuOption {
  return {
    value: NO_STAGE_VALUE,
    label,
    leading: <span className="w-4 text-center leading-none">-</span>,
    tone: "neutral",
    alwaysVisible: true,
  };
}

function getTriggerLabel(
  selectedStage: LifecycleSelectStage | null,
  fallbackLabel: string | undefined,
  placeholder: string,
) {
  return selectedStage?.name || fallbackLabel || placeholder;
}

function renderTriggerContent({
  selectedStage,
  fallbackLabel,
  placeholder,
  variant,
}: {
  selectedStage: LifecycleSelectStage | null;
  fallbackLabel?: string;
  placeholder: string;
  variant: LifecycleSelectMenuVariant;
}) {
  const label = getTriggerLabel(selectedStage, fallbackLabel, placeholder);
  const isLost = selectedStage ? isLostStage(selectedStage) : false;
  const textClassName =
    variant === "inline"
      ? "truncate text-sm font-medium"
      : "min-w-0 flex-1 truncate";

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {selectedStage?.emoji ? (
        <span className="text-sm leading-none">{selectedStage.emoji}</span>
      ) : null}
      <span
        className={cx(
          textClassName,
          isLost ? "text-[#c2410c]" : "text-[var(--color-gray-500)]",
        )}
      >
        {label}
      </span>
    </span>
  );
}

export function LifecycleSelectMenu<TStage extends LifecycleSelectStage>({
  stages,
  value,
  onChange,
  variant = "field",
  label,
  required = false,
  hint,
  placeholder,
  noneLabel,
  fallbackLabel,
  className,
  triggerClassName,
  lifecycleGroupLabel = "Lifecycle",
  lostGroupLabel = "Lost",
  allowEmpty = true,
  fullWidth,
  disabled = false,
  dropdownAlign = "start",
  dropdownPlacement,
  dropdownWidth,
  emptyMessage = "No stages configured",
  mobileSheet = true,
  mobileSheetTitle,
  mobileSheetSubtitle,
  searchable = false,
  searchPlaceholder = "Search stages",
}: LifecycleSelectMenuProps<TStage>) {
  const generatedId = useId();
  const fieldId = `lifecycle-select-menu-${generatedId}`;
  const resolvedPlaceholder =
    placeholder ?? (variant === "field" ? "Select lifecycle" : "No stage");
  const emptyLabel = noneLabel ?? (variant === "field" ? "Any stage" : "No stage");
  const selectedValue =
    value === null || value === undefined || value === ""
      ? NO_STAGE_VALUE
      : String(value);
  const selectedStage =
    stages.find((stage) => getStageValue(stage) === selectedValue) ?? null;
  const hasValue =
    selectedValue !== NO_STAGE_VALUE || Boolean(fallbackLabel);

  const menuGroups = useMemo<CompactSelectMenuGroup[]>(() => {
    const lifecycleStages = stages.filter((stage) => !isLostStage(stage));
    const lostStages = stages.filter(isLostStage);

    return [
      ...(allowEmpty
        ? [
            {
              options: [emptyOption(emptyLabel)],
            },
          ]
        : []),
      ...(lifecycleStages.length > 0
        ? [
            {
              label: lifecycleGroupLabel,
              options: lifecycleStages.map(stageToOption),
            },
          ]
        : []),
      ...(lostStages.length > 0
        ? [
            {
              label: lostGroupLabel,
              options: lostStages.map(stageToOption),
            },
          ]
        : []),
    ];
  }, [allowEmpty, emptyLabel, lifecycleGroupLabel, lostGroupLabel, stages]);

  const menu = (
    <CompactSelectMenu
      id={fieldId}
      value={selectedValue}
      groups={menuGroups}
      onChange={(nextValue) => {
        if (nextValue === NO_STAGE_VALUE) {
          onChange(null, null);
          return;
        }

        const nextStage =
          stages.find((stage) => getStageValue(stage) === nextValue) ?? null;
        onChange(nextValue, nextStage);
      }}
      triggerAppearance={variant === "inline" || variant === "sidebar" ? "inline" : "field"}
      size="sm"
      hasValue={hasValue}
      fullWidth={fullWidth ?? variant !== "inline"}
      dropdownWidth={
        dropdownWidth ?? (variant === "inline" ? "md" : "trigger")
      }
      dropdownAlign={dropdownAlign}
      dropdownPlacement={dropdownPlacement ?? "bottom"}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      mobileSheet={mobileSheet}
      mobileSheetTitle={mobileSheetTitle ?? label ?? "Select lifecycle"}
      mobileSheetSubtitle={mobileSheetSubtitle}
      mobileSheetListVariant="plain"
      mobileSheetOptionSize="lg"
      disabled={disabled}
      placeholder={resolvedPlaceholder}
      triggerClassName={cx(
        variant === "sidebar" && "py-0.5 text-[13px] leading-snug",
        triggerClassName,
      )}
      triggerContent={renderTriggerContent({
        selectedStage,
        fallbackLabel,
        placeholder: selectedValue === NO_STAGE_VALUE ? emptyLabel : resolvedPlaceholder,
        variant,
      })}
    />
  );

  if (label || hint) {
    return (
      <div className={className}>
        <FieldShell id={fieldId} label={label} required={required} hint={hint}>
          {menu}
        </FieldShell>
      </div>
    );
  }

  if (className) {
    return <div className={className}>{menu}</div>;
  }

  return menu;
}
