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
    <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search broadcasts"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">{activeRunLabel}</span>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              viewMode === "table" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("calendar")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${
              viewMode === "calendar" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Calendar size={16} />
            Calendar
          </button>
          <button
            type="button"
            onClick={onNewBroadcast}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            <Plus size={16} />
            New broadcast
          </button>
          <button type="button" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-50">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
