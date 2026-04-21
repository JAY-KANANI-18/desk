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
  if (status === "partial_failure") return "Partial failure";
  if (status === "completed") return "Completed";
  if (status === "scheduled") return "Scheduled";
  if (status === "running") return "Running";
  return status;
}

export function statusBadgeClass(status: string) {
  if (status === "partial_failure") return "bg-amber-100 text-amber-800";
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "scheduled") return "bg-indigo-100 text-indigo-700";
  if (status === "running") return "bg-violet-100 text-violet-700";
  return "bg-gray-100 text-gray-700";
}

export function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

export function formatTime(value?: string | null) {
  return value
    ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
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

export function calendarEventClass(status: string) {
  if (status === "completed" || status === "sent") {
    return "border-l-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100";
  }
  if (status === "partial_failure" || status === "failed") {
    return "border-l-red-500 bg-red-50 text-red-900 hover:bg-red-100";
  }
  if (status === "scheduled") {
    return "border-l-indigo-500 bg-indigo-50 text-indigo-900 hover:bg-indigo-100";
  }
  if (status === "running") {
    return "border-l-violet-500 bg-violet-50 text-violet-900 hover:bg-violet-100";
  }
  return "border-l-gray-400 bg-gray-50 text-gray-800 hover:bg-gray-100";
}

export function calendarStatusLabel(status: string) {
  if (status === "completed") return "Sent";
  if (status === "partial_failure") return "Failed";
  return statusLabel(status);
}

export function canMutateBroadcast(status?: string) {
  return status === "scheduled";
}

export function statusFilterToApiStatus(value: string): BroadcastRunStatus | undefined {
  if (value === "Scheduled") return "scheduled";
  if (value === "Running") return "running";
  if (value === "Completed") return "completed";
  if (value === "Partial failure") return "partial_failure";
  return undefined;
}
