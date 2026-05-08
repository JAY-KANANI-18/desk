import type { ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Clock,
  Eye,
  Loader2,
  MessageSquareText,
  PanelLeftOpen,
  Users,
} from "@/components/ui/icons";
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
import {
  BroadcastChannelLabel,
  getBroadcastChannelDisplay,
} from "./BroadcastChannelLabel";
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

type TraceRow = BroadcastTrace["rows"][number];

const DELIVERY_STATUS_ORDER = [
  "read",
  "delivered",
  "sent",
  "sending",
  "queued",
  "pending",
  "failed",
  "bounced",
  "unsubscribed",
  "dead_letter",
];

function countStatuses(
  analytics: BroadcastAnalytics | null,
  statuses: string[],
) {
  return statuses.reduce(
    (total, status) => total + (analytics?.byStatus?.[status] ?? 0),
    0,
  );
}

function orderedStatusEntries(statuses: Record<string, number>) {
  const entries = Object.entries(statuses).filter(([, count]) => count > 0);

  return entries.sort(([left], [right]) => {
    const leftIndex = DELIVERY_STATUS_ORDER.indexOf(left);
    const rightIndex = DELIVERY_STATUS_ORDER.indexOf(right);

    return (
      (leftIndex === -1 ? DELIVERY_STATUS_ORDER.length : leftIndex) -
      (rightIndex === -1 ? DELIVERY_STATUS_ORDER.length : rightIndex)
    );
  });
}

function formatTemplateName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatLanguage(value?: string | null) {
  return value ? value.replace("_", "-") : "";
}

function getMessageTitle(run: BroadcastRunRow) {
  if (run.templateName) return formatTemplateName(run.templateName);
  return run.textPreview || "No message preview";
}

function getMessageMeta(run: BroadcastRunRow) {
  if (run.templateName) {
    const language = formatLanguage(run.templateLanguage);
    return language
      ? `Approved WhatsApp message (${language})`
      : "Approved WhatsApp message";
  }

  return contentModeLabel(run.contentMode);
}

function getRecipientTimeline(row: TraceRow) {
  if (row.readAt) return `Read ${formatDateTime(row.readAt)}`;
  if (row.deliveredAt) return `Delivered ${formatDateTime(row.deliveredAt)}`;
  if (row.sentAt) return `Sent ${formatDateTime(row.sentAt)}`;
  if (row.scheduledAt) return `Will send ${formatDateTime(row.scheduledAt)}`;
  return `Prepared ${formatDateTime(row.createdAt)}`;
}

function csvCell(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);
  const safeValue = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function csvRow(values: Array<string | number | null | undefined>) {
  return values.map(csvCell).join(",");
}

function reportFileName(run: BroadcastRunRow) {
  const name = run.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const date = new Date().toISOString().slice(0, 10);
  return `broadcast-report-${name || run.id}-${date}.csv`;
}

