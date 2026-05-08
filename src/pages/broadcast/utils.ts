import type { BroadcastRunStatus } from "../../lib/broadcastApi";

export function templateVariableKeys(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === "string");
  }
  if (typeof raw === "object" && raw !== null && "length" in raw) {
    try {
      return Array.from(raw as string[]).filter((value) => typeof value === "string");
    } catch {
      return [];
    }
  }
  return [];
}

export function statusLabel(status: string) {
  if (status === "partial_failure") return "Needs attention";
  if (status === "dead_letter") return "Needs manual review";
  if (status === "completed") return "Sent";
  if (status === "scheduled") return "Scheduled";
  if (status === "running") return "Sending";
  if (status === "sending") return "Sending";
  if (status === "queued") return "Ready to send";
  if (status === "pending") return "Waiting";
  if (status === "sent") return "Sent";
  if (status === "delivered") return "Delivered";
  if (status === "read") return "Read";
  if (status === "failed") return "Could not send";
  if (status === "unsubscribed") return "Unsubscribed";
  if (status === "bounced") return "Could not deliver";
  return status;
}

export function contentModeLabel(mode?: string | null) {
  if (mode === "template") return "Approved template";
  if (mode === "text") return "Text message";
  return mode || "-";
}

export function templateFieldLabel(key: string) {
  const normalized = key.trim();
  if (!normalized) return "Template field";
  if (/^\d+$/.test(normalized)) return `Field ${normalized}`;

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^./, (first) => first.toUpperCase());
}

export function statusBadgeClass(status: string) {
  if (status === "partial_failure") return "bg-amber-100 text-amber-800";
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "scheduled") return "bg-[var(--color-primary-light)] text-[var(--color-primary)]";
  if (status === "running") return "bg-[var(--color-primary-light)] text-[var(--color-primary)]";
  return "bg-gray-100 text-gray-700";
}

type DateInput = string | number | Date | null | undefined;

function toValidDate(value?: DateInput) {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: DateInput) {
  const date = toValidDate(value);
  if (!date) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: DateInput) {
  const date = toValidDate(value);
  if (!date) return "-";

  return `${formatDate(date)}, ${formatTime(date)}`;
}

export function formatTime(value?: DateInput) {
  const date = toValidDate(value);
  if (!date) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatWeekday(value?: DateInput) {
  const date = toValidDate(value);
  if (!date) return "";

  return date.toLocaleDateString("en-GB", { weekday: "long" });
}

export function formatMonthYear(value?: DateInput) {
  const date = toValidDate(value);
  if (!date) return "";

  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function calendarStatusLabel(status: string) {
  if (status === "completed") return "Sent";
  if (status === "partial_failure") return "Needs attention";
  return statusLabel(status);
}

export function canMutateBroadcast(status?: string) {
  return status === "scheduled";
}

export function statusFilterToApiStatus(value: string): BroadcastRunStatus | undefined {
  if (value === "Scheduled") return "scheduled";
  if (value === "Sending") return "running";
  if (value === "Sent") return "completed";
  if (value === "Needs attention") return "partial_failure";
  return undefined;
}
