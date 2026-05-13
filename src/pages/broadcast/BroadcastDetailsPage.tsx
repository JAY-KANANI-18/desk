import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
  Users,
} from "@/components/ui/icons";
import { BackButton } from "../../components/channels/BackButton";
import { Button } from "../../components/ui/Button";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { ListPagination } from "../../components/ui/ListPagination";
import { PageLayout } from "../../components/ui/PageLayout";
import { ResponsiveModal } from "../../components/ui/modal";
import { Tooltip } from "../../components/ui/Tooltip";
import { TruncatedText } from "../../components/ui/TruncatedText";
import { channelSupportsBroadcast } from "../../config/channelMetadata";
import type {
  BroadcastAnalytics,
  BroadcastRunRow,
  BroadcastTrace,
  BroadcastTraceFilter,
} from "../../lib/broadcastApi";
import {
  WhatsAppPreview,
  type Template as WhatsAppPreviewTemplate,
} from "../inbox/TemplateModal";
import { BroadcastChannelLabel, getBroadcastChannelDisplay } from "./BroadcastChannelLabel";
import { BroadcastStatusTag } from "./BroadcastStatusTag";
import type { BroadcastDraftState } from "./types";
import {
  canMutateBroadcast,
  contentModeLabel,
  formatDateTime,
  statusLabel,
} from "./utils";

type BroadcastDetailsPageProps = {
  selectedRun: BroadcastRunRow | null;
  detailsLoading: boolean;
  analytics: BroadcastAnalytics | null;
  analyticsLoading: boolean;
  trace: BroadcastTrace | null;
  traceLoading: boolean;
  traceFilter: BroadcastTraceFilter;
  tracePage: number;
  traceLimit: number;
  broadcastAction: "edit" | "reschedule" | null;
  broadcastActionSaving: boolean;
  broadcastDraft: BroadcastDraftState;
  onBroadcastDraftChange: (next: BroadcastDraftState) => void;
  onBack: () => void;
  onOpenBroadcastAction: (action: "edit" | "reschedule") => void;
  onCancelBroadcastAction: () => void;
  onSaveBroadcastAction: () => void;
  onSendNow: () => void;
  onRefreshAnalytics: () => void;
  onRefreshTrace: () => void;
  onTraceFilterChange: (filter: BroadcastTraceFilter) => void | Promise<void>;
  onTracePageChange: (page: number) => void | Promise<void>;
};

type TraceRow = BroadcastTrace["rows"][number];
type TemplateComponent = {
  type?: string;
  format?: string;
  text?: string;
  buttons?: Array<{
    type?: string;
    text?: string;
    url?: string;
    phone_number?: string;
  }>;
  example?: {
    header_handle?: string[];
  };
};
type TemplateSnapshot = {
  id?: string;
  name?: string;
  language?: string;
  category?: string;
  components?: TemplateComponent[];
};

function countStatuses(
  analytics: BroadcastAnalytics | null,
  statuses: string[],
) {
  return statuses.reduce(
    (total, status) => total + (analytics?.byStatus?.[status] ?? 0),
    0,
  );
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

function getRecipientErrorText(value: string) {
  if (/request failed with status code 4\d\d/i.test(value)) {
    return "The messaging provider rejected this recipient. Check that the contact can receive messages on this channel, then try again.";
  }

  if (/request failed with status code 5\d\d/i.test(value)) {
    return "The messaging provider had a temporary problem. Try again in a few minutes.";
  }

  return value;
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
  sentCount,
  deliveredCount,
  readCount,
  problemCount,
}: {
  run: BroadcastRunRow;
  analytics: BroadcastAnalytics | null;
  trace: BroadcastTrace | null;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  problemCount: number;
}) {
  const channel = getBroadcastChannelDisplay(run.channel);
  const rows: string[] = [
    csvRow(["Broadcast report"]),
    csvRow(["Field", "Value"]),
    csvRow(["Broadcast name", run.name]),
    csvRow(["Status", statusLabel(run.status)]),
    csvRow(["Send from", channel.name]),
    csvRow(["Channel", channel.typeLabel]),
    csvRow(["Scheduled", formatDateTime(run.scheduledAt)]),
    csvRow(["Completed", formatDateTime(run.completedAt)]),
    csvRow(["Message", getMessageTitle(run)]),
    csvRow(["Message type", getMessageMeta(run)]),
    csvRow(["Audience", run.totalAudience]),
    csvRow(["Sent", analytics ? sentCount : "Not loaded"]),
    csvRow(["Delivered", analytics ? deliveredCount : "Not loaded"]),
    csvRow(["Read", analytics ? readCount : "Not loaded"]),
    csvRow(["Need attention", problemCount]),
    "",
    csvRow(["People"]),
    csvRow([
      "Name",
      "Contact",
      "Status",
      "Last update",
      "Attempts",
      "Problem",
      "Provider message ID",
    ]),
  ];

  if (trace?.rows.length) {
    trace.rows.forEach((row) => {
      rows.push(
        csvRow([
          row.recipient,
          row.identifier,
          statusLabel(row.messageStatus),
          getRecipientTimeline(row),
          `${row.attempts}/${row.maxRetries}`,
          row.lastError ? getRecipientErrorText(row.lastError) : "",
          row.channelMsgId,
        ]),
      );
    });
  } else {
    rows.push(csvRow(["No people loaded", "", "", "", "", "", ""]));
  }

  return rows.join("\n");
}

