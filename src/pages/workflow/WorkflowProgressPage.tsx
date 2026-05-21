import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Eye,
  FileText,
  GitBranch,
  Info,
  Loader2,
  MessageSquare,
  RefreshCw,
  User,
  Workflow as WorkflowIcon,
  XCircle,
  Zap,
} from "@/components/ui/icons";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/button/IconButton";
import { SearchInput } from "../../components/ui/inputs";
import { ListPagination } from "../../components/ui/ListPagination";
import { PageLayout } from "../../components/ui/PageLayout";
import { Tooltip } from "../../components/ui/Tooltip";
import { useMobileHeaderActions } from "../../components/mobileHeaderActions";
import { useIsMobile } from "../../hooks/useIsMobile";
import { workspaceApi } from "../../lib/workspaceApi";
import type {
  WorkflowRunListItem,
  WorkflowRunListResponse,
  WorkflowRunStatus,
  WorkflowRunStepEvent,
  WorkflowRunSummary,
} from "./workflow.types";

type RunFilterStatus = "all" | WorkflowRunStatus;

const RUN_FILTERS: Array<{ value: RunFilterStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "waiting", label: "Waiting" },
  { value: "failed", label: "Failed" },
  { value: "completed", label: "Completed" },
];

const EMPTY_SUMMARY: WorkflowRunSummary = {
  total: 0,
  running: 0,
  waiting: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
  active: 0,
  attention: 0,
  successRate: null,
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusMeta: Record<
  WorkflowRunStatus,
  {
    label: string;
    text: string;
    bg: string;
    border: string;
    dot: string;
    icon: typeof Activity;
  }
> = {
  running: {
    label: "Running",
    text: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    dot: "bg-sky-500",
    icon: Activity,
  },
  waiting: {
    label: "Waiting",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    text: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-400",
    icon: AlertCircle,
  },
};

const stepStatusMeta: Record<
  string,
  {
    label: string;
    text: string;
    bg: string;
    border: string;
    icon: typeof Circle;
  }
> = {
  completed: {
    label: "Completed",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  running: {
    label: "Running",
    text: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    icon: Loader2,
  },
  failed: {
    label: "Failed",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: XCircle,
  },
  skipped: {
    label: "Skipped",
    text: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: Circle,
  },
  pending: {
    label: "Pending",
    text: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: Circle,
  },
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getRunStatusMeta(status: string) {
  return statusMeta[status as WorkflowRunStatus] ?? statusMeta.cancelled;
}

function getStepStatusMeta(status: string) {
  return stepStatusMeta[status] ?? stepStatusMeta.pending;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return dateTimeFormatter.format(date);
}

function formatDuration(ms?: number | null) {
  if (ms === null || ms === undefined) return "Not measured";
  if (ms < 1000) return "<1s";

  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
}

function formatRelative(value?: string | null) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return `${Math.floor(diffMs / 86_400_000)}d ago`;
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function summarizeRun(run: WorkflowRunListItem) {
  if (run.status === "failed") {
    return run.error || `Failed at ${run.currentStepName ?? "workflow step"}`;
  }
  if (run.status === "waiting") {
    return `Waiting at ${run.currentStepName ?? "customer response"}`;
  }
  if (run.status === "running") {
    return `Now running ${run.currentStepName ?? "next step"}`;
  }
  if (run.status === "completed") {
    return `Completed in ${formatDuration(run.durationMs)}`;
  }
  return "Run stopped before completion";
}

function jsonPreview(value: unknown) {
  if (value === undefined || value === null) return "No context recorded";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function StepIcon({ status }: { status: string }) {
  const meta = getStepStatusMeta(status);
  const Icon = meta.icon;
  return (
    <span
      className={cx(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
        meta.bg,
        meta.border,
        meta.text,
      )}
    >
      <Icon size={14} className={status === "running" ? "animate-spin" : undefined} />
    </span>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const meta = getRunStatusMeta(status);
  const Icon = meta.icon;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-semibold",
        meta.bg,
        meta.border,
        meta.text,
      )}
    >
      <Icon size={12} className={status === "running" ? "animate-pulse" : undefined} />
      {meta.label}
    </span>
  );
}

function SummaryMetric({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  tone?: "neutral" | "blue" | "amber" | "rose" | "emerald";
}) {
  const valueTone = {
    neutral: "text-slate-950",
    blue: "text-sky-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
    emerald: "text-emerald-700",
  }[tone];

  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className={cx("mt-1 text-2xl font-semibold", valueTone)}>{value}</p>
      <p className="mt-1 truncate text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function OperationsSummary({ summary }: { summary: WorkflowRunSummary }) {
  const stableRuns = Math.max(0, summary.total - summary.attention);
  const healthTone = summary.attention > 0 ? "amber" : "emerald";

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(280px,1.15fr)_minmax(0,2fr)]">
        <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Automation monitor</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Workflow health</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Runs are grouped by what an operator needs to know first: live movement, waiting points, and failures.
              </p>
            </div>
            <span
              className={cx(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                healthTone === "amber"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
            >
              <span
                className={cx(
                  "h-1.5 w-1.5 rounded-full",
                  healthTone === "amber" ? "bg-amber-500" : "bg-emerald-500",
                )}
              />
              {summary.attention > 0 ? "Attention needed" : "Healthy"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <div className="px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Total</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{summary.total}</p>
            </div>
            <div className="border-l border-slate-200 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Stable</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">{stableRuns}</p>
            </div>
            <div className="border-l border-slate-200 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Review</p>
              <p className="mt-1 text-lg font-semibold text-amber-700">{summary.attention}</p>
            </div>
          </div>
        </div>

        <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <SummaryMetric
            label="Active now"
            value={summary.active}
            helper={`${summary.running} running, ${summary.waiting} waiting`}
            tone="blue"
          />
          <SummaryMetric
            label="Needs eyes"
            value={summary.attention}
            helper="Waiting or failed"
            tone={summary.attention > 0 ? "amber" : "emerald"}
          />
          <SummaryMetric
            label="Failed"
            value={summary.failed}
            helper="Stopped early"
            tone="rose"
          />
          <SummaryMetric
            label="Success rate"
            value={summary.successRate === null ? "-" : `${summary.successRate}%`}
            helper="Completed vs failed"
            tone="emerald"
          />
        </div>
      </div>
    </section>
  );
}

function ProgressRail({ run }: { run: WorkflowRunListItem }) {
  const progress = run.progress;
  const failed = progress.failed > 0;
  const barColor = failed
    ? "bg-rose-500"
    : run.status === "waiting"
      ? "bg-amber-500"
      : run.status === "completed"
        ? "bg-emerald-500"
        : "bg-sky-500";

  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cx("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${Math.max(6, progress.percent)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>{progress.completed} completed</span>
        <span>
          {progress.percent}% of mapped path
        </span>
      </div>
    </div>
  );
}

function RunCard({
  run,
  selected,
  onSelect,
}: {
  run: WorkflowRunListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = getRunStatusMeta(run.status);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        "w-full rounded-lg border bg-white p-3.5 text-left transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]",
        selected
          ? "border-[var(--color-primary)] bg-indigo-50/40 shadow-sm ring-1 ring-[var(--color-primary-light)]"
          : "border-slate-200",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={run.contact.name} src={run.contact.avatarUrl ?? undefined} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{run.workflowName}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{run.contact.name}</p>
            </div>
            <RunStatusBadge status={run.status} />
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-700">{summarizeRun(run)}</p>

          <div className="mt-3">
            <ProgressRail run={run} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className={cx("h-1.5 w-1.5 rounded-full", meta.dot)} />
              Started {formatRelative(run.startedAt)}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{formatDuration(run.durationMs)}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>#{shortId(run.id)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function StepTrailPreview({ steps }: { steps: WorkflowRunStepEvent[] }) {
  if (steps.length === 0) {
    return <p className="text-sm text-slate-500">No steps have been recorded for this run yet.</p>;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {steps.slice(-5).map((step, index) => {
        const meta = getStepStatusMeta(step.status);
        const Icon = meta.icon;
        return (
          <div key={step.id} className="flex min-w-0 items-center gap-2">
            {index > 0 ? <ChevronRight size={13} className="shrink-0 text-slate-300" /> : null}
            <Tooltip content={`${step.name} - ${meta.label}`}>
              <span
                className={cx(
                  "inline-flex h-7 max-w-[140px] items-center gap-1.5 rounded-full border px-2 text-xs font-medium",
                  meta.bg,
                  meta.border,
                  meta.text,
                )}
              >
                <Icon size={12} className={step.status === "running" ? "animate-spin" : undefined} />
                <span className="truncate">{step.name}</span>
              </span>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}

function ContextBlock({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 p-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
          <div className="mt-1 text-sm font-semibold leading-5 text-slate-900">{value}</div>
          {helper ? <div className="mt-1 break-words text-xs leading-5 text-slate-500">{helper}</div> : null}
        </div>
      </div>
    </div>
  );
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <FileText size={14} className="text-slate-400" />
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      </div>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words px-3 py-3 text-[11px] leading-5 text-slate-600">
        {jsonPreview(value)}
      </pre>
    </div>
  );
}

function StepTimeline({ steps }: { steps: WorkflowRunStepEvent[] }) {
  if (steps.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        The run has started, but no step execution has been written yet.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const meta = getStepStatusMeta(step.status);
        return (
          <div key={step.id} className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 ? (
              <span className="absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px bg-slate-200" />
            ) : null}
            <StepIcon status={step.status} />
            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{step.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {step.type.replace(/[._-]+/g, " ")} - {formatDateTime(step.startedAt)}
                  </p>
                </div>
                <span className={cx("rounded-full border px-2 py-1 text-xs font-semibold", meta.bg, meta.border, meta.text)}>
                  {meta.label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>Duration: {formatDuration(step.durationMs)}</span>
                <span>Attempts: {step.attempts}</span>
                {step.completedAt ? <span>Finished: {formatDateTime(step.completedAt)}</span> : null}
              </div>

              {step.error ? (
                <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {step.error}
                </div>
              ) : null}

              {step.output !== undefined ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
                    Step context
                  </summary>
                  <div className="mt-2 grid gap-2 lg:grid-cols-2">
                    <JsonPanel title="Input" value={step.input} />
                    <JsonPanel title="Output" value={step.output} />
                  </div>
                </details>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RunDetail({
  run,
  loading,
  error,
  onOpenWorkflow,
}: {
  run: WorkflowRunListItem | null;
  loading: boolean;
  error: string | null;
  onOpenWorkflow: (workflowId: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading run context...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 shadow-sm">
        <div className="max-w-sm text-center">
          <AlertCircle size={28} className="mx-auto text-rose-500" />
          <h2 className="mt-3 text-base font-semibold text-slate-950">Could not load this run</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 shadow-sm">
        <div className="max-w-sm text-center">
          <Eye size={28} className="mx-auto text-slate-300" />
          <h2 className="mt-3 text-base font-semibold text-slate-950">Select a workflow run</h2>
          <p className="mt-2 text-sm text-slate-500">
            Choose a run to see the exact path, waiting point, trigger payload, and step outputs.
          </p>
        </div>
      </div>
    );
  }

  const steps = run.steps ?? run.stepTrail ?? [];

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <RunStatusBadge status={run.status} />
                <span className="text-xs font-medium text-slate-400">Run #{shortId(run.id)}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold leading-tight text-slate-950">{run.workflowName}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{summarizeRun(run)}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<WorkflowIcon size={14} />}
              onClick={() => onOpenWorkflow(run.workflowId)}
            >
              Open workflow
            </Button>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <StepTrailPreview steps={steps} />
          </div>
        </div>

        <div className="grid divide-y divide-slate-200 border-t border-slate-200 bg-slate-50/70 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          <ContextBlock
            icon={<User size={14} />}
            label="Contact"
            value={<span className="break-words">{run.contact.name}</span>}
            helper={run.contact.phone || run.contact.email || run.contact.company || "No contact detail"}
          />
          <ContextBlock
            icon={<Zap size={14} />}
            label="Trigger"
            value={<span className="break-words">{run.trigger.label}</span>}
            helper={run.trigger.reference || run.trigger.event}
          />
          <ContextBlock
            icon={<Clock size={14} />}
            label="Runtime"
            value={formatDuration(run.durationMs)}
            helper={`Started ${formatDateTime(run.startedAt)}`}
          />
          <ContextBlock
            icon={<GitBranch size={14} />}
            label="Path"
            value={`${run.progress.completed}/${run.progress.total} steps`}
            helper={`${run.progress.percent}% mapped coverage`}
          />
        </div>
      </section>

      {run.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-semibold text-rose-800">Failure reason</p>
              <p className="mt-1 text-sm leading-6 text-rose-700">{run.error}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-950">Execution Path</h3>
              </div>
              <p className="mt-1 text-sm text-slate-500">The ordered path this run actually took.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {steps.length} events
            </span>
          </div>
          <StepTimeline steps={steps} />
        </section>

        <aside className="space-y-4 xl:sticky xl:top-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Info size={16} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-950">Run Context</h3>
            </div>
            <div className="space-y-3">
              <JsonPanel title="Trigger data" value={run.triggerData} />
              <JsonPanel title="Variables" value={run.variables} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function WorkflowProgressPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [runs, setRuns] = useState<WorkflowRunListItem[]>([]);
  const [summary, setSummary] = useState<WorkflowRunSummary>(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState<WorkflowRunListResponse["pagination"]>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RunFilterStatus>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<WorkflowRunListItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useMobileHeaderActions(
    isMobile
      ? {
          title: "Workflow Progress",
          backTo: "/workflows",
          panel: (
            <SearchInput
              placeholder="Search runs..."
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              appearance="toolbar"
              onClear={() => setSearchDraft("")}
              clearAriaLabel="Clear workflow run search"
              aria-label="Search workflow runs"
            />
          ),
        }
      : {},
    [isMobile, searchDraft],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchDraft.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const loadRuns = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await workspaceApi.listWorkflowRuns({
          page,
          limit: pagination.limit,
          search: search || undefined,
          status,
        });

        const items = Array.isArray(response.items) ? response.items : [];
        setRuns(items);
        setSummary(response.summary ?? EMPTY_SUMMARY);
        setPagination(response.pagination);
        setSelectedRunId((current) =>
          current && items.some((item) => item.id === current)
            ? current
            : items[0]?.id ?? null,
        );
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Could not load workflow runs");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, pagination.limit, search, status],
  );

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    if (!selectedRunId) {
      setSelectedRun(null);
      return;
    }

    let active = true;
    setDetailLoading(true);
    setDetailError(null);

    workspaceApi
      .getWorkflowRun(selectedRunId)
      .then((run) => {
        if (active) setSelectedRun(run);
      })
      .catch((nextError) => {
        if (active) {
          setDetailError(nextError instanceof Error ? nextError.message : "Could not load run details");
        }
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRunId]);

  const filteredTotalLabel = useMemo(() => {
    if (pagination.total === summary.total) return `${pagination.total} runs`;
    return `${pagination.total} of ${summary.total} runs`;
  }, [pagination.total, summary.total]);

  const getStatusFilterCount = (value: RunFilterStatus) =>
    value === "all" ? summary.total : summary[value];

  const handleStatusChange = (nextStatus: RunFilterStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  return (
    <PageLayout
      title="Workflow Progress"
      subtitle="Understand where automations are moving, waiting, or breaking."
      leading={
        <IconButton
          aria-label="Back to workflows"
          icon={<ArrowLeft size={16} />}
          variant="secondary"
          onClick={() => navigate("/workflows")}
        />
      }
      actions={
        <div className="hidden items-center gap-2 md:flex">
          <SearchInput
            placeholder="Search run, workflow, contact..."
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onClear={() => setSearchDraft("")}
            clearAriaLabel="Clear workflow run search"
            appearance="toolbar"
            className="w-72"
          />
          <Tooltip content="Refresh workflow progress">
            <span className="inline-flex">
              <IconButton
                aria-label="Refresh workflow progress"
                icon={<RefreshCw size={15} />}
                variant="secondary"
                loading={refreshing}
                onClick={() => void loadRuns(true)}
              />
            </span>
          </Tooltip>
        </div>
      }
      toolbar={
        <div className="hidden items-center gap-2 overflow-x-auto md:flex">
          {RUN_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant="tab"
              radius="none"
              selected={status === filter.value}
              onClick={() => handleStatusChange(filter.value)}
              rightIcon={
                <span className="text-xs tabular-nums opacity-75">
                  {getStatusFilterCount(filter.value)}
                </span>
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      }
      contentClassName="flex-1 overflow-auto bg-slate-50 px-0 py-0"
    >
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-5 px-4 py-5 md:px-6">
        <OperationsSummary summary={summary} />
        <div className="grid items-start gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <>
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Run queue</p>
                  <h2 className="mt-1 text-base font-semibold text-slate-950">{filteredTotalLabel}</h2>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<RefreshCw size={14} />}
                  loading={refreshing}
                  onClick={() => void loadRuns(true)}
                >
                  Refresh
                </Button>
              </div>

              {isMobile ? (
                <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3">
                  {RUN_FILTERS.map((filter) => (
                    <Button
                      key={filter.value}
                      variant="tab"
                      radius="none"
                      selected={status === filter.value}
                      onClick={() => handleStatusChange(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              ) : null}

              <div className="max-h-[680px] overflow-auto bg-slate-50/60 p-3 xl:max-h-[calc(100vh-360px)]">
                {loading ? (
                  <div className="flex h-56 items-center justify-center text-sm text-slate-500">
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Loading workflow runs...
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {error}
                  </div>
                ) : runs.length === 0 ? (
                  <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-6 text-center">
                    <div className="max-w-xs">
                      <MessageSquare size={28} className="mx-auto text-slate-300" />
                      <h3 className="mt-3 text-sm font-semibold text-slate-950">No runs match this view</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Try another status, clear search, or wait for a published workflow to run.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {runs.map((run) => (
                      <RunCard
                        key={run.id}
                        run={run}
                        selected={selectedRunId === run.id}
                        onSelect={() => setSelectedRunId(run.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white">
                <ListPagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={pagination.limit}
                  itemLabel="runs"
                  onPageChange={setPage}
                />
              </div>
            </section>

            <section className="min-w-0">
              <RunDetail
                run={selectedRun}
                loading={detailLoading}
                error={detailError}
                onOpenWorkflow={(workflowId) => navigate(`/workflows/${workflowId}`)}
              />
            </section>
          </>
        </div>
      </div>
    </PageLayout>
  );
}
