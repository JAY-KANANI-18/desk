import { Calendar, MoreVertical, Plus, RefreshCw, Search } from "lucide-react";
import type { BroadcastViewMode } from "./types";

type BroadcastToolbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  activeRunLabel: string;
  viewMode: BroadcastViewMode;
  onViewModeChange: (mode: BroadcastViewMode) => void;
  onNewBroadcast: () => void;
};

export function BroadcastToolbar({
  searchQuery,
  onSearchChange,
  onRefresh,
  refreshing,
  activeRunLabel,
  viewMode,
  onViewModeChange,
  onNewBroadcast,
}: BroadcastToolbarProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search broadcasts"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-64 rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">{activeRunLabel}</span>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              viewMode === "table"
                ? "border-gray-300 bg-gray-100 text-gray-900"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("calendar")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              viewMode === "calendar"
                ? "border-gray-300 bg-gray-100 text-gray-900"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar size={16} />
            Calendar
          </button>
          <button
            type="button"
            onClick={onNewBroadcast}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Plus size={16} />
            New broadcast
          </button>
          <button type="button" className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
