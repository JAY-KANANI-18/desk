import type { BroadcastStatusFilter } from "./types";

export const BROADCAST_PAGE_SIZE = 25;

export const STATUS_FILTERS: BroadcastStatusFilter[] = [
  { name: "All", color: "bg-gray-400" },
  { name: "Scheduled", color: "bg-[var(--color-primary)]" },
  { name: "Running", color: "bg-[var(--color-primary)]" },
  { name: "Completed", color: "bg-emerald-500" },
  { name: "Partial failure", color: "bg-amber-500" },
];

export const CALENDAR_WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
