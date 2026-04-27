import { ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/ui/DataTable";
import type { BroadcastRunRow } from "../../lib/broadcastApi";
import { BroadcastStatusTag } from "./BroadcastStatusTag";
import type { BroadcastSortableField } from "./types";
import { formatDateTime } from "./utils";

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
      header: "Status",
      sortable: true,
      sortField: "status",
      cell: (run) => <BroadcastStatusTag status={run.status} />,
      mobile: "hidden",
    },
    {
      id: "scheduledAt",
      header: "Schedule",
      sortable: true,
      sortField: "scheduledAt",
      cell: (run) =>
        run.scheduledAt ? formatDateTime(run.scheduledAt) : formatDateTime(run.createdAt),
      className: "whitespace-nowrap text-gray-600",
      mobile: "detail",
    },
    {
      id: "name",
      header: "Name",
      sortable: true,
      sortField: "name",
      cell: (run) => <span className="font-medium text-gray-900">{run.name}</span>,
      mobile: "primary",
    },
    {
      id: "channel",
      header: "Channel",
      cell: (run) => (
        <span className="text-gray-700">
          {run.channel?.name ?? "-"}{" "}
          <span className="text-gray-400">({run.channel?.type ?? "?"})</span>
        </span>
      ),
      mobile: "secondary",
    },
    {
      id: "contentMode",
      header: "Mode",
      cell: (run) => <span className="capitalize">{run.contentMode}</span>,
      mobile: "detail",
    },
    {
      id: "totalAudience",
      header: "Audience",
      cell: (run) => run.totalAudience,
      mobile: "detail",
    },
    {
      id: "queuedCount",
      header: "Queued",
      cell: (run) => run.queuedCount,
      mobile: "detail",
    },
    {
      id: "failedEnqueue",
      header: "Failed",
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
          Load more broadcasts
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
          ? "No broadcasts matched this search or filter."
          : "No broadcasts yet."
      }
      emptyDescription={
        debouncedSearchQuery || selectedStatus !== "All"
          ? "Try another search or status."
          : "Create one to reach opted-in contacts on a connected channel."
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
      renderMobileCard={(run) => (
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
          className="relative min-w-0 max-w-full flex-shrink-0 cursor-pointer overflow-visible rounded-[28px] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] transition-colors hover:bg-slate-50"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-300"
          >
            <ChevronRight size={16} />
          </span>

          <div className="min-w-0 pr-7">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-[17px] font-semibold leading-tight text-slate-900">
                    {run.name}
                  </p>
                  <BroadcastStatusTag status={run.status} size="sm" />
                </div>
                <p className="mt-1 truncate text-sm font-medium text-slate-500">
                  {run.channel?.name ?? "-"}{" "}
                  <span className="text-slate-400">({run.channel?.type ?? "?"})</span>
                </p>
              </div>
            </div>

            <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 rounded-[22px] bg-white p-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Schedule
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {run.scheduledAt
                    ? formatDateTime(run.scheduledAt)
                    : formatDateTime(run.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Mode
                </p>
                <p className="mt-1 text-sm font-medium capitalize text-slate-700">
                  {run.contentMode}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Audience
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {run.totalAudience}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Queue
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {run.queuedCount} queued
                  {run.failedEnqueue > 0 ? ` / ${run.failedEnqueue} failed` : ""}
                </p>
              </div>
            </div>
          </div>
        </article>
      )}
    />
  );
}
