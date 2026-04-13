import { BarChart3, Loader2, X } from "lucide-react";
import type { BroadcastAnalytics, BroadcastRunRow, BroadcastTrace } from "../../lib/broadcastApi";
import type { BroadcastDraftState } from "./types";
import { canMutateBroadcast, formatDateTime, statusBadgeClass, statusLabel } from "./utils";

type BroadcastDetailsDrawerProps = {
  selectedRun: BroadcastRunRow | null;
  analytics: BroadcastAnalytics | null;
  analyticsLoading: boolean;
  trace: BroadcastTrace | null;
  traceLoading: boolean;
  broadcastAction: "edit" | "reschedule" | null;
  broadcastActionSaving: boolean;
  broadcastDraft: BroadcastDraftState;
  onBroadcastDraftChange: (next: BroadcastDraftState) => void;
  onClose: () => void;
  onOpenBroadcastAction: (action: "edit" | "reschedule") => void;
  onCancelBroadcastAction: () => void;
  onSaveBroadcastAction: () => void;
  onSendNow: () => void;
  onRefreshAnalytics: () => void;
  onRefreshTrace: () => void;
};

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="text-slate-900">{value}</p>
    </div>
  );
}

export function BroadcastDetailsDrawer({
  selectedRun,
  analytics,
  analyticsLoading,
  trace,
  traceLoading,
  broadcastAction,
  broadcastActionSaving,
  broadcastDraft,
  onBroadcastDraftChange,
  onClose,
  onOpenBroadcastAction,
  onCancelBroadcastAction,
  onSaveBroadcastAction,
  onSendNow,
  onRefreshAnalytics,
  onRefreshTrace,
}: BroadcastDetailsDrawerProps) {
  if (!selectedRun) return null;

  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 z-50 flex justify-end">
      <div className="pointer-events-auto relative h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <BarChart3 size={18} />
            Broadcast details
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 transition hover:text-slate-700">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Name</p>
            <p className="font-medium text-slate-900">{selectedRun.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Status</p>
            <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs ${statusBadgeClass(selectedRun.status)}`}>
              {statusLabel(selectedRun.status)}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Channel</p>
            <p className="mt-1 text-slate-900">
              {selectedRun.channel?.name ?? "-"} <span className="text-slate-400">({selectedRun.channel?.type ?? "?"})</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={!canMutateBroadcast(selectedRun.status) || broadcastActionSaving}
              onClick={() => onOpenBroadcastAction("edit")}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={!canMutateBroadcast(selectedRun.status) || broadcastActionSaving}
              onClick={() => onOpenBroadcastAction("reschedule")}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Reschedule
            </button>
            <button
              type="button"
              disabled={!canMutateBroadcast(selectedRun.status) || broadcastActionSaving}
              onClick={onSendNow}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Send now
            </button>
          </div>

          {!canMutateBroadcast(selectedRun.status) && (
            <p className="text-xs text-slate-500">
              Running, sent, and failed broadcasts are locked to preserve delivery audit history.
            </p>
          )}

          {broadcastAction && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-700">
                {broadcastAction === "edit" ? "Edit scheduled broadcast" : "Reschedule broadcast"}
              </p>
              {broadcastAction === "edit" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Broadcast name</label>
                  <input
                    type="text"
                    value={broadcastDraft.name}
                    onChange={(event) =>
                      onBroadcastDraftChange({ ...broadcastDraft, name: event.target.value })
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Schedule time</label>
                <input
                  type="datetime-local"
                  value={broadcastDraft.scheduledAt}
                  onChange={(event) =>
                    onBroadcastDraftChange({ ...broadcastDraft, scheduledAt: event.target.value })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancelBroadcastAction}
                  disabled={broadcastActionSaving}
                  className="rounded-md border border-slate-200 px-3 py-2 text-xs transition hover:bg-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSaveBroadcastAction}
                  disabled={broadcastActionSaving}
                  className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-xs text-white transition hover:bg-sky-700 disabled:opacity-50"
                >
                  {broadcastActionSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatItem label="Scheduled" value={formatDateTime(selectedRun.scheduledAt)} />
            <StatItem label="Completed" value={formatDateTime(selectedRun.completedAt)} />
            <StatItem label="Audience" value={selectedRun.totalAudience} />
            <StatItem label="Queued" value={selectedRun.queuedCount} />
            <StatItem label="Enqueue failed" value={selectedRun.failedEnqueue} />
            <StatItem label="Mode" value={selectedRun.contentMode} />
          </div>

          {(selectedRun.templateName || selectedRun.textPreview) && (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Content</p>
              <p className="mt-1 text-slate-800">
                {selectedRun.templateName
                  ? `${selectedRun.templateName} (${selectedRun.templateLanguage})`
                  : selectedRun.textPreview}
              </p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase text-slate-500">Delivery analytics</p>
              <button
                type="button"
                className="text-xs text-sky-600 transition hover:underline"
                onClick={onRefreshAnalytics}
              >
                Refresh
              </button>
            </div>
            {analyticsLoading ? (
              <div className="flex items-center gap-2 py-4 text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Loading...
              </div>
            ) : analytics ? (
              <div className="space-y-2">
                <p className="text-slate-700">
                  Total tracked messages: <span className="font-semibold">{analytics.totalMessages}</span>
                </p>
                <ul className="space-y-1">
                  {Object.entries(analytics.byStatus).map(([status, count]) => (
                    <li key={status} className="flex justify-between text-slate-700">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </li>
                  ))}
                </ul>
                {analytics.byQueueStatus && Object.keys(analytics.byQueueStatus).length > 0 && (
                  <div className="pt-2">
                    <p className="mb-1 text-xs font-medium uppercase text-slate-500">Queue</p>
                    <ul className="space-y-1">
                      {Object.entries(analytics.byQueueStatus).map(([status, count]) => (
                        <li key={status} className="flex justify-between text-slate-700">
                          <span className="capitalize">{status}</span>
                          <span className="font-medium">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{analytics.queueNote}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No analytics yet.</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase text-slate-500">Recipient trace</p>
              <button
                type="button"
                className="text-xs text-sky-600 transition hover:underline"
                onClick={onRefreshTrace}
              >
                Refresh trace
              </button>
            </div>
            {traceLoading ? (
              <div className="flex items-center gap-2 py-4 text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Loading trace...
              </div>
            ) : trace && trace.rows.length > 0 ? (
              <div className="space-y-2">
                {trace.rows.slice(0, 12).map((row) => (
                  <div key={row.messageId} className="rounded-2xl border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{row.recipient}</p>
                        <p className="truncate text-xs text-slate-500">{row.identifier ?? row.channelMsgId ?? "-"}</p>
                      </div>
                      <span className={`rounded px-2 py-0.5 text-xs ${statusBadgeClass(row.messageStatus)}`}>
                        {statusLabel(row.messageStatus)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <p>Created: {formatDateTime(row.createdAt)}</p>
                      <p>Sent: {formatDateTime(row.sentAt)}</p>
                      {row.queueStatus && <p>Queue: {row.queueStatus}</p>}
                      {row.attempts > 0 && <p>Attempts: {row.attempts}/{row.maxRetries}</p>}
                      {row.lastError && <p className="text-red-600">Error: {row.lastError}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No recipient trace yet. Scheduled broadcasts will show rows after they start.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
