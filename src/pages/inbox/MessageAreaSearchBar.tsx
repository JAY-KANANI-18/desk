import React, { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Search, X } from "lucide-react";
import { MessageSearchResult } from "../../lib/inboxApi";

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
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
        </div>
        {value && (
          <span className="text-xs text-gray-500 whitespace-nowrap shrink-0 min-w-[60px] text-center">
            {matchCount === 0 ? "No results" : `${matchIndex + 1} / ${matchCount}`}
          </span>
        )}
        {value && matchCount > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onPrev}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={onNext}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
        {value && (
          <button
            onClick={() => onChange("")}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 shrink-0"
          >
            <X size={13} />
          </button>
        )}
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700 shrink-0 px-1"
        >
          Cancel
        </button>
      </div>

      {(loading || results.length > 0) && value && showResults && (
        <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm max-h-64 overflow-y-auto w-full">
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin" />
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">No results</div>
          )}
          {!loading &&
            results.map((res) => (
              <button
                key={`${res.conversationId}-${res.messageId}`}
                onClick={() => onSelectResult(res)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-t first:border-t-0"
              >
                <div className="text-xs text-gray-500 mb-1">
                  {res.contact?.firstName ?? "Contact"}{" "}
                  {res.contact?.lastName ?? ""}
                </div>
                <div className="text-sm text-gray-800 line-clamp-2">
                  {res.snippet || res.text}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
