import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { TagRow } from "./types";

type BroadcastTagPickerProps = {
  tags: TagRow[];
  value: string[];
  onChange: (next: string[]) => void;
};

export function BroadcastTagPicker({
  tags,
  value,
  onChange,
}: BroadcastTagPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filteredTags = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [search, tags]);

  const selectedTags = useMemo(
    () => tags.filter((tag) => value.includes(tag.id)),
    [tags, value],
  );

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const toggleTag = (tagId: string) => {
    onChange(
      value.includes(tagId)
        ? value.filter((id) => id !== tagId)
        : [...value, tagId],
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-left text-sm transition hover:border-gray-400"
      >
        <div className="flex flex-1 flex-wrap gap-1.5">
          {selectedTags.length === 0 ? (
            <span className="text-gray-400">Select tags</span>
          ) : (
            selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              >
                {tag.name}
              </span>
            ))
          )}
        </div>
        <ChevronRight
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-3 py-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tags"
              className="w-full border-none p-0 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filteredTags.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">
                No tags found
              </div>
            ) : (
              filteredTags.map((tag) => {
                const selected = value.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                      selected
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{tag.name}</span>
                    {selected ? (
                      <span className="text-xs font-medium">Selected</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          {value.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