function formatCountMeta(value: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function formatAudienceLabel(count: number) {
  return `${count} ${count === 1 ? "person" : "people"}`;
}

function recipientFilterLabel(filter: BroadcastTraceFilter) {
  if (filter === "all") return "all recipients";
  if (filter === "attention") return "recipients needing attention";
  return `${statusLabel(filter)} recipients`.toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTemplateSnapshot(run: BroadcastRunRow): TemplateSnapshot | null {
  if (!isRecord(run.templateSnapshot)) return null;
  const components = Array.isArray(run.templateSnapshot.components)
    ? run.templateSnapshot.components.filter(isRecord)
    : [];

  return {
    id: typeof run.templateSnapshot.id === "string" ? run.templateSnapshot.id : run.id,
    name:
      typeof run.templateSnapshot.name === "string"
        ? run.templateSnapshot.name
        : run.templateName ?? run.name,
    language:
      typeof run.templateSnapshot.language === "string"
        ? run.templateSnapshot.language
        : run.templateLanguage ?? undefined,
    category:
      typeof run.templateSnapshot.category === "string"
        ? run.templateSnapshot.category
        : undefined,
    components: components as TemplateComponent[],
  };
}

function templatePreviewValues(run: BroadcastRunRow) {
  if (!isRecord(run.templateVariables)) return {};

  return Object.entries(run.templateVariables).reduce<Record<string, string>>(
    (values, [key, value]) => {
      values[key] = value == null ? "" : String(value);
      return values;
    },
    {},
  );
}

function extractTemplateKeys(...texts: Array<string | undefined>) {
  const keys = texts.flatMap((text) =>
    text ? [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]) : [],
  );
  return Array.from(new Set(keys));
}

function normalizeTemplateCategory(
  category: string | undefined,
): WhatsAppPreviewTemplate["category"] {
  const normalized = category?.toUpperCase();
  if (
    normalized === "UTILITY" ||
    normalized === "AUTHENTICATION" ||
    normalized === "SERVICE"
  ) {
    return normalized;
  }
  return "MARKETING";
}

function buildWhatsAppPreviewTemplate(
  run: BroadcastRunRow,
): WhatsAppPreviewTemplate | null {
  if (run.channel?.type !== "whatsapp" || !run.templateName) return null;

  const snapshot = getTemplateSnapshot(run);
  const components = snapshot?.components ?? [];
  const getComponent = (type: string) =>
    components.find((component) => component.type === type);
  const header = getComponent("HEADER");
  const body = getComponent("BODY");
  const footer = getComponent("FOOTER");
  const buttonsComponent = getComponent("BUTTONS");
  const bodyText = body?.text ?? run.textPreview ?? "";
  const headerText = header?.format === "TEXT" ? header.text : undefined;
  const headerMedia = header?.example?.header_handle?.[0];
  const formatType: Record<string, WhatsAppPreviewTemplate["type"]> = {
    IMAGE: "image",
    VIDEO: "video",
    DOCUMENT: "document",
    LOCATION: "location",
  };
  const type = header?.format ? formatType[header.format] ?? "text" : "text";
  const buttons = (buttonsComponent?.buttons ?? []).map((button) => {
    const label = button.text || "Button";
    if (button.type === "URL") {
      return { kind: "url" as const, label, url: button.url ?? "" };
    }
    if (button.type === "PHONE_NUMBER") {
      return { kind: "phone" as const, label, phone: button.phone_number ?? "" };
    }
    if (button.type === "COPY_CODE") {
      return { kind: "copy_code" as const, label, code: label };
    }
    return { kind: "quick_reply" as const, label };
  });
  const variables = extractTemplateKeys(headerText, bodyText, footer?.text).map((key) => ({
    key,
    label: key,
  }));

  return {
    id: snapshot?.id ?? run.id,
    name: snapshot?.name ?? run.templateName ?? run.name,
    category: normalizeTemplateCategory(snapshot?.category),
    language: snapshot?.language ?? run.templateLanguage ?? "",
    type,
    header: headerText ?? (type === "document" ? header?.text : undefined),
    body: bodyText || getMessageTitle(run),
    footer: footer?.text,
    buttons: buttons.length ? buttons : undefined,
    mediaUrl: type === "image" || type === "video" ? headerMedia : undefined,
    variables,
  };
}

function MetricTile({
  label,
  value,
  meta,
  icon,
  selected,
  onClick,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  meta?: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void | Promise<void>;
  tone?: "neutral" | "success" | "warning" | "primary";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700"
        : tone === "primary"
          ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
          : "bg-slate-50 text-slate-600";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-w-0 rounded-lg border bg-white p-4 text-left transition hover:border-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
        selected
          ? "border-[var(--color-primary)] shadow-[0_10px_24px_rgba(79,70,229,0.10)]"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 flex min-w-0 items-end gap-2">
        <p className="truncate text-2xl font-semibold text-slate-950">{value}</p>
        {meta ? <p className="pb-1 text-xs text-slate-500">{meta}</p> : null}
      </div>
    </button>
  );
}

function DetailItem({
  label,
  value,
  meta,
  icon,
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-start gap-2">
        {icon ? <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span> : null}
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <div className="mt-1 min-w-0 text-sm font-semibold text-slate-950">{value}</div>
          {meta ? <div className="mt-1 text-sm text-slate-500">{meta}</div> : null}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function BroadcastDetailsPage({
  selectedRun,
  detailsLoading,
  analytics,
  analyticsLoading,
  trace,
  traceLoading,
  traceFilter,
  tracePage,
  traceLimit,
  broadcastAction,
  broadcastActionSaving,
  broadcastDraft,
  onBroadcastDraftChange,
  onBack,
  onOpenBroadcastAction,
  onCancelBroadcastAction,
  onSaveBroadcastAction,
  onSendNow,
  onRefreshAnalytics,
  onRefreshTrace,
  onTraceFilterChange,
  onTracePageChange,
}: BroadcastDetailsPageProps) {
  const [messagePreviewOpen, setMessagePreviewOpen] = useState(false);

  if (detailsLoading && !selectedRun) {
    return (
      <PageLayout
        eyebrow="Broadcasts"
        title="Broadcast details"
        leading={<BackButton onClick={onBack} ariaLabel="Back to broadcasts" />}
        className="bg-white"
      >
        <div className="flex min-h-[360px] items-center justify-center gap-3 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Loading broadcast details...
        </div>
      </PageLayout>
    );
  }

  if (!selectedRun) {
    return (
      <PageLayout
        eyebrow="Broadcasts"
        title="Broadcast details"
        leading={<BackButton onClick={onBack} ariaLabel="Back to broadcasts" />}
        className="bg-white"
      >
        <div className="mx-auto flex min-h-[360px] max-w-lg flex-col items-center justify-center px-6 text-center">
          <AlertCircle size={28} className="text-amber-500" />
          <h1 className="mt-3 text-lg font-semibold text-slate-950">
            Broadcast not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This broadcast may have been deleted or you may not have access to it.
          </p>
          <Button className="mt-5" variant="secondary" onClick={onBack}>
            Back to broadcasts
          </Button>
        </div>
      </PageLayout>
    );
  }

  const deliveredCount = countStatuses(analytics, ["delivered", "read"]);
  const readCount = countStatuses(analytics, ["read"]);
  const sentCount = countStatuses(analytics, ["sent", "delivered", "read"]);
  const problemCount =
    selectedRun.failedEnqueue +
    countStatuses(analytics, ["failed", "bounced", "dead_letter"]);
  const selectedChannelSupportsBroadcast = channelSupportsBroadcast(
    selectedRun.channel?.type,
  );
  const actionOpen = Boolean(broadcastAction);
  const canEdit = canMutateBroadcast(selectedRun.status);
  const canDownloadReport = selectedRun.status !== "scheduled";
  const refreshLoading = analyticsLoading || traceLoading;
  const timingLabel = selectedRun.status === "scheduled" ? "Scheduled for" : "Started";
  const timingValue =
    selectedRun.status === "scheduled"
      ? selectedRun.scheduledAt
      : selectedRun.startedAt ?? selectedRun.scheduledAt ?? selectedRun.createdAt;
  const outcomeText =
    selectedRun.status === "scheduled"
      ? `${formatAudienceLabel(selectedRun.totalAudience)} selected`
      : problemCount > 0
        ? `${formatAudienceLabel(problemCount)} need attention`
        : "No delivery problems found";
  const traceRows = trace?.rows ?? [];
  const traceTotal = trace?.total ?? selectedRun.totalAudience;
  const traceFilteredTotal = trace?.filteredTotal ?? traceRows.length;
  const traceTotalPages = trace?.totalPages ?? 1;
  const peopleDescription = trace
    ? traceFilter === "all"
      ? `${traceTotal} ${traceTotal === 1 ? "recipient" : "recipients"}`
      : `${traceFilteredTotal} of ${traceTotal} ${recipientFilterLabel(traceFilter)}`
    : undefined;
  const whatsappPreviewTemplate = buildWhatsAppPreviewTemplate(selectedRun);
  const whatsappPreviewValues = templatePreviewValues(selectedRun);

  const peopleColumns: Array<DataTableColumn<TraceRow>> = [
      {
        id: "recipient",
        header: "Recipient",
        width: 220,
        mobile: "primary",
        cell: (row) => (
          <TruncatedText
            text={row.recipient}
            maxLength={44}
            className="block font-medium text-slate-950"
          />
        ),
      },
      {
        id: "identifier",
        header: "Contact",
        width: 210,
        mobile: "secondary",
        cell: (row) =>
          row.identifier ? (
            <TruncatedText
              text={row.identifier}
              maxLength={42}
              className="block text-slate-600"
            />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        width: 150,
        mobile: "detail",
        cell: (row) => <BroadcastStatusTag status={row.messageStatus} />,
      },
      {
        id: "lastUpdate",
        header: "Last update",
        width: 230,
        mobile: "detail",
        cell: (row) => (
          <span className="whitespace-nowrap text-slate-600">
            {getRecipientTimeline(row)}
          </span>
        ),
      },
      {
        id: "attempts",
        header: "Attempts",
        width: 100,
        mobile: "detail",
        cell: (row) => (
          <Tooltip content="Delivery attempts used">
            <span className="text-slate-600">
              {row.attempts ? `${row.attempts}/${row.maxRetries}` : "-"}
            </span>
          </Tooltip>
        ),
      },
      {
        id: "problem",
        header: "Problem",
        width: 360,
        mobile: "detail",
        cell: (row) =>
          row.lastError ? (
            <TruncatedText
              text={getRecipientErrorText(row.lastError)}
              maxLines={2}
              className="block max-w-[340px] text-red-600"
            />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
    ];

  const handleRefreshAll = () => {
    onRefreshAnalytics();
    onRefreshTrace();
  };

  const handleDownloadReport = () => {
    downloadCsv(
      reportFileName(selectedRun),
      buildBroadcastReportCsv({
        run: selectedRun,
        analytics,
        trace,
        sentCount,
        deliveredCount,
        readCount,
        problemCount,
      }),
    );
  };

  const renderHeaderActions = () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        leftIcon={<RefreshCw size={15} />}
        onClick={handleRefreshAll}
        loading={refreshLoading}
        loadingMode="inline"
      >
        Refresh
      </Button>
      {canDownloadReport ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Download size={15} />}
          onClick={handleDownloadReport}
        >
          Report
        </Button>
      ) : null}
      {canEdit && !actionOpen ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenBroadcastAction("edit")}
          >
            Rename
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenBroadcastAction("reschedule")}
          >
            Reschedule
          </Button>
          {selectedChannelSupportsBroadcast ? (
            <Button
              type="button"
              size="sm"
              leftIcon={<Send size={15} />}
              onClick={onSendNow}
              loading={broadcastActionSaving}
              loadingMode="inline"
            >
              Send now
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );

  const mobileHeader = (
    <div className="border-b border-slate-200 px-4 py-4 md:hidden">
      <div className="flex min-w-0 items-start gap-3">
        <BackButton onClick={onBack} ariaLabel="Back to broadcasts" size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-slate-400">Broadcasts</p>
          <h1 className="mt-1 truncate text-xl font-semibold text-slate-950">
            {selectedRun.name}
          </h1>
        </div>
      </div>
      <div className="mt-4">{renderHeaderActions()}</div>
    </div>
  );

  return (
    <PageLayout
      eyebrow="Broadcasts"
      title={selectedRun.name}
      leading={<BackButton onClick={onBack} ariaLabel="Back to broadcasts" />}
      actions={renderHeaderActions()}
      className="bg-white"
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden bg-white px-0 py-0"
    >
      <div className="mobile-borderless flex h-full min-h-0 flex-col bg-white">
        {mobileHeader}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
          <div className="mx-auto w-full max-w-7xl space-y-5">
            <div className="border-b border-slate-200 pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <BroadcastStatusTag status={selectedRun.status} />
                <span className="text-sm text-slate-500">{outcomeText}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-5">
                <DetailItem
                  label={timingLabel}
                  value={formatDateTime(timingValue)}
                  icon={<Calendar size={15} />}
                />
                <DetailItem
                  label="Message"
                  value={
                    <Tooltip content="Preview message">
                      <button
                        type="button"
                        onClick={() => setMessagePreviewOpen(true)}
                        className="block max-w-full text-left text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        <TruncatedText
                          text={getMessageTitle(selectedRun)}
                          maxLength={48}
                          className="block"
                        />
                      </button>
                    </Tooltip>
                  }
                  meta={getMessageMeta(selectedRun)}
                  icon={<MessageSquareText size={15} />}
                />
                <DetailItem
                  label="Send from"
                  value={<BroadcastChannelLabel channel={selectedRun.channel} />}
                />
                <DetailItem
                  label="Finished"
                  value={
                    selectedRun.completedAt
                      ? formatDateTime(selectedRun.completedAt)
                      : "Not finished yet"
                  }
                  icon={<Clock size={15} />}
                />
                <DetailItem
                  label="Audience"
                  value={formatAudienceLabel(selectedRun.totalAudience)}
                  icon={<Users size={15} />}
                />
              </div>
            </div>

            {broadcastAction ? (
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div
                  className={
                    broadcastAction === "edit"
                      ? "grid gap-3 md:grid-cols-[minmax(0,1fr)_260px_auto] md:items-end"
                      : "grid gap-3 md:grid-cols-[260px_auto] md:items-end"
                  }
                >
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
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={onCancelBroadcastAction}
                      disabled={broadcastActionSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onSaveBroadcastAction}
                      loading={broadcastActionSaving}
                      loadingMode="inline"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            <Section
              title="Audience & status"
              action={
                analyticsLoading ? (
                  <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 size={14} className="animate-spin" />
                    Loading
                  </span>
                ) : null
              }
            >
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <MetricTile
                  label="Audience"
                  value={selectedRun.totalAudience}
                  icon={<Users size={16} />}
                  tone="primary"
                  selected={traceFilter === "all"}
                  onClick={() => onTraceFilterChange("all")}
                />
                <MetricTile
                  label="Sent"
                  value={analytics ? sentCount : selectedRun.queuedCount}
                  meta={analytics ? formatCountMeta(sentCount, selectedRun.totalAudience) : undefined}
                  icon={<Send size={16} />}
                  selected={traceFilter === "sent"}
                  onClick={() => onTraceFilterChange("sent")}
                />
                <MetricTile
                  label="Delivered"
                  value={analytics ? deliveredCount : "-"}
                  meta={analytics ? formatCountMeta(deliveredCount, selectedRun.totalAudience) : undefined}
                  icon={<CheckCircle2 size={16} />}
                  tone="success"
                  selected={traceFilter === "delivered"}
                  onClick={() => onTraceFilterChange("delivered")}
                />
                <MetricTile
                  label="Read"
                  value={analytics ? readCount : "-"}
                  meta={analytics ? formatCountMeta(readCount, selectedRun.totalAudience) : undefined}
                  icon={<Eye size={16} />}
                  selected={traceFilter === "read"}
                  onClick={() => onTraceFilterChange("read")}
                />
                <MetricTile
                  label="Need attention"
                  value={problemCount}
                  meta={analytics ? formatCountMeta(problemCount, selectedRun.totalAudience) : undefined}
                  icon={<AlertCircle size={16} />}
                  tone={problemCount > 0 ? "warning" : "neutral"}
                  selected={traceFilter === "attention"}
                  onClick={() => onTraceFilterChange("attention")}
                />
              </div>
            </Section>

            <Section
              title="People"
              description={peopleDescription}
              action={
                traceLoading ? (
                  <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 size={14} className="animate-spin" />
                    Loading
                  </span>
                ) : null
              }
            >
              <DataTable
                className="min-h-[360px] rounded-lg border border-slate-200"
                rows={traceRows}
                columns={peopleColumns}
                getRowId={(row) =>
                  row.recipientId ?? row.messageId ?? `${row.contactId ?? "recipient"}-${row.identifier ?? row.createdAt}`
                }
                loading={traceLoading && !trace}
                loadingLabel="Loading recipients..."
                emptyTitle={
                  traceFilter === "all"
                    ? "No recipients loaded"
                    : `No ${recipientFilterLabel(traceFilter)}`
                }
                emptyDescription={
                  traceFilter === "all"
                    ? "People will appear here once sending starts."
                    : "Choose another status to see more recipients."
                }
                minTableWidth={1270}
                density="compact"
                tableLayout="fixed"
                mobileLoadMore={
                  trace && tracePage < traceTotalPages
                    ? {
                        hasMore: true,
                        loading: traceLoading,
                        onLoadMore: () => void onTracePageChange(tracePage + 1),
                        loadingLabel: "Loading more recipients...",
                      }
                    : undefined
                }
                footer={
                  trace && traceTotalPages > 1 ? (
                    <ListPagination
                      page={tracePage}
                      totalPages={traceTotalPages}
                      total={traceFilteredTotal}
                      limit={traceLimit}
                      itemLabel="recipients"
                      onPageChange={(page) => void onTracePageChange(page)}
                    />
                  ) : null
                }
                renderMobileCard={(row) => (
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <TruncatedText
                          text={row.recipient}
                          maxLength={46}
                          className="block font-semibold text-slate-950"
                        />
                        {row.identifier ? (
                          <TruncatedText
                            text={row.identifier}
                            maxLength={46}
                            className="mt-1 block text-xs text-slate-500"
                          />
                        ) : null}
                      </div>
                      <BroadcastStatusTag status={row.messageStatus} size="sm" />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600">
                      <span>{getRecipientTimeline(row)}</span>
                      {row.attempts ? (
                        <span>Tried {row.attempts} of {row.maxRetries} times</span>
                      ) : null}
                      {row.lastError ? (
                        <TruncatedText
                          text={getRecipientErrorText(row.lastError)}
                          maxLines={3}
                          className="text-red-600"
                        />
                      ) : null}
                    </div>
                  </article>
                )}
              />
            </Section>
          </div>
        </div>
      </div>

      <ResponsiveModal
        isOpen={messagePreviewOpen}
        onClose={() => setMessagePreviewOpen(false)}
        title="Message preview"
        size="md"
        mobileFullScreen
        mobileBorderless
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">Message</p>
            <h2 className="mt-1 text-base font-semibold text-slate-950">
              {getMessageTitle(selectedRun)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{getMessageMeta(selectedRun)}</p>
          </div>

          {whatsappPreviewTemplate ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <WhatsAppPreview
                template={whatsappPreviewTemplate}
                values={whatsappPreviewValues}
              />
            </div>
          ) : selectedRun.textPreview ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {selectedRun.textPreview}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500">
              Template content is generated from the approved provider template when the broadcast is sent.
            </div>
          )}
        </div>
      </ResponsiveModal>
    </PageLayout>
  );
}
