import { useMemo, useState, type ReactNode } from "react";
import { CheckboxInput } from "../../../components/ui/inputs/CheckboxInput";

export interface ChannelConnectPrerequisite {
  id: string;
  label: ReactNode;
  description?: ReactNode;
}

export function useChannelConnectPrerequisites(
  items: ChannelConnectPrerequisite[],
) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const checkedIdSet = useMemo(() => new Set(checkedIds), [checkedIds]);
  const allChecked = items.every((item) => checkedIdSet.has(item.id));

  const togglePrerequisite = (id: string, checked: boolean) => {
    setCheckedIds((current) => {
      if (!checked) {
        return current.filter((itemId) => itemId !== id);
      }

      return current.includes(id) ? current : [...current, id];
    });
  };

  return {
    allChecked,
    checkedIds,
    togglePrerequisite,
  };
}

export function ChannelConnectPrerequisites({
  items,
  checkedIds,
  onToggle,
  title = "Before connecting",
  subtitle = "Confirm these details so the setup does not fail halfway.",
}: {
  items: ChannelConnectPrerequisite[];
  checkedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  title?: string;
  subtitle?: string;
}) {
  const checkedIdSet = useMemo(() => new Set(checkedIds), [checkedIds]);
  const checkedCount = items.filter((item) => checkedIdSet.has(item.id)).length;

  return (
    <div className="border-y border-gray-100 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>
        <span className="text-xs font-medium text-gray-400">
          {checkedCount}/{items.length} checked
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <CheckboxInput
            key={item.id}
            checked={checkedIdSet.has(item.id)}
            onChange={(checked) => onToggle(item.id, checked)}
            label={item.label}
            description={item.description}
            size="sm"
            className="w-full"
          />
        ))}
      </div>
    </div>
  );
}
