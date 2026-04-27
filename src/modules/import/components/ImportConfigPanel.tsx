import { useMemo } from "react";
import { CheckboxInput } from "../../../components/ui/inputs";
import { Select } from "../../../components/ui/Select";
import { WorkspaceTagManager } from "../../../components/ui/select";

type TagOption = {
  id: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  description?: string | null;
};

type Props = {
  matchBy: "phone" | "email";
  importMode: "create" | "update" | "upsert" | "overwrite";
  tags: string[];
  autoGenerateBatchTag: boolean;
  availableTags: TagOption[];
  onChange: (
    patch: Partial<{
      matchBy: "phone" | "email";
      importMode: "create" | "update" | "upsert" | "overwrite";
      tags: string[];
      autoGenerateBatchTag: boolean;
    }>,
  ) => void;
};

const modeDescriptions: Record<Props["importMode"], string> = {
  create: "Skip rows that already match an existing contact.",
  update: "Only update rows that already exist.",
  upsert: "Create new contacts and update matching ones.",
  overwrite: "Update matches and clear mapped empty values.",
};

const importModeOptions = [
  { value: "create", label: "Create only" },
  { value: "update", label: "Update only" },
  { value: "upsert", label: "Upsert" },
  { value: "overwrite", label: "Overwrite" },
] satisfies Array<{ value: Props["importMode"]; label: string }>;

const matchByOptions = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
] satisfies Array<{ value: Props["matchBy"]; label: string }>;

export function ImportConfigPanel({
  matchBy,
  importMode,
  tags,
  autoGenerateBatchTag,
  availableTags,
  onChange,
}: Props) {
  const tagOptions = useMemo(
    () =>
      availableTags.map((tag) => ({
        value: tag.id,
        label: tag.name,
        emoji: tag.emoji,
        color: tag.color,
        description: tag.description,
      })),
    [availableTags],
  );

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-[160px] flex-1">
          <Select
            id="import-mode"
            label="Import Mode"
            value={importMode}
            onChange={(event) =>
              onChange({
                importMode: event.target.value as Props["importMode"],
              })
            }
            options={importModeOptions}
            helperText={modeDescriptions[importMode]}
          />
        </div>

        <div className="min-w-[140px] flex-1">
          <Select
            id="match-by"
            label="Match By"
            value={matchBy}
            onChange={(event) =>
              onChange({
                matchBy: event.target.value as Props["matchBy"],
              })
            }
            options={matchByOptions}
            helperText="Field used to match existing contacts."
          />
        </div>

        <div className="min-w-[240px] flex-1 pt-1 lg:max-w-[280px] lg:pt-6">
          <CheckboxInput
            checked={autoGenerateBatchTag}
            onChange={(checked) =>
              onChange({ autoGenerateBatchTag: checked })
            }
            label="Auto batch tag"
            description="Add an automatic batch tag so this import can be filtered later."
          />
        </div>
      </div>

      <div className="border-t border-gray-100" />

      <WorkspaceTagManager
        label="Add Tags"
        labelAppearance="section"
        options={tagOptions}
        value={tags}
        onChange={(nextTags) => onChange({ tags: nextTags })}
        searchPlaceholder="Search tags"
        emptyMessage="No workspace tags available."
        selectedAppearance="tag"
        optionAppearance="tag"
        clearActionLabel="Clear all"
        emptySelectedContent={
          <p className="text-xs text-gray-400">No tags added.</p>
        }
      />
    </div>
  );
}
