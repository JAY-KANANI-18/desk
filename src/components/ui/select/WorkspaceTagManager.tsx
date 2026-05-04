import { Plus, type AppIcon } from "@/components/ui/icons";
import { useMemo, useState, type ReactNode } from "react";
import { workspaceApi, type WorkspaceTagInput } from "../../../lib/workspaceApi";
import { Button } from "../button/Button";
import { IconButton } from "../button/IconButton";
import type { ButtonSize, ButtonVariant } from "../button/shared";
import {
  INITIAL_WORKSPACE_TAG_FORM,
  WorkspaceTagFormModal,
  type WorkspaceTagFormValue,
} from "../tag/WorkspaceTagFormModal";
import {
  WorkspaceTagSelect,
  type WorkspaceTagSelectOption,
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
    | "mobileSheet"
    | "mobileSheetSubtitle"
    | "mobileSheetTitle"
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
  addIcon?: AppIcon;
  allowCreate?: boolean;
  createModalTitle?: string;
  createActionLabel?: string;
  selectCreatedTag?: boolean;
  onTagCreated?: (tag: WorkspaceTagManagerCreatedTag) => void | Promise<void>;
}

export type WorkspaceTagManagerCreatedTag = {
  id: string;
  name: string;
  color?: string | null;
  emoji?: string | null;
  description?: string | null;
  bundle?: {
    color?: string | null;
    emoji?: string | null;
    description?: string | null;
  };
};

const labelClassNames: Record<
  WorkspaceTagManagerLabelAppearance,
  string
> = {
  form: "text-sm font-medium text-[var(--color-gray-700)]",
  field: "text-xs font-medium text-gray-600",
  sidebar: "text-[12px] font-semibold text-[#374151]",
  section: "text-xs font-medium uppercase tracking-wide text-gray-500",
};

const DEFAULT_TAG_COLOR = "tag-indigo";
const DEFAULT_TAG_EMOJI = "\u{1F3F7}\uFE0F";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readId(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;
}

function normalizeCreatedTag(
  response: unknown,
  fallback: WorkspaceTagFormValue,
): WorkspaceTagManagerCreatedTag {
  const source = isRecord(response) ? response : {};
  const bundle = isRecord(source.bundle) ? source.bundle : undefined;

  return {
    id: readId(source.id) ?? fallback.name,
    name: readString(source.name) ?? fallback.name,
    color:
      readString(bundle?.color) ??
      readString(source.color) ??
      fallback.color,
    emoji:
      readString(bundle?.emoji) ??
      readString(source.emoji) ??
      fallback.emoji,
    description:
      readString(bundle?.description) ??
      readString(source.description) ??
      fallback.description,
    bundle: bundle
      ? {
          color: readString(bundle.color) ?? null,
          emoji: readString(bundle.emoji) ?? null,
          description: readString(bundle.description) ?? null,
        }
      : undefined,
  };
}

function tagToOption(
  tag: WorkspaceTagManagerCreatedTag,
): WorkspaceTagSelectOption {
  return {
    value: String(tag.id),
    label: tag.name,
    color: tag.bundle?.color || tag.color || DEFAULT_TAG_COLOR,
    emoji: tag.bundle?.emoji || tag.emoji || DEFAULT_TAG_EMOJI,
    description: tag.bundle?.description || tag.description,
    data: tag,
  };
}

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
  mobileSheet = true,
  mobileSheetTitle,
  mobileSheetSubtitle,
  disabled = false,
  clearActionLabel,
  onClearAll,
  addButtonAriaLabel = "Add tag",
  closeButtonAriaLabel = "Close tag picker",
  addButtonVariant = "secondary",
  addButtonSize = "xs",
  addIcon: AddIcon = Plus,
  allowCreate = false,
  createModalTitle = "Create Tag",
  createActionLabel = "Create tag",
  selectCreatedTag = true,
  onTagCreated,
}: WorkspaceTagManagerProps) {
  const [createdTags, setCreatedTags] = useState<WorkspaceTagManagerCreatedTag[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<WorkspaceTagFormValue>(
    INITIAL_WORKSPACE_TAG_FORM,
  );

  const resolvedEmptySelectedContent = emptySelectedContent ?? (
    <p className="text-xs text-gray-400">No tags selected.</p>
  );
  const managedOptions = useMemo(() => {
    const optionValues = new Set(options.map((option) => option.value));
    const localOptions = createdTags
      .map(tagToOption)
      .filter((option) => !optionValues.has(option.value));

    return [...localOptions, ...options];
  }, [createdTags, options]);
  const resolvedEmptyActionLabel =
    emptyActionLabel ??
    (allowCreate ? ((query: string) => `Create "${query}" tag`) : undefined);
  const resolvedEmptyAction =
    onEmptyAction ??
    (allowCreate
      ? (query: string) => {
          setCreateForm({
            name: query.trim(),
            color: INITIAL_WORKSPACE_TAG_FORM.color,
            emoji: INITIAL_WORKSPACE_TAG_FORM.emoji,
            description: "",
          });
          setCreateError(null);
          setCreateOpen(true);
        }
      : undefined);

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
      return;
    }

    onChange?.([]);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateError(null);
    setCreateForm(INITIAL_WORKSPACE_TAG_FORM);
  };

  const handleCreateTag = async () => {
    const name = createForm.name.trim();
    if (!name || creating) return;

    const payload: WorkspaceTagInput = {
      name,
      color: createForm.color,
      emoji: createForm.emoji,
      description: createForm.description.trim(),
    };

    setCreating(true);
    setCreateError(null);
    try {
      const response: unknown = await workspaceApi.addTag(payload);
      const createdTag = normalizeCreatedTag(response, {
        ...createForm,
        name,
        description: payload.description ?? "",
      });
      const createdOption = tagToOption(createdTag);

      setCreatedTags((current) => [
        createdTag,
        ...current.filter(
          (tag) =>
            String(tag.id) !== String(createdTag.id) &&
            tag.name.trim().toLowerCase() !==
              createdTag.name.trim().toLowerCase(),
        ),
      ]);

      await onTagCreated?.(createdTag);

      if (selectCreatedTag) {
        if (onToggleOption) {
          await onToggleOption(createdOption, true);
        } else if (!value.includes(createdOption.value)) {
          onChange?.([...value, createdOption.value]);
        }
      }

      setCreateOpen(false);
      setCreateForm(INITIAL_WORKSPACE_TAG_FORM);
    } catch {
      setCreateError("Failed to create tag. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <WorkspaceTagSelect
        options={managedOptions}
        value={value}
        onChange={onChange}
        onToggleOption={onToggleOption}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        emptyActionLabel={resolvedEmptyActionLabel}
        onEmptyAction={resolvedEmptyAction}
        selectedDisplay="below"
        selectedAppearance={selectedAppearance}
        optionAppearance={optionAppearance}
        dropdownPlacement={dropdownPlacement}
        dropdownAlign={dropdownAlign}
        dropdownWidth={dropdownWidth}
        menuTitle={menuTitle}
        mobileSheet={mobileSheet}
        mobileSheetTitle={mobileSheetTitle ?? (typeof label === "string" ? label : "Tags")}
        mobileSheetSubtitle={mobileSheetSubtitle}
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

      <WorkspaceTagFormModal
        open={createOpen}
        mode="create"
        onClose={closeCreateModal}
        onSave={handleCreateTag}
        value={createForm}
        onChange={setCreateForm}
        saving={creating}
        error={createError}
        createTitle={createModalTitle}
        createSubmitLabel={createActionLabel}
      />
    </div>
  );
}
