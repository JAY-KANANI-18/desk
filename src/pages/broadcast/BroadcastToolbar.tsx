import { useState } from "react";
import { Calendar, MoreVertical, Plus, RefreshCw, Search, X } from "lucide-react";
import { useMobileHeaderActions } from "../../components/mobileHeaderActions";
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useMobileHeaderActions(
    {
      actions: [
        {
          id: "broadcast-search",
          label: mobileSearchOpen ? "Close search" : "Search broadcasts",
          icon: mobileSearchOpen ? <X size={17} /> : <Search size={17} />,
          active: mobileSearchOpen,
          hasIndicator: !mobileSearchOpen && Boolean(searchQuery),
          onClick: () => setMobileSearchOpen((value) => !value),
        },
        {
          id: "broadcast-refresh",
          label: "Refresh broadcasts",
          icon: (
            <RefreshCw
              className={refreshing ? "animate-spin" : ""}
              size={17}
            />
          ),
          disabled: refreshing,
          onClick: onRefresh,
        },
        {
          id: "broadcast-new",
          label: "New broadcast",
          icon: <Plus size={18} />,
          onClick: onNewBroadcast,
        },
      ],
      panel: mobileSearchOpen ? (
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={15}
          />
          <input
            autoFocus
            className="h-10 w-full rounded-xl bg-slate-100 pl-9 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search broadcasts"
            type="text"
            value={searchQuery}
          />
        </div>
      ) : null,
    },
    [mobileSearchOpen, refreshing, searchQuery],
  );

  return (
    <div className="bg-white px-3 py-3 sm:px-4 sm:py-4 md:border-b md:border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative hidden w-full md:block md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search broadcasts"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full rounded-lg bg-slate-100 py-2 pl-9 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:w-64 md:border md:border-gray-300 md:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-gray-700 transition hover:bg-slate-200 disabled:opacity-60 md:inline-flex md:border md:border-gray-300 md:bg-white md:hover:bg-gray-50"
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
            className={`rounded-lg px-3 py-2 text-sm transition md:border ${
              viewMode === "table"
                ? "bg-gray-100 text-gray-900 md:border-gray-300"
                : "bg-slate-100 text-gray-600 hover:bg-slate-200 md:border-gray-200 md:bg-white md:hover:bg-gray-50"
            }`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("calendar")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition md:border ${
              viewMode === "calendar"
                ? "bg-gray-100 text-gray-900 md:border-gray-300"
                : "bg-slate-100 text-gray-600 hover:bg-slate-200 md:border-gray-200 md:bg-white md:hover:bg-gray-50"
            }`}
          >
            <Calendar size={16} />
            Calendar
          </button>
          <button
            type="button"
            onClick={onNewBroadcast}
            className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 md:inline-flex"
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
