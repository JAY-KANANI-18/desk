import { ChevronRight } from "@/components/ui/icons";
import { Button } from "../../components/ui/Button";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/ui/DataTable";
import type { BroadcastRunRow } from "../../lib/broadcastApi";
import {
  BroadcastChannelIcon,
  BroadcastChannelLabel,
  getBroadcastChannelDisplay,
} from "./BroadcastChannelLabel";
import { BroadcastStatusTag } from "./BroadcastStatusTag";
import type { BroadcastSortableField } from "./types";
import { contentModeLabel, formatDateTime } from "./utils";

type BroadcastTableViewProps = {
  runs: BroadcastRunRow[];
  runsLoading: boolean;
  runsLoadingMore: boolean;
  hasMoreRuns: boolean;
  nextCursor?: string;
  debouncedSearchQuery: string;
  selectedStatus: string;
  sortBy?: BroadcastSortableField;
  sortOrder: "asc" | "desc";
  onToggleSort: (field: BroadcastSortableField) => void;
  onOpenDetail: (run: BroadcastRunRow) => void;
  onLoadMore: (cursor?: string) => void;
};

export function BroadcastTableView({
  runs,
  runsLoading,
  runsLoadingMore,
  hasMoreRuns,
  nextCursor,
  debouncedSearchQuery,
  selectedStatus,
  sortBy,
  sortOrder,
  onToggleSort,
  onOpenDetail,
  onLoadMore,
}: BroadcastTableViewProps) {
  const columns: Array<DataTableColumn<BroadcastRunRow, BroadcastSortableField>> = [
    {
      id: "status",
      header: "Progress",
      sortable: true,
      sortField: "status",
      cell: (run) => <BroadcastStatusTag status={run.status} />,
      mobile: "hidden",
    },
    {
      id: "scheduledAt",
      header: "Send time",
      sortable: true,
      sortField: "scheduledAt",
      cell: (run) =>
        run.scheduledAt ? formatDateTime(run.scheduledAt) : formatDateTime(run.createdAt),
      className: "whitespace-nowrap text-gray-600",
      mobile: "detail",
    },
    {
      id: "name",
      header: "Broadcast",
      sortable: true,
      sortField: "name",
      cell: (run) => <span className="font-medium text-gray-900">{run.name}</span>,
      mobile: "primary",
    },
    {
      id: "channel",
      header: "Send from",
      cell: (run) => <BroadcastChannelLabel channel={run.channel} />,
      mobile: "secondary",
    },
    {
      id: "contentMode",
      header: "Message type",
      cell: (run) => <span>{contentModeLabel(run.contentMode)}</span>,
      mobile: "detail",
    },
    {
      id: "totalAudience",
      header: "People",
      cell: (run) => run.totalAudience,
      mobile: "detail",
    },
    {
      id: "queuedCount",
      header: "Started",
      cell: (run) => run.queuedCount,
      mobile: "detail",
    },
    {
      id: "failedEnqueue",
      header: "Needs help",
      cell: (run) => run.failedEnqueue,
      mobile: "detail",
    },
  ];

  const footer =
    hasMoreRuns || runsLoadingMore ? (
      <div className="flex justify-center bg-white px-4 pb-6 pt-3 md:border-t md:border-gray-100">
        <Button
          type="button"
          onClick={() => onLoadMore(nextCursor)}
          disabled={!nextCursor}
          loading={runsLoadingMore}
          loadingMode="inline"
          variant="secondary"
        >
          Show more broadcasts
        </Button>
      </div>
    ) : null;

  return (
    <DataTable
      className="h-full"
      rows={runs}
      columns={columns}
      getRowId={(run) => run.id}
      loading={runsLoading}
      loadingLabel="Loading broadcasts..."
      emptyTitle={
        debouncedSearchQuery || selectedStatus !== "All"
          ? "No broadcasts match this search or filter."
          : "No broadcasts yet."
      }
      emptyDescription={
        debouncedSearchQuery || selectedStatus !== "All"
          ? "Try another search or choose a different status."
          : "Create one to message people on a connected channel."
      }
      sort={{
        field: sortBy,
        direction: sortOrder,
        onChange: onToggleSort,
      }}
      onRowClick={onOpenDetail}
      minTableWidth={960}
      mobileLoadMore={{
        hasMore: hasMoreRuns,
        loading: runsLoadingMore,
        onLoadMore: () => onLoadMore(nextCursor),
        loadingLabel: "Loading more broadcasts...",
      }}
      footer={footer}
      renderMobileCard={(run) => {
        const channelDisplay = getBroadcastChannelDisplay(run.channel);
        const scheduleTime = run.scheduledAt
          ? formatDateTime(run.scheduledAt)
          : formatDateTime(run.createdAt);

        return (
          <article
            key={run.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenDetail(run)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenDetail(run);
              }
            }}
            className="relative min-w-0 max-w-full flex-shrink-0 cursor-pointer overflow-visible rounded-2xl bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition-colors hover:bg-slate-50"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-300"
            >
              <ChevronRight size={15} />
            </span>

            <div className="min-w-0 pr-6">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <BroadcastChannelIcon
                    channel={run.channel}
                    className="h-10 w-10 rounded-xl bg-slate-50 ring-1 ring-slate-100"
                    iconClassName="h-6 w-6"
                    fallbackClassName="text-xs font-semibold uppercase text-slate-500"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {channelDisplay.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                      {run.name}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <BroadcastStatusTag status={run.status} size="sm" />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {run.status === "scheduled" ? "Schedule time" : "Send time"}
                </span>
                <span className="min-w-0 truncate text-right text-sm font-semibold text-slate-800">
                  {scheduleTime}
                </span>
              </div>
            </div>
          </article>
        );
      }}
    />
  );
}
