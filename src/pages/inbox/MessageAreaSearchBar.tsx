import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Search, X } from "@/components/ui/icons";
import { MessageSearchResult } from "../../lib/inboxApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Tag } from "../../components/ui/Tag";
import { IconButton } from "../../components/ui/button/IconButton";

export function MessageAreaSearchBar({
  value,
  onChange,
  onClose,
  onFocus,
  matchCount,
  matchIndex,
  onPrev,
  onNext,
  results,
  loading,
  showResults,
  onSelectResult,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onFocus: () => void;
  matchCount: number;
  matchIndex: number;
  onPrev: () => void;
  onNext: () => void;
  results: MessageSearchResult[];
  loading: boolean;
  showResults: boolean;
  onSelectResult: (result: MessageSearchResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={onFocus}
            placeholder="Search messages..."
            inputSize="sm"
            leftIcon={<Search size={14} />}
          />
        </div>
        {value && (
          <Tag
            label={matchCount === 0 ? "No results" : `${matchIndex + 1} / ${matchCount}`}
            bgColor="gray"
            size="sm"
            className="shrink-0 whitespace-nowrap"
          />
        )}
        {value && matchCount > 0 && (
          <div className="flex shrink-0 items-center gap-0.5">
            <IconButton
              type="button"
              aria-label="Previous match"
              icon={<ChevronUp size={14} />}
              onClick={onPrev}
              variant="ghost"
              size="xs"
            />
            <IconButton
              type="button"
              aria-label="Next match"
              icon={<ChevronDown size={14} />}
              onClick={onNext}
              variant="ghost"
              size="xs"
            />
          </div>
        )}
        {value && (
          <IconButton
            type="button"
            aria-label="Clear search"
            icon={<X size={13} />}
            onClick={() => onChange("")}
            variant="ghost"
            size="xs"
          />
        )}
        <Button
          type="button"
          onClick={onClose}
          variant="ghost"
          size="xs"
          className="shrink-0"
        >
          Cancel
        </Button>
      </div>

      {value && value.trim().length >= 2 && showResults && (
        <div className="mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin" />
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">No results</div>
          )}
          {!loading && results.length > 0 ? (
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {results.map((res) => (
                <Button
                  key={`${res.conversationId}-${res.messageId}`}
                  type="button"
                  onClick={() => onSelectResult(res)}
                  variant="ghost"
                  size="sm"
                  fullWidth
                  contentAlign="start"
                >
                  <div className="w-full text-left">
                    <div className="mb-1 text-xs text-gray-500">
                      {res.contact?.firstName ?? "Contact"}{" "}
                      {res.contact?.lastName ?? ""}
                    </div>
                    <div className="line-clamp-2 text-sm text-gray-800">
                      {res.snippet || res.text}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
