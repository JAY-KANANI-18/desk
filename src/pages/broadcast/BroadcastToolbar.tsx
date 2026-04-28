import { Calendar, List, ListFilter, Plus, RefreshCw, Search, Table } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/button/IconButton";
import { BaseInput } from "../../components/ui/inputs/BaseInput";
import { useMobileHeaderActions } from "../../components/mobileHeaderActions";
import { useIsMobile } from "../../hooks/useIsMobile";
import { STATUS_FILTERS } from "./constants";
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
  onStatusChange: (value: string) => void;
  onOpenFilters: () => void;
  desktopMode?: "standalone" | "embedded";
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
  onStatusChange,
  onOpenFilters,
  desktopMode = "standalone",
}: BroadcastToolbarProps) {
  const isMobile = useIsMobile();

  useMobileHeaderActions(
    isMobile
      ? {
          panel: (
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <BaseInput
                  appearance="toolbar"
                  leftIcon={<Search size={15} />}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search broadcasts"
                  type="search"
                  value={searchQuery}
                  aria-label="Search broadcasts"
                />
              </div>
              <IconButton
                aria-label="Broadcast filters"
                icon={
                  <>
                    {selectedStatus !== "All" ? (
                      <span
                        aria-hidden="true"
                        className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white"
                      />
                    ) : null}
                    <ListFilter size={17} />
                  </>
                }
                onClick={onOpenFilters}
                radius="full"
                type="button"
                variant={selectedStatus !== "All" ? "soft-primary" : "ghost"}
              />
            </div>
          ),
        }
      : {},
    [
      isMobile,
      onOpenFilters,
      onSearchChange,
      searchQuery,
      selectedStatus,
    ],
  );

  return (
    <div
      className={
        desktopMode === "embedded"
          ? "flex-shrink-0 bg-transparent px-0 py-0 md:border-0"
          : "flex-shrink-0 bg-white px-3 py-2 sm:px-4 md:border-b md:border-gray-200 md:py-4"
      }
    >
      {isMobile ? (
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-xs text-gray-400">
            {activeRunLabel}
          </p>

          <Button
            onClick={onRefresh}
            disabled={refreshing}
            iconOnly
            size="sm"
            variant="secondary"
            leftIcon={
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
            }
            aria-label="Refresh broadcasts"
          >
            Refresh
          </Button>

          <div className="flex flex-shrink-0 items-center rounded-xl bg-slate-100 p-0.5">
            <Button
              type="button"
                            leftIcon={<List size={14} />}

              variant={viewMode === "table" ? "secondary" : "ghost"}
              onClick={() => onViewModeChange("table")}
            >
              
            </Button>
            <Button
              type="button"
            
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              leftIcon={<Calendar size={14} />}
              onClick={() => onViewModeChange("calendar")}
            >
              
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-0.5 overflow-x-auto">
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.name}
                  type="button"
                  onClick={() => onStatusChange(filter.name)}
                  variant="tab"
                  selected={selectedStatus === filter.name}
                  radius="none"
                >
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    <span className={`h-2 w-2 rounded-full ${filter.color}`} />
                    {filter.name}
                  </span>
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <div className="w-full md:w-64">
                <BaseInput
                  appearance="toolbar"
                  type="text"
                  placeholder="Search broadcasts"
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  leftIcon={<Search size={16} />}
                />
              </div>

              <Button
                onClick={onRefresh}
                disabled={refreshing}
                variant="secondary"
                leftIcon={
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                }
              >
                Refresh
              </Button>

              <Button onClick={onNewBroadcast} leftIcon={<Plus size={16} />}>
                New broadcast
              </Button>
            </div>
          </div>

            <div className="flex  min-w-0 flex-1 flex-shrink-0 items-center gap-2 md:justify-end rounded-xl  p-0.5">
            <Button
              type="button"
                            leftIcon={<Table size={14} />}

              variant={viewMode === "table" ? "secondary" : "ghost"}
              onClick={() => onViewModeChange("table")}
            >
              Table
            </Button>
            <Button
              type="button"
            
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              leftIcon={<Calendar size={14} />}
              onClick={() => onViewModeChange("calendar")}
            >
              Calendar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