function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildBroadcastReportCsv({
  run,
  analytics,
  trace,
  deliveredCount,
  readCount,
  problemCount,
}: {
  run: BroadcastRunRow;
  analytics: BroadcastAnalytics | null;
  trace: BroadcastTrace | null;
  deliveredCount: number;
  readCount: number;
  problemCount: number;
}) {
  const channel = getBroadcastChannelDisplay(run.channel);
  const rows: string[] = [
    csvRow(["Broadcast report"]),
    csvRow(["Field", "Value"]),
    csvRow(["Broadcast name", run.name]),
    csvRow(["Progress", statusLabel(run.status)]),
    csvRow(["Send from", channel.name]),
    csvRow(["Channel", channel.typeLabel]),
    csvRow(["Send time", formatDateTime(run.scheduledAt)]),
    csvRow(["Finished", formatDateTime(run.completedAt)]),
    csvRow(["Message", getMessageTitle(run)]),
    csvRow(["Message type", getMessageMeta(run)]),
    csvRow(["People selected", run.totalAudience]),
    csvRow(["Sent", run.queuedCount]),
    csvRow(["Delivered", analytics ? deliveredCount : "Not loaded"]),
    csvRow(["Read", analytics ? readCount : "Not loaded"]),
    csvRow(["Need help", problemCount]),
    "",
    csvRow(["Delivery"]),
    csvRow(["Status", "People"]),
  ];

  if (analytics) {
    const statusRows = orderedStatusEntries(analytics.byStatus);
    if (statusRows.length > 0) {
      statusRows.forEach(([status, count]) => {
        rows.push(csvRow([statusLabel(status), count]));
      });
    } else {
      rows.push(csvRow(["No delivery updates yet", 0]));
    }
  } else {
    rows.push(csvRow(["Delivery not loaded", ""]));
  }

  rows.push(
    "",
    csvRow(["People"]),
    csvRow([
      "Name",
      "Contact",
      "Status",
      "Last update",
      "Sent at",
      "Delivered at",
      "Read at",
      "Attempts",
      "Problem",
      "Message ID",
    ]),
  );

  if (trace?.rows.length) {
    trace.rows.forEach((row) => {
      rows.push(
        csvRow([
          row.recipient,
          row.identifier,
          statusLabel(row.messageStatus),
          getRecipientTimeline(row),
          formatDateTime(row.sentAt),
          formatDateTime(row.deliveredAt),
          formatDateTime(row.readAt),
          `${row.attempts}/${row.maxRetries}`,
          row.lastError,
          row.channelMsgId,
        ]),
      );
    });
  } else {
    rows.push(csvRow(["No people loaded", "", "", "", "", "", "", "", "", ""]));
  }

  return rows.join("\n");
}

