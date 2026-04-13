import { useMemo } from "react";

type TagOption = {
  id: string;
  name: string;
  emoji?: string | null;
};

type Props = {
  matchBy: "phone" | "email";
  importMode: "create" | "update" | "upsert" | "overwrite";
  tags: string[];
  autoGenerateBatchTag: boolean;
  availableTags: TagOption[];
  onChange: (patch: Partial<{
    matchBy: "phone" | "email";
    importMode: "create" | "update" | "upsert" | "overwrite";
    tags: string[];
    autoGenerateBatchTag: boolean;
  }>) => void;
};

const modeDescriptions: Record<Props["importMode"], string> = {
  create: "Skip rows that already match an existing contact.",
  update: "Only update rows that already exist.",
  upsert: "Create new contacts and update matching ones.",
  overwrite: "Update matches and clear mapped empty values.",
};

export function ImportConfigPanel({
  matchBy,
  importMode,
  tags,
  autoGenerateBatchTag,
  availableTags,
  onChange,
}: Props) {
  const selectedTagIds = useMemo(() => new Set(tags), [tags]);

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5">

      {/* Row 1: Import Mode + Match By + Batch Tag toggle */}
      <div className="flex flex-wrap items-start gap-6">

        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide" htmlFor="import-mode">
            Import Mode
          </label>
          <select
            id="import-mode"
            value={importMode}
            onChange={(e) => onChange({ importMode: e.target.value as Props["importMode"] })}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:bg-white"
          >
            <option value="create">Create only</option>
            <option value="update">Update only</option>
            <option value="upsert">Upsert</option>
            <option value="overwrite">Overwrite</option>
          </select>
          <p className="text-xs text-gray-400 leading-snug max-w-[200px]">{modeDescriptions[importMode]}</p>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide" htmlFor="match-by">
            Match By
          </label>
          <select
            id="match-by"
            value={matchBy}
            onChange={(e) => onChange({ matchBy: e.target.value as Props["matchBy"] })}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:bg-white"
          >
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </select>
          <p className="text-xs text-gray-400 leading-snug max-w-[180px]">Field used to match existing contacts.</p>
        </div>

        <div className="ml-auto flex items-center gap-3 pt-5">
          <span className="text-sm text-gray-600">Auto batch tag</span>
          <button
            type="button"
            role="switch"
            aria-checked={autoGenerateBatchTag}
            onClick={() => onChange({ autoGenerateBatchTag: !autoGenerateBatchTag })}
            className={`relative inline-flex h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-200 ${
              autoGenerateBatchTag ? "bg-indigo-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`mt-0.5 ml-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                autoGenerateBatchTag ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Row 2: Tags */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add Tags</span>
          {tags.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ tags: [] })}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear all
            </button>
          )}
        </div>

        {availableTags.length === 0 ? (
          <p className="text-xs text-gray-400">No workspace tags available.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const selected = selectedTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      tags: selected
                        ? tags.filter((id) => id !== tag.id)
                        : [...tags, tag.id],
                    })
                  }
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                    selected
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {tag.emoji && <span>{tag.emoji}</span>}
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}