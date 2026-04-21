import { Loader2 } from "lucide-react";
import type { BroadcastRunRow } from "../../lib/broadcastApi";
import type { BroadcastSortableField } from "./types";
import { formatDateTime, statusBadgeClass, statusLabel } from "./utils";

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
  const sortIndicator = (field: BroadcastSortableField) => {
    if (sortBy !== field) return "^v";
    return sortOrder === "asc" ? "^" : "v";
  };

  if (runsLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
        <Loader2 className="animate-spin" size={22} />
        Loading broadcasts...
      </div>
    );
  }

  return (
    <div className="pb-6">
      <table className="w-full min-w-[960px]">
        <thead className="sticky top-0 z-10 border-b border-gray-100 bg-white">
          <tr>
            {[
              { label: "Status", field: "status" },
              { label: "Schedule", field: "scheduledAt" },
              { label: "Name", field: "name" },
            ].map((column) => (
              <th
                key={column.field}
                className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400"
              >
                <button
                  type="button"
                  onClick={() => onToggleSort(column.field as BroadcastSortableField)}
                  className="inline-flex items-center gap-1 transition hover:text-gray-700"
                >
                  {column.label}
                  <span className="text-[11px]">{sortIndicator(column.field as BroadcastSortableField)}</span>
                </button>
              </th>
            ))}
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Channel
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Mode
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Audience
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Queued
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Failed
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {runs.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                {debouncedSearchQuery || selectedStatus !== "All"
                  ? "No broadcasts matched this search or filter."
                  : "No broadcasts yet. Create one to reach opted-in contacts on a connected channel."}
              </td>
            </tr>
          ) : (
            runs.map((run) => (
              <tr
                key={run.id}
                className="cursor-pointer transition hover:bg-gray-50"
                onClick={() => onOpenDetail(run)}
              >
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(run.status)}`}>
                    {statusLabel(run.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {run.scheduledAt ? formatDateTime(run.scheduledAt) : formatDateTime(run.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{run.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {run.channel?.name ?? "-"} <span className="text-gray-400">({run.channel?.type ?? "?"})</span>
                </td>
                <td className="px-6 py-4 text-sm capitalize text-gray-600">{run.contentMode}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{run.totalAudience}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{run.queuedCount}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{run.failedEnqueue}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {(hasMoreRuns || runsLoadingMore) && (
        <div className="flex justify-center px-6 pt-4">
          <button
            type="button"
            onClick={() => onLoadMore(nextCursor)}
            disabled={runsLoadingMore || !nextCursor}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {runsLoadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
            Load more broadcasts
          </button>
        </div>
      )}
    </div>
  );
}
