import { useCallback, useEffect, useMemo, useState } from "react";
import { workspaceApi } from "../../../../lib/workspaceApi";
import type { ConversationTag } from "../../../workspace/types";
import type { SP, UpdateContactTagData } from "../../workflow.types";
import { BaseSelect, WorkspaceTagManager } from "../../../../components/ui/select";
import { Field, Section } from "../PanelShell";

const actionOptions = [
  { value: "add", label: "Add Tag(s)" },
  { value: "remove", label: "Remove Tag(s)" },
] as const;

export function UpdateContactTagConfig({ step, onChange }: SP) {
  const [tags, setTags] = useState<ConversationTag[]>([]);
  const data = step.data as UpdateContactTagData;
  const updateData = (patch: Partial<UpdateContactTagData>) =>
    onChange({ ...data, ...patch });

  const load = useCallback(async () => {
    try {
      const response = await workspaceApi.getTags();
      setTags(Array.isArray(response) ? response : []);
    } catch {
      setTags([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tagOptions = useMemo(() => {
    const options = tags.map((tag) => ({
      value: String(tag.id),
      label: tag.name,
      emoji: tag.bundle?.emoji ?? tag.emoji,
      color: tag.bundle?.color ?? tag.color,
      description: tag.bundle?.description ?? tag.description,
    }));

    const existingValues = new Set(options.map((option) => option.value));

    data.tags.forEach((tagValue) => {
      if (!existingValues.has(tagValue)) {
        options.unshift({
          value: tagValue,
          label: tagValue,
        });
      }
    });

    return options;
  }, [data.tags, tags]);

  return (
    <Section title="Configuration">
      <Field label="Action" required>
        <BaseSelect
          value={data.action}
          onChange={(value) =>
            updateData({ action: value as "add" | "remove" })
          }
          options={actionOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </Field>

      <WorkspaceTagManager
        label="Tags"
        required
        options={tagOptions}
        value={data.tags}
        onChange={(nextTags) => updateData({ tags: nextTags })}
        searchPlaceholder="Search workspace tags"
        selectedAppearance="tag"
        optionAppearance="tag"
        clearActionLabel="Clear all"
        emptySelectedContent={
          <p className="text-xs text-gray-400">No tags selected.</p>
        }
      />
    </Section>
  );
}
