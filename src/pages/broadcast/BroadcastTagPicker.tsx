import { useMemo } from "react";
import { WorkspaceTagManager } from "../../components/ui/select";
import type { TagRow } from "./types";

type BroadcastTagPickerProps = {
  label?: string;
  hint?: string;
  tags: TagRow[];
  value: string[];
  onChange: (next: string[]) => void;
};

export function BroadcastTagPicker({
  label = "Tags (any match)",
  hint,
  tags,
  value,
  onChange,
}: BroadcastTagPickerProps) {
  const options = useMemo(
    () =>
      tags.map((tag) => ({
        value: tag.id,
        label: tag.name,
        emoji: tag.emoji,
        color: tag.color,
        description: tag.description,
      })),
    [tags],
  );

  return (
    <WorkspaceTagManager
      label={label}
      hint={hint}
      options={options}
      value={value}
      onChange={onChange}
      searchPlaceholder="Search tags"
      emptyMessage="No tags found"
      selectedAppearance="tag"
      optionAppearance="tag"
      clearActionLabel="Clear all"
    />
  );
}
