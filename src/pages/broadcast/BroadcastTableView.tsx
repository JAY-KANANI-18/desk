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
    if (sortBy !== field) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  if (runsLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
        <Loader2 className="animate-spin" size={22} />
        Loading broadcasts...
      </div>
    );
  }

  return (
    <div className="pb-6">
      <table className="w-full min-w-[960px]">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
          <tr>
            {[
              { label: "Status", field: "status" },
              { label: "Schedule", field: "scheduledAt" },
              { label: "Name", field: "name" },
            ].map((column) => (
              <th
                key={column.field}
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                <button
                  type="button"
                  onClick={() => onToggleSort(column.field as BroadcastSortableField)}
                  className="inline-flex items-center gap-1 transition hover:text-slate-900"
                >
                  {column.label}
                  <span className="text-[11px]">{sortIndicator(column.field as BroadcastSortableField)}</span>
                </button>
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Channel
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Mode
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Audience
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Queued
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Failed
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {runs.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                {debouncedSearchQuery || selectedStatus !== "All"
                  ? "No broadcasts matched this search or filter."
                  : "No broadcasts yet. Create one to reach opted-in contacts on a connected channel."}
              </td>
            </tr>
          ) : (
            runs.map((run) => (
              <tr
                key={run.id}
                className="cursor-pointer transition hover:bg-slate-50"
                onClick={() => onOpenDetail(run)}
              >
                <td className="px-6 py-4">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${statusBadgeClass(run.status)}`}>
                    {statusLabel(run.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {run.scheduledAt ? formatDateTime(run.scheduledAt) : formatDateTime(run.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-sky-700">{run.name}</td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {run.channel?.name ?? "—"} <span className="text-slate-400">({run.channel?.type ?? "?"})</span>
                </td>
                <td className="px-6 py-4 text-sm capitalize text-slate-600">{run.contentMode}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{run.totalAudience}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{run.queuedCount}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{run.failedEnqueue}</td>
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
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {runsLoadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
            Load more broadcasts
          </button>
        </div>
      )}
    </div>
  );
}
