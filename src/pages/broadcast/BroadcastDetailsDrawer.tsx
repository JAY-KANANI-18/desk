import { BarChart3, Loader2, PanelLeftOpen } from "@/components/ui/icons";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SideModal } from "../../components/ui/Modal";
import { Tooltip } from "../../components/ui/Tooltip";
import { IconButton } from "../../components/ui/button/IconButton";
import { MobileSheet } from "../../components/ui/modal";
import { useIsMobile } from "../../hooks/useIsMobile";
import type {
  BroadcastAnalytics,
  BroadcastRunRow,
  BroadcastTrace,
} from "../../lib/broadcastApi";
import { BroadcastStatusTag } from "./BroadcastStatusTag";
import type { BroadcastDraftState } from "./types";
import {
  canMutateBroadcast,
  contentModeLabel,
  formatDateTime,
  statusLabel,
} from "./utils";

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
  desktopVariant?: "modal" | "inline";
  desktopContainerClassName?: string;
};

function StatItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-500">{label}</p>
      <p className="text-gray-900">{value}</p>
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
  desktopVariant = "modal",
  desktopContainerClassName,
}: BroadcastDetailsDrawerProps) {
  const isMobile = useIsMobile();

  if (!selectedRun) return null;
  const actionOpen = Boolean(broadcastAction);

  const content = (
    <div className="space-y-4 px-5 py-4 text-sm">
      <div>
        <p className="text-[11px] font-medium text-gray-500">Broadcast name</p>
        <p className="font-medium text-gray-900">{selectedRun.name}</p>
      </div>
      <div>
        <p className="text-[11px] font-medium text-gray-500">Progress</p>
        <div className="mt-1">
          <BroadcastStatusTag status={selectedRun.status} />
        </div>
      </div>
      <div>
        <p className="text-[11px] font-medium text-gray-500">Send from</p>
        <p className="mt-1 text-gray-900">
          {selectedRun.channel?.name ?? "-"}{" "}
          <span className="text-gray-400">
            ({selectedRun.channel?.type ?? "?"})
          </span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button
          disabled={
            !canMutateBroadcast(selectedRun.status) || broadcastActionSaving || actionOpen
          }
          onClick={() => onOpenBroadcastAction("edit")}
          variant="secondary"
         
          fullWidth
        >
          Rename
        </Button>
        <Button
          disabled={
            !canMutateBroadcast(selectedRun.status) || broadcastActionSaving || actionOpen
          }
          onClick={() => onOpenBroadcastAction("reschedule")}
          variant="secondary"
          fullWidth
        >
          Change time
        </Button>
        <Button
          disabled={
            !canMutateBroadcast(selectedRun.status) || broadcastActionSaving || actionOpen
          }
          onClick={onSendNow}
          variant="secondary"
          fullWidth
        >
          Send now
        </Button>
      </div>

      {!canMutateBroadcast(selectedRun.status) ? (
        <p className="text-xs text-gray-500">
          Once a broadcast starts sending, it is locked so the delivery history stays clear.
        </p>
      ) : null}

      {broadcastAction ? (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700">
            {broadcastAction === "edit"
              ? "Rename broadcast"
              : "Change send time"}
          </p>
          {broadcastAction === "edit" ? (
            <Input
              label="Broadcast name"
              inputSize="sm"
              value={broadcastDraft.name}
              onChange={(event) =>
                onBroadcastDraftChange({
                  ...broadcastDraft,
                  name: event.target.value,
                })
              }
            />
          ) : null}
          <Input
            label="When to send"
            type="datetime-local"
            inputSize="sm"
            value={broadcastDraft.scheduledAt}
            onChange={(event) =>
              onBroadcastDraftChange({
                ...broadcastDraft,
                scheduledAt: event.target.value,
              })
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={onCancelBroadcastAction}
              disabled={broadcastActionSaving}
              variant="secondary"
          
            >
              Cancel
            </Button>
            <Button
              onClick={onSaveBroadcastAction}
              disabled={broadcastActionSaving}
          
              loading={broadcastActionSaving}
              loadingMode="inline"
            >
              Save
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <StatItem
          label="Send time"
          value={formatDateTime(selectedRun.scheduledAt)}
        />
        <StatItem
          label="Finished"
          value={formatDateTime(selectedRun.completedAt)}
        />
        <StatItem label="People" value={selectedRun.totalAudience} />
        <StatItem label="Started" value={selectedRun.queuedCount} />
        <StatItem
          label="Needs help"
          value={selectedRun.failedEnqueue}
        />
        <StatItem label="Message type" value={contentModeLabel(selectedRun.contentMode)} />
      </div>

      {selectedRun.templateName || selectedRun.textPreview ? (
        <div>
          <p className="text-[11px] font-medium text-gray-500">Message</p>
          <p className="mt-1 text-gray-800">
            {selectedRun.templateName
              ? `${selectedRun.templateName} (${selectedRun.templateLanguage})`
              : selectedRun.textPreview}
          </p>
        </div>
      ) : null}

      <div className="border-t border-gray-100 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium text-gray-500">
            Delivery summary
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onRefreshAnalytics}
          >
            Refresh
          </Button>
        </div>
        {analyticsLoading ? (
          <div className="flex items-center gap-2 py-4 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            Loading...
          </div>
        ) : analytics ? (
          <div className="space-y-2">
            <p className="text-gray-700">
              People with updates:{" "}
              <span className="font-semibold">
                {analytics.totalRecipients ?? analytics.totalMessages}
              </span>
            </p>
            <ul className="space-y-1">
              {Object.entries(analytics.byStatus).map(([status, count]) => (
                <li key={status} className="flex justify-between text-gray-700">
                  <span>{statusLabel(status)}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
            {analytics.byQueueStatus &&
            Object.keys(analytics.byQueueStatus).length > 0 ? (
              <div className="pt-2">
                <p className="mb-1 text-[11px] font-medium text-gray-500">
                  Sending progress
                </p>
                <ul className="space-y-1">
                  {Object.entries(analytics.byQueueStatus).map(
                    ([status, count]) => (
                      <li
                        key={status}
                        className="flex justify-between text-gray-700"
                      >
                        <span>{statusLabel(status)}</span>
                        <span className="font-medium">{count}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              {analytics.queueNote}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No delivery summary yet.</p>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium text-gray-500">
            Recipients
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onRefreshTrace}
          >
            Refresh list
          </Button>
        </div>
        {traceLoading ? (
          <div className="flex items-center gap-2 py-4 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            Loading recipients...
          </div>
        ) : trace && trace.rows.length > 0 ? (
          <div className="space-y-2">
            {trace.rows.slice(0, 12).map((row, index) => (
              <div
                key={row.recipientId ?? row.messageId ?? `${row.contactId ?? "recipient"}-${index}`}
                className="rounded-2xl border border-gray-100 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {row.recipient}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {row.identifier ?? row.channelMsgId ?? "-"}
                    </p>
                  </div>
                  <BroadcastStatusTag status={row.messageStatus} />
                </div>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>Prepared: {formatDateTime(row.createdAt)}</p>
                  <p>Sent: {formatDateTime(row.sentAt)}</p>
                  {row.deliveredAt ? (
                    <p>Delivered: {formatDateTime(row.deliveredAt)}</p>
                  ) : null}
                  {row.readAt ? <p>Read: {formatDateTime(row.readAt)}</p> : null}
                  {row.queueStatus ? <p>Progress: {statusLabel(row.queueStatus)}</p> : null}
                  {row.attempts > 0 ? (
                    <p>
                      Tried {row.attempts} of {row.maxRetries} times
                    </p>
                  ) : null}
                  {row.lastError ? (
                    <p className="text-red-600">Problem: {row.lastError}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            No recipients to show yet.
          </p>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet
        isOpen
        onClose={onClose}
        fullScreen
        title={
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Broadcast
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900">
              <BarChart3 size={18} />
              Details
            </h2>
          </div>
        }
      >
        {content}
      </MobileSheet>
    );
  }

  if (desktopVariant === "inline") {
    return (
      <aside className={desktopContainerClassName ?? "flex h-full"}>
        <div className="relative flex h-full w-full flex-col overflow-hidden border-l border-[var(--color-gray-200)] bg-white">
          <div className="border-b border-[var(--color-gray-200)] py-4 pl-16 pr-4">
            <div className="absolute left-3 top-3 z-20">
              <Tooltip content="Hide broadcast details">
                <span className="inline-flex">
                  <IconButton
                    type="button"
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    aria-label="Hide broadcast details"
                    icon={<PanelLeftOpen size={18} />}
                  />
                </span>
              </Tooltip>
            </div>

            <div className="flex min-h-[26px] min-w-0 items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-[var(--color-gray-900)]">
                Broadcast details
              </h2>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {content}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <SideModal
      isOpen
      onClose={onClose}
      title="Broadcast details"
      headerIcon={<BarChart3 size={18} />}
      width={448}
      bodyPadding="none"
      closeOnOverlayClick={false}
      showOverlay={false}
      allowBackgroundInteraction
      lockBodyScroll={false}
    >
      <div className="h-full overflow-y-auto">
        {content}
      </div>
    </SideModal>
  );
}