function SummaryCard({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "neutral" | "success" | "warning" | "primary";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : tone === "primary"
          ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] ring-[var(--color-primary-light)]"
          : "bg-slate-50 text-slate-700 ring-slate-100";

  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-3">
      <div
        className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-xl ring-1 ${toneClass}`}
      >
        {icon}
      </div>
      <p className="truncate text-[11px] font-medium text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 truncate text-lg font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {action}
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
  const deliveredCount = countStatuses(analytics, ["delivered", "read"]);
  const readCount = countStatuses(analytics, ["read"]);
  const problemCount =
    selectedRun.failedEnqueue +
    countStatuses(analytics, ["failed", "bounced", "dead_letter"]);
  const deliveryEntries = analytics ? orderedStatusEntries(analytics.byStatus) : [];
  const canDownloadReport = selectedRun.status !== "scheduled";
  const deliveredValue =
    selectedRun.status === "scheduled" ? 0 : analytics ? deliveredCount : "-";
  const readValue =
    selectedRun.status === "scheduled" ? 0 : analytics ? readCount : "-";
  const totalPeopleLabel = `${selectedRun.totalAudience} ${
    selectedRun.totalAudience === 1 ? "person" : "people"
  }`;
  const outcomeText =
    selectedRun.status === "scheduled"
      ? `Ready for ${totalPeopleLabel}`
      : selectedRun.status === "running"
        ? `Sending to ${totalPeopleLabel}`
        : problemCount > 0
          ? `${problemCount} ${
              problemCount === 1 ? "person needs" : "people need"
            } attention`
          : `Sent to ${selectedRun.queuedCount} ${
              selectedRun.queuedCount === 1 ? "person" : "people"
            }`;
  const handleDownloadReport = () => {
    downloadCsv(
      reportFileName(selectedRun),
      buildBroadcastReportCsv({
        run: selectedRun,
        analytics,
        trace,
        deliveredCount,
        readCount,
        problemCount,
      }),
    );
  };

  const content = (
    <div className="w-full max-w-full space-y-5 overflow-x-hidden px-5 py-5 text-sm">
      <section className="w-full max-w-full overflow-hidden border-b border-slate-100 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Broadcast
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold text-slate-950">
              {selectedRun.name}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{outcomeText}</p>
          </div>
          <div className="shrink-0">
            <BroadcastStatusTag status={selectedRun.status} />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <BroadcastChannelLabel
            channel={selectedRun.channel}
            className="max-w-full text-sm"
          />
          <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
            <Calendar size={14} className="shrink-0" />
            <span className="shrink-0">
              {selectedRun.status === "scheduled" ? "Scheduled for" : "Send time"}
            </span>
            <span className="min-w-0 truncate font-medium text-slate-700">
              {formatDateTime(selectedRun.scheduledAt)}
            </span>
          </div>
          {selectedRun.completedAt ? (
            <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
              <Clock size={14} className="shrink-0" />
              <span className="shrink-0">Finished</span>
              <span className="min-w-0 truncate font-medium text-slate-700">
                {formatDateTime(selectedRun.completedAt)}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      {canDownloadReport ? (
        <Button
          type="button"
          variant="secondary"
          fullWidth
          leftIcon={<Download size={15} />}
          onClick={handleDownloadReport}
          disabled={analyticsLoading || traceLoading}
        >
          Download report
        </Button>
      ) : null}

      <div className="grid w-full grid-cols-3 gap-2">
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
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
          This broadcast has started, so editing is locked to keep delivery
          history clear.
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

      <section className="w-full">
        <SectionHeader title="At a glance" />
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard
            label="People"
            value={selectedRun.totalAudience}
            icon={<Users size={15} />}
            tone="primary"
          />
          <SummaryCard
            label="Delivered"
            value={deliveredValue}
            icon={<CheckCircle2 size={15} />}
            tone="success"
          />
          <SummaryCard
            label="Read"
            value={readValue}
            icon={<Eye size={15} />}
            tone="neutral"
          />
          <SummaryCard
            label="Need help"
            value={problemCount}
            icon={<AlertCircle size={15} />}
            tone={problemCount > 0 ? "warning" : "neutral"}
          />
        </div>
      </section>

      <section className="w-full">
        <SectionHeader title="Message" />
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
              <MessageSquareText size={17} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-950">
                {getMessageTitle(selectedRun)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {getMessageMeta(selectedRun)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-t border-gray-100 pt-4">
        <SectionHeader
          title="Delivery"
          action={
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onRefreshAnalytics}
            >
              Refresh
            </Button>
          }
        />
        {analyticsLoading ? (
          <div className="flex items-center gap-2 py-4 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            Loading...
          </div>
        ) : analytics ? (
          <div className="space-y-3">
            {deliveryEntries.length > 0 ? (
              <ul className="space-y-2">
                {deliveryEntries.map(([status, count]) => (
                  <li
                    key={status}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-slate-700"
                  >
                    <span>{statusLabel(status)}</span>
                    <span className="font-semibold text-slate-950">{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
                Delivery updates will appear here after sending starts.
              </p>
            )}

            <div
              className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                problemCount > 0
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {problemCount > 0 ? (
                <>
                  {problemCount} {problemCount === 1 ? "person needs" : "people need"} attention.
                  Check the people list below for details.
                </>
              ) : (
                "No delivery problems found so far."
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No delivery updates yet.</p>
        )}
      </section>

      <section className="w-full border-t border-gray-100 pt-4">
        <SectionHeader
          title="People"
          action={
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onRefreshTrace}
            >
              Refresh
            </Button>
          }
        />
        {traceLoading ? (
          <div className="flex items-center gap-2 py-4 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            Loading people...
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
                    {row.identifier && row.identifier !== row.recipient ? (
                      <p className="truncate text-xs text-gray-500">
                        {row.identifier}
                      </p>
                    ) : null}
                  </div>
                  <BroadcastStatusTag status={row.messageStatus} />
                </div>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>{getRecipientTimeline(row)}</p>
                  {row.lastError && row.attempts > 0 ? (
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
            People will appear here once sending starts.
          </p>
        )}
      </section>
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
      <aside className={desktopContainerClassName ?? "flex h-full w-full min-w-0"}>
        <div className="relative flex h-full w-full min-w-0 flex-col overflow-hidden border-l border-[var(--color-gray-200)] bg-white">
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
