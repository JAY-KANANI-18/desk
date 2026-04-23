import { useState } from "react";
import {
  Calendar,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useMobileHeaderActions } from "../../components/mobileHeaderActions";
import { useIsMobile } from "../../hooks/useIsMobile";
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
  selectedStatus: string;
  onOpenFilters: () => void;
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
  selectedStatus,
  onOpenFilters,
}: BroadcastToolbarProps) {
  const isMobile = useIsMobile();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useMobileHeaderActions(
    isMobile
      ? {
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
              id: "broadcast-filters",
              label: "Broadcast filters",
              icon: <ListFilter size={17} />,
              hasIndicator: selectedStatus !== "All",
              onClick: onOpenFilters,
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
        }
      : {},
    [
      isMobile,
      mobileSearchOpen,
      onNewBroadcast,
      onOpenFilters,
      onSearchChange,
      searchQuery,
      selectedStatus,
    ],
  );

  return (
    <div className="flex-shrink-0 bg-white px-3 py-2 sm:px-4 md:border-b md:border-gray-200 md:py-4">
      {isMobile ? (
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-xs text-gray-400">
            {activeRunLabel}
          </p>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
            aria-label="Refresh broadcasts"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>

          <div className="flex flex-shrink-0 items-center rounded-xl bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`h-8 rounded-lg px-3 text-xs font-medium transition ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("calendar")}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition ${
                viewMode === "calendar"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar size={14} />
              Cal
            </button>
          </div>
        </div>
      ) : (
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
          </div>
        </div>
      )}
    </div>
  );
}
